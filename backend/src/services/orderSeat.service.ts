import { OrderDoc } from "../models/Order";
import OrderSeat, { OrderSeatDoc, SEAT_LANGUAGES, SeatLanguage } from "../models/OrderSeat";
import PracticalCourseParticipant from "../models/PracticalCourseParticipant";
import User from "../models/User";
import { UserCourse } from "../models/UserCourse";
import { resolveName } from "../utils/name";
import type { SeatBlockData, SeatMailLine } from "./email.service";

const DEFAULT_ACCESS_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Czy kupujący sam uczestniczy (stare zamówienia bez pola = tak). */
export const buyerParticipates = (order: Pick<OrderDoc, "buyerParticipates">): boolean =>
    order.buyerParticipates !== false;

/**
 * Ile osób jest zapisanych na kurs praktyczny z tego zamówienia.
 * Kupujący liczy się tylko, gdy sam uczestniczy.
 */
export const practicalParticipantCount = (order: OrderDoc): number =>
    (buyerParticipates(order) ? 1 : 0) + (order.practicalCourseDetails?.additionalParticipants?.length || 0);

/**
 * Lista osób na kursie praktycznym wg seatIndex: kupujący (seatIndex 0), gdy uczestniczy,
 * potem pozostałe osoby. Gdy kupujący nie uczestniczy, seatIndex 0 = pierwsza wpisana osoba.
 */
export const practicalPeople = (
    order: OrderDoc,
    buyer: { firstName?: string; lastName?: string; name?: string }
): Array<{ seatIndex: number; firstName: string; lastName: string; name: string; isBuyer: boolean }> => {
    const others = (order.practicalCourseDetails?.additionalParticipants || []).map((p) =>
        resolveName({ firstName: p.firstName, lastName: p.lastName, name: p.name })
    );
    const list = buyerParticipates(order)
        ? [{ ...resolveName(buyer), isBuyer: true }, ...others.map((o) => ({ ...o, isBuyer: false }))]
        : others.map((o) => ({ ...o, isBuyer: false }));
    return list.map((p, seatIndex) => ({ seatIndex, ...p }));
};

/** Koniec dnia kursu (endDate "YYYY-MM-DD") — do tego dnia ważne jest miejsce praktyczne. */
const courseEnd = (order: OrderDoc): Date | undefined => {
    const d = order.practicalCourseDetails?.endDate || order.practicalCourseDetails?.startDate;
    if (!d) return undefined;
    const date = new Date(`${d}T23:59:59`);
    return isNaN(date.getTime()) ? undefined : date;
};

const laterOf = (a?: Date, b?: Date): Date | undefined => (!a ? b : !b ? a : a > b ? a : b);

/**
 * Daty ważności miejsca, liczone od płatności (decyzja właściciela):
 * - onlineExpiresAt = paidAt + accessDays (online i pakiet),
 * - courseEndsAt = koniec ostatniego dnia kursu (praktyka i pakiet),
 * - expiresAt = do kiedy miejsce da się zająć = później z obu dat.
 */
export const seatDates = (order: OrderDoc): { onlineExpiresAt?: Date; courseEndsAt?: Date; expiresAt?: Date; accessDays?: number } => {
    const paidAt = order.paidAt || new Date();
    const onlineItem = order.items.find((i) => !!i.courseId);
    const accessDays = onlineItem ? onlineItem.accessDays || DEFAULT_ACCESS_DAYS : undefined;
    const onlineExpiresAt = accessDays ? new Date(paidAt.getTime() + accessDays * DAY_MS) : undefined;
    const courseEndsAt = order.type === "practical" ? courseEnd(order) : undefined;
    return { onlineExpiresAt, courseEndsAt, expiresAt: laterOf(onlineExpiresAt, courseEndsAt), accessDays };
};

const pickSeatLanguage = (value: unknown, fallback: SeatLanguage): SeatLanguage =>
    (SEAT_LANGUAGES as readonly string[]).includes(String(value)) ? (value as SeatLanguage) : fallback;

/**
 * Język wszystkich maili do miejsc (zaproszenie, przypomnienie) i strony /einladung: zawsze język
 * kupującego z zamówienia (decyzja właściciela, bez wyboru języka per osoba).
 */
export const orderLanguage = (order: Pick<OrderDoc, "language">): SeatLanguage => pickSeatLanguage(order.language, "de");

/**
 * Tworzy miejsca (OrderSeat) dla opłaconego zamówienia. Idempotentne: istniejące miejsca
 * (orderId+seatIndex) nie są nadpisywane, ponowny webhook nic nie psuje.
 *
 * - online: N miejsc (N = quantity pozycji z courseId), ważne paidAt + accessDays
 * - praktyka / pakiet: jedno miejsce na uczestnika, połączone z PracticalCourseParticipant po seatIndex;
 *   praktyka ważna do dnia kursu, pakiet ma też onlineExpiresAt części online (patrz seatDates)
 * - kupujący uczestniczy → miejsce 0 od razu „claimed” przez kupującego
 * - e-maile z checkoutu (order.seatInvites) trafiają na wolne miejsca; zaproszenia wysyła
 *   seatInvite.service.sendPendingInvites
 */
export const ensureOrderSeats = async (order: OrderDoc): Promise<OrderSeatDoc[]> => {
    if (order.status !== "paid") return [];
    const orderId = order._id.toString();
    const paidAt = order.paidAt || new Date();
    const language: SeatLanguage = pickSeatLanguage(order.language, "de");
    const buyerIn = buyerParticipates(order);
    const user = await User.findById(order.userId).select("email name firstName lastName").lean();

    const onlineItem = order.items.find((i) => !!i.courseId);
    const dates = seatDates(order);
    const accessDays = dates.accessDays;
    const invites = new Map((order.seatInvites || []).map((i) => [i.seatIndex, i]));

    type SeatInit = Partial<OrderSeatDoc> & { seatIndex: number };
    const seats: SeatInit[] = [];

    if (order.type === "online") {
        if (!onlineItem) return [];
        const quantity = Math.max(1, onlineItem.quantity || 1);
        for (let i = 0; i < quantity; i++) {
            seats.push({
                seatIndex: i, kind: "online", courseId: onlineItem.courseId, accessDays,
                onlineExpiresAt: dates.onlineExpiresAt, expiresAt: dates.onlineExpiresAt,
            });
        }
    } else if (order.practicalCourseDetails) {
        const people = practicalPeople(order, {
            firstName: order.userDetails?.firstName || user?.firstName,
            lastName: order.userDetails?.lastName || user?.lastName,
            name: order.userDetails?.name || user?.name,
        });
        const registered = await PracticalCourseParticipant.find({ orderId }).select("_id seatIndex").lean();
        const bySeat = new Map(registered.map((r) => [r.seatIndex ?? 0, String(r._id)]));
        for (const p of people) {
            seats.push({
                seatIndex: p.seatIndex,
                kind: "practical",
                courseId: onlineItem?.courseId,
                accessDays,
                onlineExpiresAt: dates.onlineExpiresAt,
                courseEndsAt: dates.courseEndsAt,
                expiresAt: dates.expiresAt,
                practicalParticipantId: bySeat.get(p.seatIndex),
                firstName: p.firstName || undefined,
                lastName: p.lastName || undefined,
            });
        }
    }

    for (const seat of seats) {
        const isBuyerSeat = buyerIn && seat.seatIndex === 0 && !!user;
        const doc: Record<string, unknown> = {
            ...seat,
            orderId,
            orderNumber: order.orderNumber,
            language,
            status: isBuyerSeat ? "claimed" : "open",
            sendCount: 0,
        };
        if (isBuyerSeat) {
            const buyerName = resolveName({
                firstName: order.userDetails?.firstName || user!.firstName,
                lastName: order.userDetails?.lastName || user!.lastName,
                name: order.userDetails?.name || user!.name,
            });
            Object.assign(doc, {
                email: String(user!.email).toLowerCase(),
                firstName: seat.firstName || buyerName.firstName || undefined,
                lastName: seat.lastName || buyerName.lastName || undefined,
                claimedByUserId: String(user!._id),
                claimedAt: paidAt,
            });
        } else {
            const invite = invites.get(seat.seatIndex);
            if (invite?.email) doc.email = invite.email;
        }
        for (const k of Object.keys(doc)) if (doc[k] === undefined) delete doc[k];
        try {
            await OrderSeat.updateOne(
                { orderId, seatIndex: seat.seatIndex },
                { $setOnInsert: doc },
                { upsert: true }
            );
        } catch (err: any) {
            if (err?.code !== 11000) throw err; // równoległy webhook zdążył utworzyć to miejsce
        }
        // Uczestnik praktyczny dopisany później (np. „Fehlende eintragen”) — dołączamy powiązanie
        if (seat.practicalParticipantId) {
            await OrderSeat.updateOne(
                { orderId, seatIndex: seat.seatIndex, practicalParticipantId: { $exists: false } },
                { $set: { practicalParticipantId: seat.practicalParticipantId } }
            );
        }
        // Miejsca z etapu 4 (bez rozdzielonych dat): uzupełniamy onlineExpiresAt / courseEndsAt / expiresAt
        const fix: Record<string, Date> = {};
        if (seat.onlineExpiresAt) fix.onlineExpiresAt = seat.onlineExpiresAt;
        if (seat.courseEndsAt) fix.courseEndsAt = seat.courseEndsAt;
        if (seat.expiresAt) fix.expiresAt = seat.expiresAt;
        if (Object.keys(fix).length) {
            await OrderSeat.updateOne(
                { orderId, seatIndex: seat.seatIndex, onlineExpiresAt: { $exists: false }, courseEndsAt: { $exists: false } },
                { $set: fix }
            );
        }
    }

    const all = await OrderSeat.find({ orderId }).sort({ seatIndex: 1 });

    // Dostęp kupującego wskazuje na jego miejsce
    const buyerSeat = all.find((s) => s.seatIndex === 0 && s.status === "claimed" && s.claimedByUserId === String(order.userId));
    if (buyerSeat?.courseId) {
        await UserCourse.updateOne(
            { userId: String(order.userId), courseId: buyerSeat.courseId, orderNumber: order.orderNumber },
            { $set: { seatId: String(buyerSeat._id) } }
        );
    }
    return all;
};

/** Status miejsca do pokazania (panel kupującego, admin): niezajęte miejsce po terminie = „expired”. */
export type SeatDisplayStatus = "open" | "invited" | "claimed" | "expired" | "revoked";
export const seatDisplayStatus = (seat: Pick<OrderSeatDoc, "status" | "expiresAt">, now = new Date()): SeatDisplayStatus => {
    if (seat.status === "revoked") return "revoked";
    if (seat.status === "claimed") return "claimed";
    if (seat.expiresAt && seat.expiresAt.getTime() <= now.getTime()) return "expired";
    return seat.status === "invited" ? "invited" : "open";
};

/**
 * Miejsca do maili kupującego (blok „Ihre Plätze”): imię i nazwisko, e-mail, status.
 * Miejsce z e-mailem z checkoutu, do którego zaproszenie właśnie wychodzi, liczy się jako „eingeladen”.
 * Zwraca undefined, gdy zamówienie nie ma jeszcze miejsc (stare zamówienia).
 */
export const seatMailBlock = async (order: OrderDoc, now = new Date()): Promise<SeatBlockData | undefined> => {
    const seats = await OrderSeat.find({ orderId: String(order._id), status: { $ne: "revoked" } }).sort({ seatIndex: 1 }).lean();
    if (!seats.length) return undefined;
    const lines: SeatMailLine[] = seats.map((s) => {
        const state: SeatMailLine["state"] = s.status === "claimed"
            ? (s.claimedByUserId === String(order.userId) ? "you" : "claimed")
            : s.status === "invited" || (s.status === "open" && s.email) ? "invited" : "open";
        return { seatIndex: s.seatIndex, firstName: s.firstName || undefined, lastName: s.lastName || undefined, email: state === "open" ? undefined : s.email || undefined, state };
    });
    const hasOnline = order.items.some((i) => !!i.courseId);
    const kind: SeatBlockData["kind"] = order.type === "online" ? "online" : hasOnline ? "package" : "practical";
    const dates = seatDates(order);
    return {
        kind,
        seats: lines,
        onlineUntil: seats.find((s) => s.onlineExpiresAt)?.onlineExpiresAt || dates.onlineExpiresAt,
        courseDay: order.practicalCourseDetails?.startDate,
    };
};

/** Miejsca zamówienia do widoku admina (bez tokenHash). */
export const getOrderSeats = async (orderId: string) =>
    OrderSeat.find({ orderId })
        .select("-tokenHash -__v")
        .sort({ seatIndex: 1 })
        .lean();

export default { ensureOrderSeats, getOrderSeats, seatMailBlock, buyerParticipates, practicalParticipantCount, practicalPeople, seatDates, seatDisplayStatus };
