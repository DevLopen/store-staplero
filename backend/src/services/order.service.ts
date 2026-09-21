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

/**
 * Zapisuje na kurs praktyczny wszystkie osoby z zamówienia (kupujący + dodatkowi)
 * i zmniejsza liczbę wolnych miejsc o tyle, ilu uczestników faktycznie dopisano.
 * Idempotentne — wielokrotne wywołanie nie tworzy duplikatów ani nie zabiera miejsc drugi raz.
 */
export const registerPracticalParticipants = async (
  order: OrderDoc
): Promise<{ created: number; total: number }> => {
  const details = order.practicalCourseDetails;
  if (order.type !== "practical" || !details) return { created: 0, total: 0 };

  const user = await User.findById(order.userId);
  if (!user) throw new Error(`User ${order.userId} for order ${order.orderNumber} not found`);

  const { created, all } = await practicalCourseService.addParticipantsToCourse(order, {
    userId: user._id.toString(),
    name: order.userDetails?.name || user.name,
    firstName: order.userDetails?.firstName || user.firstName,
    lastName: order.userDetails?.lastName || user.lastName,
    email: user.email,
    phone: user.phone,
  });

  if (created.length > 0) {
    const dateId =
      details.dateId || `${details.startDate}_${details.endDate}`.replace(/-/g, "");

    if (!details.locationId || !dateId) {
      console.error("❌ Cannot decrease spots: missing locationId or dateId", {
        locationId: details.locationId,
        dateId,
      });
    } else {
      await practicalCourseService.decreaseAvailableSpots(details.locationId, dateId, created.length);
    }
  }

  return { created: created.length, total: all.length };
};

export const markOrderAsPaid = async (
  orderNumber: string,
  paymentIntentId: string
): Promise<void> => {
  const order = await findOrderByNumber(orderNumber);
  if (!order) throw new Error(`Order ${orderNumber} not found`);

  // Stripe potrafi dostarczyć ten sam webhook wielokrotnie. Drugi raz nie generujemy faktury,
  // nie wysyłamy maili ani nie dublujemy dostępu — tylko dopilnowujemy, żeby uczestnicy
  // kursu praktycznego byli zapisani (idempotentne, zapisuje tylko brakujących).
  if (order.status === "paid") {
    console.log(`ℹ️ Order ${orderNumber} already paid — skipping side effects`);
    if (order.type === "practical") {
      await registerPracticalParticipants(order);
    }
    return;
  }

  order.status = "paid";
  order.paidAt = new Date();
  order.paymentIntentId = paymentIntentId;

  // ── Course access ─────────────────────────────────────────────────────────
  // Uwaga: nadajemy dostęp do kursu online zawsze, gdy w pozycjach zamówienia
  // znajduje się courseId — niezależnie od order.type. Dzięki temu pakiety
  // (kurs praktyczny + dołączony dostęp online) też poprawnie nadają dostęp.
  const courseItems = order.items.filter(i => !!i.courseId);
  if (courseItems.length > 0) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    if (order.type === "online") {
      order.expiresAt = expiresAt;
    }

    for (const item of courseItems) {
      await assignCourseToUser(order.userId, item.courseId as string, order.orderNumber, expiresAt);
    }

    await User.findByIdAndUpdate(order.userId, {
      $push: {
        purchasedCourses: {
          $each: courseItems.map(i => ({
            courseId: i.courseId,
            purchaseDate: order.paidAt,
            expiresAt,
            status: "active",
            orderNumber: order.orderNumber,
          })),
        },
      },
    });
  }

  // ── Invoice generation ────────────────────────────────────────────────────
  try {
    const user = await User.findById(order.userId);
    if (user) {
      const invoiceItems = order.items.map(item => ({
        name: item.courseName,
        quantity: item.quantity || 1,
        unitPrice: item.price,
        vatRate: 19,
      }));

      // Jeśli podano inny adres do faktury, użyj go zamiast danych z konta.
      const billing = order.billingAddressDifferent ? order.billingAddress : undefined;

      const invoice = await lexwareService.createInvoice({
        orderNumber: order.orderNumber,
        customerName: billing?.company || billing?.name || user.name,
        customerEmail: user.email,
        customerAddress: billing?.address || user.address,
        customerCity: billing?.city || user.city,
        customerPostalCode: billing?.postalCode || user.postalCode,
        customerVatId: billing?.vatId,
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

  // ── Practical course: zapis WSZYSTKICH uczestników + zmniejszenie liczby miejsc ──
  if (order.type === "practical" && order.practicalCourseDetails) {
    try {
      await registerPracticalParticipants(order);
    } catch (err: any) {
      console.error("❌ Failed to process practical course:", err.message);
    }

    const theoryDate = new Date(order.practicalCourseDetails.startDate);
    const practiceDate = new Date(theoryDate);
    practiceDate.setDate(practiceDate.getDate() + 1);
    const fmt = (d: Date) => d.toLocaleDateString("de-DE", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    console.log("🔔 sendPracticalCourseBookingEmail wywołane dla:", user.email);
    await emailService.sendPracticalCourseBookingEmail(
        user.email,
        user.name,
        order.orderNumber,
        order.practicalCourseDetails.locationName,
        order.practicalCourseDetails.locationAddress,
        fmt(theoryDate),
        fmt(practiceDate),
        "https://staplero.de/Hinweis.jpeg",
        [
          user.name,
          ...(order.practicalCourseDetails.additionalParticipants || []).map((p) => p.name),
        ]
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
  registerPracticalParticipants,
  assignCourseToUser,
  expireOldCourses,
  getUserOrders,
  sendExpiryReminders,
};
