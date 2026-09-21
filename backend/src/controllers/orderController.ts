import { Request, Response } from "express";
import Order from "../models/Order";
import PracticalCourseParticipant from "../models/PracticalCourseParticipant";
import orderService from "../services/order.service";
import { resolveName } from "../utils/name";

/**
 * Ile osób powinno być zapisanych na kurs praktyczny z tego zamówienia
 * (kupujący + dodatkowi). Źródło prawdy: pozycja "practical" w zamówieniu.
 */
const expectedParticipantCount = (order: any): number => {
    if (order.type !== "practical") return 0;
    const item = (order.items || []).find((i: any) => i.type === "practical");
    return item?.quantity || 1 + (order.practicalCourseDetails?.additionalParticipants?.length || 0);
};

/**
 * Lista osób z zamówienia (z danych zamówienia) + informacja, czy dana osoba
 * ma już rekord uczestnika w kursie (czyli faktycznie została zapisana po opłaceniu).
 */
const buildParticipantsView = (order: any, registered: any[]) => {
    const details = order.practicalCourseDetails;
    if (order.type !== "practical" || !details) return [];

    const buyer = resolveName({
        firstName: order.userDetails?.firstName,
        lastName: order.userDetails?.lastName,
        name: order.userDetails?.name,
    });
    const seats = [
        { seatIndex: 0, ...buyer },
        ...(details.additionalParticipants || []).map((p: any, i: number) => ({
            seatIndex: i + 1,
            ...resolveName(p),
        })),
    ];
    const bySeat = new Map(registered.map((r) => [r.seatIndex ?? 0, r]));

    return seats.map((seat) => {
        const rec = bySeat.get(seat.seatIndex);
        return {
            seatIndex: seat.seatIndex,
            firstName: seat.firstName,
            lastName: seat.lastName,
            name: seat.name,
            isBuyer: seat.seatIndex === 0,
            registered: !!rec,
            participantId: rec?._id,
            participantStatus: rec?.status,
        };
    });
};

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

        // Faktycznie zapisani uczestnicy dla zamówień z tej strony (jedno zapytanie)
        const registeredByOrder = new Map<string, any[]>();
        const practicalIds = orders.filter(o => o.type === "practical").map(o => o._id.toString());
        if (practicalIds.length > 0) {
            const registered = await PracticalCourseParticipant.find({ orderId: { $in: practicalIds } }).lean();
            for (const r of registered) {
                const list = registeredByOrder.get(r.orderId) || [];
                list.push(r);
                registeredByOrder.set(r.orderId, list);
            }
        }

        const formattedOrders = orders.map(order => {
          const participants = buildParticipantsView(order, registeredByOrder.get(order._id.toString()) || []);
          return {
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
                quantity: item.quantity || 1,
                courseId: item.courseId,
            })),
            total: order.totalAmount,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
            paidAt: order.paidAt,
            expiresAt: order.expiresAt,
            customerInfo: {
                firstName: resolveName(order.userDetails).firstName,
                lastName: resolveName(order.userDetails).lastName,
                email: order.userDetails.email,
                phone: order.userDetails.phone,
                address: order.userDetails.address,
                city: order.userDetails.city,
                postalCode: order.userDetails.postalCode,
            },
            type: order.type,
            invoiceNumber: order.invoiceNumber,
            billingAddressDifferent: order.billingAddressDifferent,
            billingAddress: order.billingAddress,
            practicalCourseDetails: order.practicalCourseDetails,
            // Kontrola w panelu admina: ile osób powinno być, ile jest faktycznie zapisanych
            expectedParticipants: expectedParticipantCount(order),
            registeredParticipants: participants.filter(p => p.registered).length,
            participants,
          };
        });

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

/**
 * POST /api/orders/:id/sync-participants  (Admin only)
 * Dopisuje na kurs brakujące osoby z opłaconego zamówienia i koryguje liczbę wolnych miejsc.
 * Idempotentne — służy też do naprawy zamówień opłaconych przed wprowadzeniem wielu uczestników.
 */
export const syncOrderParticipants = async (req: Request, res: Response) => {
    try {
        if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
            return res.status(404).json({ message: "Order not found" });
        }
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.type !== "practical" || !order.practicalCourseDetails) {
            return res.status(400).json({ message: "Nur Praxiskurs-Bestellungen können synchronisiert werden" });
        }
        if (order.status !== "paid") {
            return res.status(400).json({ message: "Nur bezahlte Bestellungen können synchronisiert werden" });
        }

        const { created, total } = await orderService.registerPracticalParticipants(order);
        res.json({
            message: created > 0 ? `${created} Teilnehmer hinzugefügt` : "Alle Teilnehmer waren bereits eingetragen",
            created,
            total,
        });
    } catch (err: any) {
        console.error("❌ Error syncing participants:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
