import Order, { OrderDoc } from "../models/Order";
import User from "../models/User";
import { UserCourse } from "../models/UserCourse";
import emailService from "./email.service";

/**
 * Create a new order
 */
export const createOrder = async (orderData: Partial<OrderDoc>): Promise<OrderDoc> => {
    const order = new Order(orderData);
    await order.save();
    return order;
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

        // Send confirmation email
        const user = await User.findById(order.userId);
        if (user) {
            for (const item of order.items) {
                if (item.courseId) {
                    await emailService.sendOnlineCoursePurchaseEmail(
                        user.email,
                        user.name,
                        item.courseName,
                        order.orderNumber,
                        expiresAt
                    );
                }
            }
        }
    }

    // For practical courses, send booking confirmation
    if (order.type === "practical" && order.practicalCourseDetails) {
        const user = await User.findById(order.userId);
        if (user) {
            await emailService.sendPracticalCourseBookingEmail(
                user.email,
                user.name,
                order.orderNumber,
                order.practicalCourseDetails.locationName,
                order.practicalCourseDetails.locationAddress,
                order.practicalCourseDetails.date,
                order.practicalCourseDetails.time,
                order.practicalCourseDetails.wantsPlasticCard
            );
        }
    }

    await order.save();
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
        // Extend expiration if already exists
        existingCourse.expiresAt = expiresAt;
        existingCourse.status = "active";
        existingCourse.purchaseDate = new Date();
        existingCourse.orderNumber = orderNumber;
        await existingCourse.save();
    } else {
        // Create new course assignment
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

    // Expire UserCourses
    await UserCourse.updateMany(
        { expiresAt: { $lt: now }, status: "active" },
        { status: "expired" }
    );

    // Expire Orders
    await Order.updateMany(
        { expiresAt: { $lt: now }, status: "paid", type: "online" },
        { status: "expired" }
    );

    // Update user's purchased courses
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
            // Get course name from order
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