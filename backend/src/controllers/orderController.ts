import { Request, Response } from "express";
import Order from "../models/Order";
import { UserCourse } from "../models/UserCourse";

export const getUserOrders = async (req: Request, res: Response) => {
    const userEmail = req.query.email as string;
    try {
        const orders = await Order.find({ userEmail });

        // Przypisz kursy jeśli zamówienie opłacone
        for (const order of orders) {
            if (order.status === "paid") {
                for (const item of order.items) {
                    const exists = await UserCourse.findOne({ userId: order.userId, courseId: item.courseId });
                    if (!exists) {
                        await UserCourse.create({ userId: order.userId, courseId: item.courseId });
                    }
                }
            }
        }

        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err });
    }
};
