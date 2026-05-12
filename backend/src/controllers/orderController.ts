import { Request, Response } from "express";
import Order from "../models/Order";
import orderService from "../services/order.service";

/**
 * GET /api/orders
 * Get all orders (Admin sees all, regular user sees only their orders)
 */
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { page = "1", limit = "20", search, status } = req.query;
        const pageNum  = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip     = (pageNum - 1) * limitNum;

        if (!user.isAdmin) {
            // Non-admin: return own orders without pagination
            const orders = await orderService.getUserOrders(user._id);
            return res.json({ orders });
        }

        // Build admin filter
        const filter: any = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { "userDetails.name":  { $regex: search, $options: "i" } },
                { "userDetails.email": { $regex: search, $options: "i" } },
                { orderNumber:         { $regex: search, $options: "i" } },
            ];
        }

        const [orders, total] = await Promise.all([
            Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            Order.countDocuments(filter),
        ]);

        const formattedOrders = orders.map(order => ({
            id: order._id,
            _id: order._id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            userEmail: order.userDetails.email,
            userName: order.userDetails.name,
            items: order.items.map((item: any) => ({
                id: item.courseId || `item-${Date.now()}`,
                type: item.type === "online" ? "online_course" : "practical_course",
                name: item.courseName,
                courseName: item.courseName,
                price: item.price,
                courseId: item.courseId,
            })),
            total: order.totalAmount,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
            paidAt: order.paidAt,
            expiresAt: order.expiresAt,
            customerInfo: {
                firstName: order.userDetails.name.split(" ")[0] || "",
                lastName: order.userDetails.name.split(" ").slice(1).join(" ") || "",
                email: order.userDetails.email,
                phone: order.userDetails.phone,
                address: order.userDetails.address,
                city: order.userDetails.city,
                postalCode: order.userDetails.postalCode,
            },
            practicalCourseDetails: order.practicalCourseDetails,
        }));

        res.json({
            orders: formattedOrders,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
        });
    } catch (err) {
        console.error("❌ Error fetching orders:", err);
        res.status(500).json({ message: "Server error", error: err });
    }
};

/**
 * GET /api/orders/:id
 * Get single order by ID
 */
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        // Guard against non-ObjectId params (e.g. "admin")
        if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
            return res.status(404).json({ message: "Order not found" });
        }
        const order = await orderService.findOrderById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Sprawdź czy user jest adminem lub właścicielem zamówienia
        if (!user.isAdmin && order.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        res.json({ order });
    } catch (err) {
        console.error("❌ Error fetching order:", err);
        res.status(500).json({ message: "Server error", error: err });
    }
};

/**
 * PUT /api/orders/:id/status
 * Update order status (Admin only)
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        console.log(`✅ Order ${order.orderNumber} status updated to ${status}`);
        res.json({ message: "Order status updated", order });
    } catch (err) {
        console.error("❌ Error updating order status:", err);
        res.status(500).json({ message: "Server error", error: err });
    }
};