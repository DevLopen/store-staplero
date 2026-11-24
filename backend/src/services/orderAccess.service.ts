/**
 * Ręczne odbieranie dostępów z zamówienia (tylko admin).
 *
 * Decyzje właściciela:
 * - zwroty obsługuje właściciel sam w Stripe; webhook charge.refunded niczego nie zmienia;
 * - „Zugang entziehen” → odbieramy WSZYSTKIE dostępy z zamówienia (także zajęte miejsca), otwarte
 *   zaproszenia przestają działać, uczestnicy kursu praktycznego są wypisani (revokeOrderAccess);
 * - zmiana osoby na zajętym miejscu → tylko admin (resetClaimedSeat).
 *
 * Wszystko jest idempotentne: admin może kliknąć dwa razy.
 */
import Order, { OrderDoc } from "../models/Order";
import OrderSeat, { OrderSeatDoc } from "../models/OrderSeat";
import PracticalCourseParticipant from "../models/PracticalCourseParticipant";
import User from "../models/User";
import { UserCourse } from "../models/UserCourse";
import { increaseAvailableSpots } from "./practicalCourse.service";
import { SeatError } from "./seatInvite.service";

const isObjectId = (v: unknown): v is string => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);

/** Koniec dnia "YYYY-MM-DD" — czy termin kursu jeszcze się nie zaczął */
const courseInFuture = (startDate?: string, now = new Date()): boolean => {
    if (!startDate) return false;
    const d = new Date(`${startDate}T00:00:00`);
    return !isNaN(d.getTime()) && d.getTime() > now.getTime();
};

/**
 * Po odebraniu dostępu z jednego źródła: jeśli ta osoba ma ten sam kurs z innego, ważnego miejsca
 * (inne zamówienie), przywracamy dostęp z tamtego źródła. Bez tego odebranie jednego zakupu
 * odbierałby też dostęp kupiony osobno (UserCourse jest jeden na osobę i kurs).
 */
const restoreFromOtherSources = async (userId: string, courseId: string, excludeOrderId: string) => {
    const now = new Date();
    const others = await OrderSeat.find({
        claimedByUserId: userId, courseId, status: "claimed", orderId: { $ne: excludeOrderId },
        onlineExpiresAt: { $gt: now },
    }).sort({ onlineExpiresAt: -1 }).lean();
    for (const seat of others) {
        const order = await Order.findById(seat.orderId).select("status").lean();
        if (!order || order.status !== "paid") continue;
        await UserCourse.updateOne(
            { userId, courseId },
            { $set: { status: "active", expiresAt: seat.onlineExpiresAt, orderNumber: seat.orderNumber, seatId: String(seat._id) }, $unset: { revokedAt: 1 } }
        );
        return true;
    }
    return false;
};

/** Odbiera dostęp online wynikający z podanych miejsc / zamówienia (UserCourse + User.purchasedCourses). */
const revokeOnlineAccess = async (order: Pick<OrderDoc, "_id" | "orderNumber">, seatIds: string[], now: Date) => {
    const orderId = String(order._id);
    const affected = await UserCourse.find({
        status: "active",
        $or: [{ seatId: { $in: seatIds } }, { orderNumber: order.orderNumber }],
    }).lean();
    for (const uc of affected) {
        await UserCourse.updateOne({ _id: uc._id, status: "active" }, { $set: { status: "expired", revokedAt: now } });
        await User.updateOne(
            { _id: uc.userId },
            { $set: { "purchasedCourses.$[pc].status": "expired" } },
            { arrayFilters: [{ "pc.orderNumber": order.orderNumber, "pc.courseId": uc.courseId }] }
        );
        await restoreFromOtherSources(String(uc.userId), uc.courseId, orderId);
    }
    return affected.length;
};

export interface RevokeResult {
    orderNumber: string;
    alreadyRevoked: boolean;
    seatsRevoked: number;
    accessesRevoked: number;
    participantsCancelled: number;
    spotsRestored: number;
}

/**
 * Odbiera WSZYSTKIE dostępy z zamówienia: miejsca → revoked (tokeny skasowane), dostęp online wygasa,
 * uczestnicy kursu praktycznego → cancelled (miejsca w terminie wracają, jeśli kurs jeszcze przed nami),
 * zamówienie → cancelled. Każdy krok jest idempotentny, więc ponowne wywołanie dokańcza przerwane.
 */
export const revokeOrderAccess = async (orderOrId: OrderDoc | string, by: string): Promise<RevokeResult> => {
    const order = typeof orderOrId === "string" ? await Order.findById(orderOrId) : orderOrId;
    if (!order) throw new SeatError("NOT_FOUND", 404);
    const orderId = String(order._id);
    const now = new Date();
    const alreadyRevoked = !!order.accessRevokedAt;

    // 1. Miejsca: martwe, linki z zaproszeń przestają działać od razu
    const seats = await OrderSeat.find({ orderId }).select("_id status").lean();
    const seatIds = seats.map((s) => String(s._id));
    const seatRes = await OrderSeat.updateMany(
        { orderId, status: { $ne: "revoked" } },
        {
            $set: { status: "revoked", revokedAt: now, revokedReason: by },
            $unset: { tokenHash: 1, tokenExpiresAt: 1 },
        }
    );

    // 2. Dostęp online (kupujący i osoby, które zajęły miejsca)
    const accessesRevoked = await revokeOnlineAccess(order, seatIds, now);

    // 3. Kurs praktyczny: wypisanie, miejsca w terminie wracają tylko przed kursem
    let participantsCancelled = 0;
    let spotsRestored = 0;
    const participants = await PracticalCourseParticipant.find({ orderId, status: "confirmed" }).lean();
    for (const p of participants) {
        const r = await PracticalCourseParticipant.updateOne({ _id: p._id, status: "confirmed" }, { $set: { status: "cancelled" } });
        if (!r.modifiedCount) continue;
        participantsCancelled++;
        const start = (p as any).startDate || order.practicalCourseDetails?.startDate;
        if (p.locationId !== "manual" && !(p as any).overbooked && courseInFuture(start, now)) {
            await increaseAvailableSpots(p.locationId, p.dateId);
            spotsRestored++;
        }
    }

    // 4. Zamówienie
    const set: Record<string, unknown> = { status: "cancelled" };
    if (!order.accessRevokedAt) { set.accessRevokedAt = now; set.accessRevokedBy = by; }
    await Order.updateOne({ _id: order._id }, { $set: set });
    order.status = "cancelled";
    if (!order.accessRevokedAt) { order.accessRevokedAt = now; order.accessRevokedBy = by; }

    const result = {
        orderNumber: order.orderNumber, alreadyRevoked, seatsRevoked: seatRes.modifiedCount,
        accessesRevoked, participantsCancelled, spotsRestored,
    };
    console.log(`🚫 Zugang entzogen ${order.orderNumber} (${by}):`, JSON.stringify(result));
    return result;
};

/**
 * Admin: zwalnia zajęte miejsce (tylko admin może zmienić osobę). Osoba traci dostęp z tego miejsca,
 * miejsce wraca do „open”, kupujący może zaprosić kogoś innego.
 * Kurs praktyczny: imię i nazwisko zostają na miejscu i na liście uczestników, kupujący je poprawia.
 */
export const resetClaimedSeat = async (seatId: string, by: string): Promise<OrderSeatDoc> => {
    if (!isObjectId(seatId)) throw new SeatError("NOT_FOUND", 404);
    const seat = await OrderSeat.findById(seatId);
    if (!seat) throw new SeatError("NOT_FOUND", 404);
    const order = await Order.findById(seat.orderId);
    if (!order) throw new SeatError("NOT_FOUND", 404);
    if (order.status !== "paid") throw new SeatError("ORDER_NOT_PAID", 400);
    if (seat.status !== "claimed") throw new SeatError("SEAT_STATE", 409);

    const unset: Record<string, 1> = {
        email: 1, claimedByUserId: 1, claimedAt: 1, claimedTokenHash: 1, tokenHash: 1, tokenExpiresAt: 1,
        invitedAt: 1, reminderSentAt: 1,
    };
    if (seat.kind === "online") { unset.firstName = 1; unset.lastName = 1; }
    const before = await OrderSeat.findOneAndUpdate(
        { _id: seat._id, status: "claimed" },
        { $set: { status: "open" }, $unset: unset },
        { new: false }
    );
    if (!before) throw new SeatError("SEAT_STATE", 409);
    const userId = before.claimedByUserId;
    const now = new Date();

    if (userId && before.courseId) {
        const uc = await UserCourse.findOne({ userId, courseId: before.courseId, status: "active" }).lean();
        // Dostęp pochodzi z tego miejsca (seatId) albo — stare miejsce kupującego — z tego zamówienia
        if (uc && (uc.seatId === String(before._id) || (!uc.seatId && uc.orderNumber === order.orderNumber))) {
            await UserCourse.updateOne({ _id: uc._id }, { $set: { status: "expired", revokedAt: now } });
            await User.updateOne(
                { _id: userId },
                { $set: { "purchasedCourses.$[pc].status": "expired" } },
                { arrayFilters: [{ "pc.orderNumber": order.orderNumber, "pc.courseId": before.courseId }] }
            );
            await restoreFromOtherSources(userId, before.courseId, String(order._id));
        }
    }
    if (before.kind === "practical") {
        await PracticalCourseParticipant.updateOne(
            before.practicalParticipantId ? { _id: before.practicalParticipantId } : { orderId: before.orderId, seatIndex: before.seatIndex },
            // userId jest wymagane w schemie: wraca na kupującego, dopóki ktoś nowy nie zajmie miejsca
            { $set: { userId: String(order.userId), userEmail: order.userDetails?.email || "" } }
        );
    }
    console.log(`↩️  Platz ${order.orderNumber} #${before.seatIndex + 1} freigegeben (${by})`);
    return (await OrderSeat.findById(before._id)) as OrderSeatDoc;
};

export default { revokeOrderAccess, resetClaimedSeat };
