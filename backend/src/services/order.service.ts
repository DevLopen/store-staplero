import Order, { OrderDoc } from "../models/Order";
import User from "../models/User";
import { UserCourse } from "../models/UserCourse";
import emailService from "./email.service";
import lexwareService from "./lexware.service";
import practicalCourseService from "./practicalCourse.service";

/**
 * Create a new order
 */
export const createOrder = async (orderData: Partial<OrderDoc>): Promise<OrderDoc> => {
    // Generate unique order number
    if (!orderData.orderNumber) {
        const count = await Order.countDocuments();
        orderData.orderNumber = `ORD-${Date.now()}-${count + 1}`;
    }

    const order = new Order(orderData);
    await order.save();

    return order as OrderDoc;
};

/**
 * Find order by ID
 */
export const findOrderById = async (orderId: string): Promise<OrderDoc | null> => {
    return await Order.findById(orderId);
};

/**
 * Find order by order number
 */
export const findOrderByNumber = async (orderNumber: string): Promise<OrderDoc | null> => {
    return await Order.findOne({ orderNumber });
};

/**
 * Find order by Stripe session ID
 */
export const findOrderBySessionId = async (sessionId: string): Promise<OrderDoc | null> => {
    return await Order.findOne({ stripeSessionId: sessionId });
};

/**
 * Update order status to paid and assign courses
 */
export const markOrderAsPaid = async (
    orderNumber: string,
    paymentIntentId: string
): Promise<void> => {
    const order = await findOrderByNumber(orderNumber);
    if (!order) {
        throw new Error(`Order ${orderNumber} not found`);
    }

    // Update order status
    order.status = "paid";
    order.paidAt = new Date();
    order.paymentIntentId = paymentIntentId;

    // For online courses, set expiration date (30 days from payment)
    if (order.type === "online") {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        order.expiresAt = expiresAt;

        // Assign courses to user
        for (const item of order.items) {
            if (item.courseId) {
                await assignCourseToUser(
                    order.userId,
                    item.courseId,
                    order.orderNumber,
                    expiresAt
                );
            }
        }

        // Update user's purchased courses
        await User.findByIdAndUpdate(order.userId, {
            $push: {
                purchasedCourses: order.items
                    .filter((item) => item.courseId)
                    .map((item) => ({
                        courseId: item.courseId,
                        purchaseDate: order.paidAt,
                        expiresAt,
                        status: "active",
                        orderNumber: order.orderNumber,
                    })),
            },
        });
    }

    // **Generuj fakturę w Lexware**
    try {
        const user = await User.findById(order.userId);
        if (!user) {
            throw new Error("User not found");
        }

        console.log(`📄 Rozpoczynam generowanie faktury dla zamówienia ${order.orderNumber}...`);

        // Przygotuj pozycje faktury - użyj już istniejących items z zamówienia
        // Każdy item zawiera już prawidłową cenę brutto (gross)
        const invoiceItems = order.items.map((item) => ({
            name: item.courseName,
            quantity: 1,
            unitPrice: item.price, // To jest już cena brutto z VAT
            vatRate: 19,
        }));

        console.log(`📋 Pozycje faktury:`, JSON.stringify(invoiceItems, null, 2));

        // Stwórz fakturę
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

        // Zapisz dane faktury w zamówieniu
        order.invoiceId = invoice.id;
        order.invoiceNumber = invoice.invoiceNumber;
        order.invoicePdfUrl = invoice.pdfUrl;

        console.log(`✅ Faktura utworzona: ${invoice.invoiceNumber} (ID: ${invoice.id})`);

        // Pobierz PDF faktury (z retry)
        try {
            console.log(`📥 Pobieranie PDF faktury...`);
            const pdfBuffer = await lexwareService.getInvoicePDF(invoice.id);
            console.log(`✅ PDF pobrany, rozmiar: ${pdfBuffer.length} bytes`);

            // Wyślij fakturę na email
            console.log(`📧 Wysyłam fakturę na email: ${user.email}...`);
            await emailService.sendInvoiceEmail(
                user.email,
                user.name,
                order.orderNumber,
                invoice.invoiceNumber,
                pdfBuffer
            );
            console.log(`✅ Faktura wysłana na email`);

        } catch (pdfError: any) {
            console.error("❌ Błąd podczas pobierania lub wysyłki PDF:", pdfError.message);
            // Faktura została utworzona, ale nie udało się wysłać emaila
            // Można dodać flagę do ponownej próby później
        }

    } catch (error: any) {
        console.error("❌ Failed to create invoice:", error.message);
        console.error("Stack:", error.stack);
        // Nie przerywamy procesu - zamówienie pozostaje paid
        // Można dodać logikę retry lub flagę do późniejszej generacji
    }

    await order.save();

    // Send confirmation emails (jak wcześniej)
    const user = await User.findById(order.userId);
    if (user) {
        // **Obsługa kursów praktycznych - dodaj uczestnika i zmniejsz miejsca**
        if (order.type === "practical" && order.practicalCourseDetails) {
            try {
                // Dodaj uczestnika do listy
                await practicalCourseService.addParticipantToCourse(
                    order,
                    user._id.toString(),
                    user.name,
                    user.email,
                    user.phone
                );

                // Zmniejsz liczbę dostępnych miejsc
                const dateId = order.practicalCourseDetails.dateId ||
                    `${order.practicalCourseDetails.startDate}_${order.practicalCourseDetails.endDate}`.replace(/\-/g, '');

                await practicalCourseService.decreaseAvailableSpots(
                    order.practicalCourseDetails.locationId,
                    dateId
                );

                console.log(`✅ Practical course participant added for order ${order.orderNumber}`);
            } catch (error: any) {
                console.error("❌ Failed to add participant:", error.message);
                // Nie przerywamy procesu - uczestnik może być dodany ręcznie później
            }
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

        if (order.type === "practical" && order.practicalCourseDetails) {
            await emailService.sendPracticalCourseBookingEmail(
                user.email,
                user.name,
                order.orderNumber,
                order.practicalCourseDetails.locationName,
                order.practicalCourseDetails.locationAddress,
                `${order.practicalCourseDetails.startDate} - ${order.practicalCourseDetails.endDate}`,
                order.practicalCourseDetails.time,
                order.practicalCourseDetails.wantsPlasticCard
            );
        }
    }
};

/**
 * Assign course to user with expiration
 */
export const assignCourseToUser = async (
    userId: string,
    courseId: string,
    orderNumber: string,
    expiresAt: Date
): Promise<void> => {
    const existingCourse = await UserCourse.findOne({ userId, courseId });

    if (existingCourse) {
        existingCourse.expiresAt = expiresAt;
        existingCourse.status = "active";
        existingCourse.purchaseDate = new Date();
        existingCourse.orderNumber = orderNumber;
        await existingCourse.save();
    } else {
        await UserCourse.create({
            userId,
            courseId,
            purchaseDate: new Date(),
            expiresAt,
            status: "active",
            orderNumber,
        });
    }
};

/**
 * Check and expire old courses
 */
export const expireOldCourses = async (): Promise<void> => {
    const now = new Date();

    await UserCourse.updateMany(
        { expiresAt: { $lt: now }, status: "active" },
        { status: "expired" }
    );

    await Order.updateMany(
        { expiresAt: { $lt: now }, status: "paid", type: "online" },
        { status: "expired" }
    );

    const expiredCourses = await UserCourse.find({
        expiresAt: { $lt: now },
        status: "expired",
    });

    for (const course of expiredCourses) {
        await User.updateOne(
            {
                _id: course.userId,
                "purchasedCourses.courseId": course.courseId,
            },
            {
                $set: { "purchasedCourses.$.status": "expired" },
            }
        );
    }
};

/**
 * Get user's orders
 */
export const getUserOrders = async (userId: string): Promise<OrderDoc[]> => {
    return await Order.find({ userId }).sort({ createdAt: -1 });
};

/**
 * Send expiry reminders (3 days before expiration)
 */
export const sendExpiryReminders = async (): Promise<void> => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const startOfDay = new Date(threeDaysFromNow);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(threeDaysFromNow);
    endOfDay.setHours(23, 59, 59, 999);

    const expiringCourses = await UserCourse.find({
        expiresAt: { $gte: startOfDay, $lte: endOfDay },
        status: "active",
    });

    for (const course of expiringCourses) {
        const user = await User.findById(course.userId);
        if (user) {
            const order = await Order.findOne({ orderNumber: course.orderNumber });
            const courseName = order?.items[0]?.courseName || "Ihr Kurs";

            await emailService.sendExpiryReminderEmail(
                user.email,
                user.name,
                courseName,
                course.expiresAt
            );
        }
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