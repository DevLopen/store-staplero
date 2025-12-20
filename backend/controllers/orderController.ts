import { Request, Response } from "express";
import Order from "../models/Order";

export const getUserOrders = async (req: Request, res: Response) => {
    const userEmail = req.query.email as string;
    try {
        const orders = await Order.find({ userEmail });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};
