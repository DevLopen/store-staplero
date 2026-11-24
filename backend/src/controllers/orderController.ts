import { Request, Response } from "express";
import Order from "../models/Order";
import PracticalCourseParticipant from "../models/PracticalCourseParticipant";
import orderService from "../services/order.service";
import { resolveName } from "../utils/name";
import { practicalPeople, practicalParticipantCount, getOrderSeats, buyerParticipates } from "../services/orderSeat.service";
import OrderSeat, { OrderSeatDoc } from "../models/OrderSeat";
import { SeatError, issueInvite, withdrawInvite, updateSeatNames, ownerSeatView } from "../services/seatInvite.service";
import { revokeOrderAccess, resetClaimedSeat } from "../services/orderAccess.service";

/**
 * Ile osób powinno być zapisanych na kurs praktyczny z tego zamówienia
 * (kupujący + dodatkowi). Źródło prawdy: pozycja "practical" w zamówieniu.
 */
const expectedParticipantCount = (order: any): number => {
    if (order.type !== "practical") return 0;
    const item = (order.items || []).find((i: any) => i.type === "practical");
    return item?.quantity || practicalParticipantCount(order);
};

/**
 * Lista osób z zamówienia (z danych zamówienia) + informacja, czy dana osoba
 * ma już rekord uczestnika w kursie (czyli faktycznie została zapisana po opłaceniu).
 */
const buildParticipantsView = (order: any, registered: any[]) => {
    const details = order.practicalCourseDetails;
    if (order.type !== "practical" || !details) return [];

    // kupujący jest seatIndex 0 tylko wtedy, gdy sam uczestniczy
    const seats = practicalPeople(order, {
        firstName: order.userDetails?.firstName,
        lastName: order.userDetails?.lastName,
        name: order.userDetails?.name,
    });
    const bySeat = new Map(registered.map((r) => [r.seatIndex ?? 0, r]));

    return seats.map((seat) => {
        const rec = bySeat.get(seat.seatIndex);
        return {
            seatIndex: seat.seatIndex,
            firstName: seat.firstName,
            lastName: seat.lastName,
            name: seat.name,
            isBuyer: seat.isBuyer,
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
            confirmationEmailSentAt: order.confirmationEmailSentAt,
            confirmationEmailError: order.confirmationEmailError,
            accessRevokedAt: order.accessRevokedAt ?? null,
            accessRevokedBy: order.accessRevokedBy ?? null,
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
            buyerParticipates: order.buyerParticipates !== false,
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

/**
 * POST /api/orders/:id/resend-confirmation  (Admin only)
 * Ponownie wysyła klientowi mail z informacjami o kursie (termin, dojazd, co zabrać / dostęp online).
 */
export const resendOrderConfirmation = async (req: Request, res: Response) => {
    try {
        if (!req.params.id.match(/^[a-f\d]{24}$/i)) {
            return res.status(404).json({ message: "Order not found" });
        }
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        if (order.status !== "paid") {
            return res.status(400).json({ message: "Nur bezahlte Bestellungen" });
        }

        await orderService.sendOrderConfirmationEmail(order, { force: true });
        res.json({ message: "Bestätigungs-E-Mail gesendet", confirmationEmailSentAt: order.confirmationEmailSentAt });
    } catch (err: any) {
        console.error("❌ Error resending confirmation:", err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

/** Zamówienie dostępne dla właściciela (albo admina); inaczej 404/403 — jak getOrderById */
const loadOwnedOrder = async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) { res.status(404).json({ code: "NOT_FOUND" }); return null; }
    const order = await Order.findById(req.params.id);
    if (!order) { res.status(404).json({ code: "NOT_FOUND" }); return null; }
    if (!user.isAdmin && String(order.userId) !== String(user._id)) { res.status(403).json({ code: "FORBIDDEN" }); return null; }
    return order;
};

/**
 * GET /api/orders/:id/seats  (właściciel zamówienia albo admin)
 * Miejsca (OrderSeat): status, e-mail, imię i nazwisko, ważność. Nigdy bez hashy tokenów.
 * Admin dostaje dodatkowo powiązania (konto, uczestnik kursu).
 */
export const getOrderSeatsForOwner = async (req: Request, res: Response) => {
    try {
        const order = await loadOwnedOrder(req, res);
        if (!order) return;
        const isAdmin = (req as any).user?.isAdmin === true;
        const seats = await getOrderSeats(String(order._id));
        res.json({
            order: {
                id: String(order._id),
                orderNumber: order.orderNumber,
                type: order.type,
                status: order.status,
                paidAt: order.paidAt || null,
                language: order.language || "de",
                buyerParticipates: buyerParticipates(order),
            },
            seats: seats.map((s: any) => ({
                ...ownerSeatView(s, order),
                ...(isAdmin ? {
                    rawStatus: s.status,
                    courseId: s.courseId || null,
                    claimedByUserId: s.claimedByUserId || null,
                    practicalParticipantId: s.practicalParticipantId || null,
                    sendCount: s.sendCount || 0,
                } : {}),
            })),
        });
    } catch (err: any) {
        console.error("❌ Error loading seats:", err);
        res.status(500).json({ message: "Server error" });
    }
};

/** Miejsce należące do zamówienia z :id (inaczej 404) */
const loadOwnedSeat = async (req: Request, res: Response) => {
    const order = await loadOwnedOrder(req, res);
    if (!order) return null;
    if (!/^[a-f\d]{24}$/i.test(req.params.seatId)) { res.status(404).json({ code: "NOT_FOUND" }); return null; }
    const seat = await OrderSeat.findOne({ _id: req.params.seatId, orderId: String(order._id) });
    if (!seat) { res.status(404).json({ code: "NOT_FOUND" }); return null; }
    if (order.status !== "paid") { res.status(400).json({ code: "ORDER_NOT_PAID" }); return null; }
    return { order, seat };
};

const seatErr = (res: Response, err: any) => {
    if (err instanceof SeatError) return res.status(err.status).json({ code: err.code });
    console.error("❌ Seat action failed:", err);
    return res.status(500).json({ code: "SERVER_ERROR" });
};

/**
 * PATCH /api/orders/:id/seats/:seatId  (właściciel)  { email?, firstName?, lastName? } — zaproszenie zawsze w języku kupującego
 * - wolne miejsce + e-mail → zaproszenie
 * - zaproszone miejsce + inny e-mail (albo język) → nowe zaproszenie, stary link przestaje działać
 * - imię i nazwisko (kurs praktyczny) dla niezajętych miejsc
 * Zajęte miejsce zmienia tylko admin (info@staplero.de).
 */
export const updateOwnedSeat = async (req: Request, res: Response) => {
    try {
        const loaded = await loadOwnedSeat(req, res);
        if (!loaded) return;
        let seat: OrderSeatDoc = loaded.seat;
        if (seat.status === "claimed") return res.status(409).json({ code: "SEAT_CLAIMED" });
        const body = req.body || {};

        if (body.firstName !== undefined || body.lastName !== undefined) {
            if (seat.kind !== "practical") return res.status(400).json({ code: "SEAT_STATE" });
            seat = await updateSeatNames(String(seat._id), body.firstName, body.lastName);
        }
        if (typeof body.email === "string" && body.email.trim()) {
            const email = body.email.trim().toLowerCase();
            // Język zaproszenia = język kupującego (zamówienia); pole „language” z klienta jest ignorowane
            const changed = seat.status === "open" || email !== seat.email;
            if (changed) {
                seat = await issueInvite(String(seat._id), { email, allowed: seat.status === "open" ? ["open"] : ["invited"] });
            }
        }
        res.json({ seat: ownerSeatView(seat, loaded.order) });
    } catch (err) {
        seatErr(res, err);
    }
};

/** POST /api/orders/:id/seats/:seatId/resend  (właściciel) — nowy link, stary przestaje działać */
export const resendOwnedSeat = async (req: Request, res: Response) => {
    try {
        const loaded = await loadOwnedSeat(req, res);
        if (!loaded) return;
        const { seat, order } = loaded;
        if (seat.status !== "invited") return res.status(409).json({ code: seat.status === "claimed" ? "SEAT_CLAIMED" : "SEAT_STATE" });
        const updated = await issueInvite(String(seat._id), { email: seat.email, allowed: ["invited"] });
        res.json({ seat: ownerSeatView(updated, order) });
    } catch (err) {
        seatErr(res, err);
    }
};

/** POST /api/orders/:id/seats/:seatId/withdraw  (właściciel) — zaproszenie cofnięte, miejsce znów wolne */
export const withdrawOwnedSeat = async (req: Request, res: Response) => {
    try {
        const loaded = await loadOwnedSeat(req, res);
        if (!loaded) return;
        const updated = await withdrawInvite(String(loaded.seat._id));
        res.json({ seat: ownerSeatView(updated, loaded.order) });
    } catch (err) {
        seatErr(res, err);
    }
};

// ─── Admin: Zugang entziehen, Platz freigeben, Teilerstattung geprüft ──────────

const adminWho = (req: Request) => String((req as any).user?.email || (req as any).user?._id || "admin");

/**
 * POST /api/orders/:id/revoke-access  (Admin)
 * Manuell (z. B. nach einer Erstattung, die der Inhaber selbst in Stripe macht): alle Plätze widerrufen,
 * Online-Zugänge beendet, Teilnehmer storniert, Bestellung „cancelled”. Idempotent.
 */
export const revokeOrderAccessAdmin = async (req: Request, res: Response) => {
    try {
        if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(404).json({ code: "NOT_FOUND" });
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ code: "NOT_FOUND" });
        if (!["paid", "expired", "cancelled"].includes(order.status)) return res.status(400).json({ code: "ORDER_NOT_PAID", message: "Nur bezahlte Bestellungen" });
        const result = await revokeOrderAccess(order, adminWho(req));
        res.json({ ok: true, result, accessRevokedAt: order.accessRevokedAt, accessRevokedBy: order.accessRevokedBy, status: order.status });
    } catch (err) {
        seatErr(res, err);
    }
};

/**
 * POST /api/orders/:id/seats/:seatId/reset  (Admin)
 * Belegten Platz freigeben: die Person verliert den Zugang aus diesem Platz, der Käufer kann jemand anderen einladen.
 */
export const resetSeatAdmin = async (req: Request, res: Response) => {
    try {
        if (!/^[a-f\d]{24}$/i.test(req.params.id) || !/^[a-f\d]{24}$/i.test(req.params.seatId)) return res.status(404).json({ code: "NOT_FOUND" });
        const seat = await OrderSeat.findOne({ _id: req.params.seatId, orderId: req.params.id }).select("_id").lean();
        if (!seat) return res.status(404).json({ code: "NOT_FOUND" });
        const updated = await resetClaimedSeat(String(seat._id), adminWho(req));
        const order = await Order.findById(req.params.id);
        res.json({ seat: ownerSeatView(updated, order as any) });
    } catch (err) {
        seatErr(res, err);
    }
};
