import Order, { OrderDoc } from "../models/Order";
import User from "../models/User";
import { UserCourse } from "../models/UserCourse";
import emailService from "./email.service";
import lexwareService from "./lexware.service";
import practicalCourseService from "./practicalCourse.service";

export const createOrder = async (orderData: Partial<OrderDoc>): Promise<OrderDoc> => {
  if (!orderData.orderNumber) {
    const count = await Order.countDocuments();
    orderData.orderNumber = `ORD-${Date.now()}-${count + 1}`;
  }
  const order = new Order(orderData);
  await order.save();
  return order as OrderDoc;
};

export const findOrderById = async (id: string): Promise<OrderDoc | null> =>
  Order.findById(id);

export const findOrderByNumber = async (orderNumber: string): Promise<OrderDoc | null> =>
  Order.findOne({ orderNumber });

export const findOrderBySessionId = async (sessionId: string): Promise<OrderDoc | null> =>
  Order.findOne({ stripeSessionId: sessionId });

export const markOrderAsPaid = async (
  orderNumber: string,
  paymentIntentId: string
): Promise<void> => {
  const order = await findOrderByNumber(orderNumber);
  if (!order) throw new Error(`Order ${orderNumber} not found`);

  order.status = "paid";
  order.paidAt = new Date();
  order.paymentIntentId = paymentIntentId;

  // ── Online courses ────────────────────────────────────────────────────────
  if (order.type === "online") {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    order.expiresAt = expiresAt;

    for (const item of order.items) {
      if (item.courseId) {
        await assignCourseToUser(order.userId, item.courseId, order.orderNumber, expiresAt);
      }
    }

    await User.findByIdAndUpdate(order.userId, {
      $push: {
        purchasedCourses: order.items
          .filter(i => i.courseId)
          .map(i => ({
            courseId: i.courseId,
            purchaseDate: order.paidAt,
            expiresAt,
            status: "active",
            orderNumber: order.orderNumber,
          })),
      },
    });
  }

  // ── Invoice generation ────────────────────────────────────────────────────
  try {
    const user = await User.findById(order.userId);
    if (user) {
      const invoiceItems = order.items.map(item => ({
        name: item.courseName,
        quantity: 1,
        unitPrice: item.price,
        vatRate: 19,
      }));

      const invoice = await lexwareService.createInvoice({
        orderNumber: order.orderNumber,
        customerName: user.name,
        customerEmail: user.email,
        customerAddress: user.address,
        customerCity: user.city,
        customerPostalCode: user.postalCode,
        items: invoiceItems,
        totalAmount: order.totalAmount,
        currency: "EUR",
      });

      order.invoiceId = invoice.id;
      order.invoiceNumber = invoice.invoiceNumber;
      order.invoicePdfUrl = invoice.pdfUrl;

      try {
        const pdfBuffer = await lexwareService.getInvoicePDF(invoice.id);
        await emailService.sendInvoiceEmail(
          user.email, user.name, order.orderNumber, invoice.invoiceNumber, pdfBuffer
        );
      } catch (pdfErr: any) {
        console.error("❌ Failed to send invoice PDF:", pdfErr.message);
      }
    }
  } catch (invoiceErr: any) {
    console.error("❌ Failed to create invoice:", invoiceErr.message);
  }

  await order.save();

  // ── Post-save side effects ────────────────────────────────────────────────
  const user = await User.findById(order.userId);
  if (!user) return;

  // ── FIX: Practical course spots decrease ─────────────────────────────────
  if (order.type === "practical" && order.practicalCourseDetails) {
    try {
      await practicalCourseService.addParticipantToCourse(
        order,
        user._id.toString(),
        user.name,
        user.email,
        user.phone
      );

      // FIX: dateId is now guaranteed to come from order.practicalCourseDetails.dateId
      // which was saved correctly in checkoutController. Fallback only as safety net.
      const details = order.practicalCourseDetails;
      const dateId =
        details.dateId ||
        `${details.startDate}_${details.endDate}`.replace(/-/g, "");

      if (!details.locationId || !dateId) {
        console.error("❌ Cannot decrease spots: missing locationId or dateId", {
          locationId: details.locationId,
          dateId,
        });
      } else {
        await practicalCourseService.decreaseAvailableSpots(details.locationId, dateId);
        console.log(`✅ Spots decreased for ${details.locationName} / ${dateId}`);
      }
    } catch (err: any) {
      console.error("❌ Failed to process practical course:", err.message);
    }

    await emailService.sendPracticalCourseBookingEmail(
      user.email,
      user.name,
      order.orderNumber,
      order.practicalCourseDetails.locationName,
      order.practicalCourseDetails.locationAddress,
      `${order.practicalCourseDetails.startDate} – ${order.practicalCourseDetails.endDate}`,
      order.practicalCourseDetails.time,
      order.practicalCourseDetails.wantsPlasticCard
    );
  }

  if (order.type === "online") {
    for (const item of order.items) {
      if (item.courseId && order.expiresAt) {
        await emailService.sendOnlineCoursePurchaseEmail(
          user.email,
          user.name,
          item.courseName,
          order.orderNumber,
          order.expiresAt
        );
      }
    }
  }
};

export const assignCourseToUser = async (
  userId: string,
  courseId: string,
  orderNumber: string,
  expiresAt: Date
): Promise<void> => {
  const existing = await UserCourse.findOne({ userId, courseId });
  if (existing) {
    existing.expiresAt = expiresAt;
    existing.status = "active";
    existing.purchaseDate = new Date();
    existing.orderNumber = orderNumber;
    await existing.save();
  } else {
    await UserCourse.create({ userId, courseId, purchaseDate: new Date(), expiresAt, status: "active", orderNumber });
  }
};

export const expireOldCourses = async (): Promise<void> => {
  const now = new Date();
  await UserCourse.updateMany({ expiresAt: { $lt: now }, status: "active" }, { status: "expired" });
  await Order.updateMany({ expiresAt: { $lt: now }, status: "paid", type: "online" }, { status: "expired" });

  const expired = await UserCourse.find({ status: "expired" });
  for (const uc of expired) {
    await User.updateOne(
      { _id: uc.userId, "purchasedCourses.courseId": uc.courseId },
      { $set: { "purchasedCourses.$.status": "expired" } }
    );
  }
};

export const getUserOrders = async (userId: string): Promise<OrderDoc[]> =>
  Order.find({ userId }).sort({ createdAt: -1 });

export const sendExpiryReminders = async (): Promise<void> => {
  const day = new Date();
  day.setDate(day.getDate() + 3);
  const start = new Date(day.setHours(0, 0, 0, 0));
  const end = new Date(day.setHours(23, 59, 59, 999));

  const expiring = await UserCourse.find({ expiresAt: { $gte: start, $lte: end }, status: "active" });
  for (const uc of expiring) {
    const user = await User.findById(uc.userId);
    if (!user) continue;
    const order = await Order.findOne({ orderNumber: uc.orderNumber });
    const courseName = order?.items[0]?.courseName || "Kurs";
    await emailService.sendExpiryReminderEmail(user.email, user.name, courseName, uc.expiresAt);
  }
};

export default {
  createOrder,
  findOrderById,
  findOrderByNumber,
  findOrderBySessionId,
  markOrderAsPaid,
  assignCourseToUser,
  expireOldCourses,
  getUserOrders,
  sendExpiryReminders,
};
