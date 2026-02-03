import { Request, Response } from "express";
import Order from "../models/Order";
import orderService from "../services/order.service";

/**
 * GET /api/orders
 * Get all orders (Admin sees all, regular user sees only their orders)
 */
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user; // Z middleware protect

        let orders;
        if (user.isAdmin) {
            // Admin widzi wszystkie zamówienia
            orders = await Order.find().sort({ createdAt: -1 });
            console.log(`✅ Admin fetched ${orders.length} orders`);
        } else {
            // Zwykły użytkownik widzi tylko swoje
            orders = await orderService.getUserOrders(user._id);
            console.log(`✅ User ${user.email} fetched ${orders.length} orders`);
        }

        // Mapowanie do formatu oczekiwanego przez frontend
        const formattedOrders = orders.map(order => ({
            id: order._id,
            _id: order._id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            userEmail: order.userDetails.email,
            userName: order.userDetails.name,
            items: order.items.map(item => ({
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

        res.json({ orders: formattedOrders });
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