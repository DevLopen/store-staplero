/**
 * Zaproszenia na miejsca (OrderSeat): kupujący wpisuje e-mail osoby, ta osoba dostaje link
 * /einladung/:token, zakłada konto albo się loguje i zajmuje miejsce.
 *
 * Bezpieczeństwo:
 * - token = crypto.randomBytes(32), w bazie tylko sha256 (jak przy resecie hasła), jednorazowy;
 * - ważny 30 dni, ale nigdy dłużej niż da się zająć miejsce (seat.expiresAt);
 * - ponowne wysłanie albo zmiana e-maila = nowy token, stary przestaje działać (hash nadpisany);
 * - zajęcie miejsca wymaga ważnego tokenu ORAZ zalogowanego konta z tym samym e-mailem;
 *   zajęcie jest atomowe (findOneAndUpdate na status „invited” + tokenHash), więc dwa równoległe
 *   kliknięcia nie zajmą miejsca dwa razy.
 */
import crypto from "crypto";
import Order, { OrderDoc } from "../models/Order";
import OrderSeat, { OrderSeatDoc, SEAT_LANGUAGES, SeatLanguage } from "../models/OrderSeat";
import PracticalCourseParticipant from "../models/PracticalCourseParticipant";
import Product from "../models/Product";
import User from "../models/User";
import { UserCourse } from "../models/UserCourse";
import { assignCourseToUser } from "./courseAccess.service";
import emailService from "./email.service";
import { normalizeEmail, findUserByEmail } from "../utils/email";
import { buyerParticipates, seatDisplayStatus, orderLanguage } from "./orderSeat.service";

const DAY_MS = 24 * 60 * 60 * 1000;
export const INVITE_TTL_MS = 30 * DAY_MS;
export const MAX_SENDS_PER_SEAT_24H = 5;
export const MAX_SENDS_PER_ORDER_24H = 20;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FRONTEND_URL = () => (process.env.FRONTEND_URL || "https://staplero.de").replace(/\/$/, "");

/** Błąd z kodem dla frontendu (tekst w języku strony) */
export class SeatError extends Error {
    constructor(public code: string, public status = 400, message?: string) {
        super(message || code);
    }
}

export const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export const isSeatLanguage = (v: unknown): v is SeatLanguage => (SEAT_LANGUAGES as readonly string[]).includes(String(v));

export const validSeatEmail = (value: unknown): string | null => {
    const email = normalizeEmail(value);
    return email && email.length <= 254 && EMAIL_RE.test(email) ? email : null;
};

/** m***@firma.de — tylko pierwsza litera i domena */
export const maskEmail = (email?: string): string => {
    if (!email || !email.includes("@")) return "";
    const [local, domain] = email.split("@");
    return `${local.slice(0, 1)}***@${domain}`;
};

/** Kto kupił: imię i nazwisko, przy zakupie na firmę z nazwą firmy */
export const buyerDisplay = (order: OrderDoc): { name: string; company?: string; label: string } => {
    const name = order.userDetails?.name || [order.userDetails?.firstName, order.userDetails?.lastName].filter(Boolean).join(" ");
    const company = order.billingAddress?.isCompany ? order.billingAddress.company?.trim() : undefined;
    return { name, company, label: company ? `${name} (${company})` : name };
};

/** Nazwa kursu w języku zaproszenia: z produktu, inaczej z pozycji zamówienia */
export const seatCourseTitle = async (order: OrderDoc, lang: SeatLanguage): Promise<string> => {
    if (order.productId && /^[a-f0-9]{24}$/i.test(order.productId)) {
        const product: any = await Product.findById(order.productId).select("title").lean();
        const title = product?.title?.[lang] || product?.title?.de;
        if (title) return String(title);
    }
    const main = order.items.find((i) => i.type === "practical") || order.items[0];
    return (main?.courseName || "STAPLERO").replace(/\s*\(Online-Zugang\)\s*$/, "");
};

const countRecent = (since: Date) => ({
    $size: { $filter: { input: { $ifNull: ["$sentTimes", []] }, cond: { $gt: ["$$this", since] } } },
});

/** Ile wysyłek zostało dla miejsca w ciągu 24 h */
export const sendsLeft = (seat: Pick<OrderSeatDoc, "sentTimes">, now = new Date()): number => {
    const since = now.getTime() - DAY_MS;
    const used = (seat.sentTimes || []).filter((d) => new Date(d).getTime() > since).length;
    return Math.max(0, MAX_SENDS_PER_SEAT_24H - used);
};

const sendInviteMail = async (seat: OrderSeatDoc, order: OrderDoc, token: string, opts: { reminder?: boolean } = {}) => {
    const lang = orderLanguage(order); // zawsze język kupującego
    const d = order.practicalCourseDetails;
    await emailService.sendSeatInviteEmail(
        {
            to: seat.email as string,
            buyer: buyerDisplay(order).label,
            course: await seatCourseTitle(order, lang),
            practical: seat.kind === "practical" && d
                ? { startDate: d.startDate, endDate: d.endDate, location: d.locationName, address: d.locationAddress }
                : undefined,
            onlineExpiresAt: seat.courseId && seat.onlineExpiresAt && seat.onlineExpiresAt > new Date() ? seat.onlineExpiresAt : undefined,
            linkExpiresAt: seat.tokenExpiresAt as Date,
            url: `${FRONTEND_URL()}/einladung/${token}`,
        },
        lang,
        opts
    );
};

/**
 * Przypomnienie dla zaproszonej osoby (cron): raz na zaproszenie, 5 dni po wysłaniu, gdy miejsce dalej
 * „invited” i da się je zająć. Token trzymamy tylko jako hash, więc przypomnienie zawsze niesie NOWY link
 * (stary przestaje działać). Gdy mail się nie uda, wracamy do starego tokenu i przypomnienie można ponowić.
 * Zwraca true, gdy przypomnienie wyszło.
 */
export const sendInviteReminder = async (seatId: string, now = new Date()): Promise<boolean> => {
    const seat = await OrderSeat.findById(seatId);
    if (!seat || seat.status !== "invited" || !seat.email || seat.reminderSentAt) return false;
    if (!seat.expiresAt || seat.expiresAt <= now) return false;
    const order = await Order.findById(seat.orderId);
    if (!order || order.status !== "paid") return false;

    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Math.min(now.getTime() + INVITE_TTL_MS, seat.expiresAt.getTime()));
    // Atomowo: tylko gdy to wciąż to samo zaproszenie (ten sam token, bez przypomnienia)
    const before = await OrderSeat.findOneAndUpdate(
        { _id: seat._id, status: "invited", tokenHash: seat.tokenHash, reminderSentAt: { $exists: false } },
        { $set: { tokenHash: sha256(token), tokenExpiresAt, reminderSentAt: now } },
        { new: false }
    );
    if (!before) return false;
    const updated = (await OrderSeat.findById(seat._id)) as OrderSeatDoc;
    try {
        await sendInviteMail(updated, order, token, { reminder: true });
    } catch (err: any) {
        await OrderSeat.updateOne(
            { _id: seat._id, tokenHash: sha256(token) },
            { $set: { tokenHash: before.tokenHash, tokenExpiresAt: before.tokenExpiresAt }, $unset: { reminderSentAt: 1 } }
        );
        console.error(`❌ Erinnerung ${order.orderNumber} Platz ${seat.seatIndex + 1}:`, err?.message || err);
        return false;
    }
    console.log(`🔔 Erinnerung ${order.orderNumber} Platz ${seat.seatIndex + 1} → ${maskEmail(seat.email)} (neuer Link)`);
    return true;
};

/**
 * Wysyła (albo wysyła ponownie) zaproszenie na miejsce: nowy token, status „invited”.
 * `allowed`: z jakiego statusu wolno (open = dodanie e-maila, invited = zmiana / ponowne wysłanie).
 * Rzuca SeatError: SEAT_CLAIMED, SEAT_STATE, SEAT_EXPIRED, INVALID_EMAIL, DUPLICATE_EMAIL, RATE_LIMITED, MAIL_FAILED.
 */
export const issueInvite = async (
    seatId: string,
    opts: { email: unknown; allowed: Array<"open" | "invited"> }
): Promise<OrderSeatDoc> => {
    const seat = await OrderSeat.findById(seatId);
    if (!seat) throw new SeatError("NOT_FOUND", 404);
    const order = await Order.findById(seat.orderId);
    if (!order || order.status !== "paid") throw new SeatError("ORDER_NOT_PAID", 400);
    if (seat.status === "claimed") throw new SeatError("SEAT_CLAIMED", 409);
    if (!opts.allowed.includes(seat.status as "open" | "invited")) throw new SeatError("SEAT_STATE", 409);
    const now = new Date();
    if (!seat.expiresAt || seat.expiresAt <= now) throw new SeatError("SEAT_EXPIRED", 400);

    const email = validSeatEmail(opts.email);
    if (!email) throw new SeatError("INVALID_EMAIL", 400);
    const language: SeatLanguage = orderLanguage(order);

    // Ten sam adres tylko raz w zamówieniu (także adres kupującego, gdy sam uczestniczy)
    const dup = await OrderSeat.findOne({ orderId: seat.orderId, _id: { $ne: seat._id }, email }).select("_id").lean();
    if (dup) throw new SeatError("DUPLICATE_EMAIL", 409);

    const since = new Date(now.getTime() - DAY_MS);
    const [orderSends] = await OrderSeat.aggregate([
        { $match: { orderId: seat.orderId } },
        { $project: { n: countRecent(since) } },
        { $group: { _id: null, n: { $sum: "$n" } } },
    ]);
    if ((orderSends?.n || 0) >= MAX_SENDS_PER_ORDER_24H) throw new SeatError("RATE_LIMITED", 429);

    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Math.min(now.getTime() + INVITE_TTL_MS, seat.expiresAt.getTime()));
    let updated: OrderSeatDoc | null;
    try {
        updated = await OrderSeat.findOneAndUpdate(
            {
                _id: seat._id,
                status: { $in: opts.allowed },
                $expr: { $lt: [countRecent(since), MAX_SENDS_PER_SEAT_24H] },
            },
            {
                $set: { status: "invited", email, language, tokenHash: sha256(token), tokenExpiresAt, invitedAt: now, lastSentAt: now },
                $unset: { reminderSentAt: 1 }, // nowe zaproszenie = przypomnienie znów możliwe (raz)
                $inc: { sendCount: 1 },
                $push: { sentTimes: { $each: [now], $slice: -MAX_SENDS_PER_SEAT_24H * 2 } },
            },
            { new: true }
        );
    } catch (err: any) {
        if (err?.code === 11000) throw new SeatError("DUPLICATE_EMAIL", 409);
        throw err;
    }
    if (!updated) {
        const fresh = await OrderSeat.findById(seat._id).select("status").lean();
        if (fresh && opts.allowed.includes(fresh.status as "open" | "invited")) throw new SeatError("RATE_LIMITED", 429);
        throw new SeatError(fresh?.status === "claimed" ? "SEAT_CLAIMED" : "SEAT_STATE", 409);
    }

    try {
        await sendInviteMail(updated, order, token);
    } catch (err: any) {
        // Miejsce zostaje „invited” — kupujący może wysłać jeszcze raz
        console.error(`❌ Einladung ${order.orderNumber} Platz ${updated.seatIndex + 1}:`, err?.message || err);
        throw new SeatError("MAIL_FAILED", 502);
    }
    console.log(`✉️  Einladung ${order.orderNumber} Platz ${updated.seatIndex + 1} → ${maskEmail(email)}`);
    return updated;
};

/** Po płatności: zaproszenia dla e-maili wpisanych w checkoucie (miejsca open z e-mailem, jeszcze bez wysyłki). */
export const sendPendingInvites = async (order: OrderDoc): Promise<number> => {
    if (order.status !== "paid") return 0;
    const seats = await OrderSeat.find({
        orderId: order._id.toString(),
        status: "open",
        email: { $type: "string" },
        invitedAt: { $exists: false },
    }).sort({ seatIndex: 1 });
    let sent = 0;
    for (const seat of seats) {
        try {
            await issueInvite(String(seat._id), { email: seat.email, allowed: ["open"] });
            sent++;
        } catch (err: any) {
            console.error(`❌ Einladung ${order.orderNumber} Platz ${seat.seatIndex + 1}:`, err?.code || err?.message);
        }
    }
    return sent;
};

/** Cofnięcie zaproszenia: miejsce znów wolne, stary link przestaje działać. */
export const withdrawInvite = async (seatId: string): Promise<OrderSeatDoc> => {
    const updated = await OrderSeat.findOneAndUpdate(
        { _id: seatId, status: "invited" },
        { $set: { status: "open" }, $unset: { email: 1, tokenHash: 1, tokenExpiresAt: 1, invitedAt: 1, reminderSentAt: 1 } },
        { new: true }
    );
    if (!updated) {
        const fresh = await OrderSeat.findById(seatId).select("status").lean();
        throw new SeatError(fresh?.status === "claimed" ? "SEAT_CLAIMED" : "SEAT_STATE", 409);
    }
    return updated;
};

const MAX_NAME_PART = 50;
const cleanName = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");

/**
 * Imię i nazwisko osoby na kursie praktycznym (tylko niezajęte miejsca). Zmieniamy też listę
 * uczestników kursu i zamówienie, żeby lista obecności i certyfikat miały te same dane.
 */
export const updateSeatNames = async (seatId: string, firstNameIn: unknown, lastNameIn: unknown): Promise<OrderSeatDoc> => {
    const firstName = cleanName(firstNameIn);
    const lastName = cleanName(lastNameIn);
    if (!firstName || !lastName) throw new SeatError("NAME_REQUIRED", 400);
    if (firstName.length > MAX_NAME_PART || lastName.length > MAX_NAME_PART) throw new SeatError("NAME_TOO_LONG", 400);
    const seat = await OrderSeat.findById(seatId);
    if (!seat) throw new SeatError("NOT_FOUND", 404);
    if (seat.kind !== "practical") throw new SeatError("SEAT_STATE", 400);
    const updated = await OrderSeat.findOneAndUpdate(
        { _id: seatId, status: { $ne: "claimed" } },
        { $set: { firstName, lastName } },
        { new: true }
    );
    if (!updated) throw new SeatError("SEAT_CLAIMED", 409);
    const name = `${firstName} ${lastName}`;
    await PracticalCourseParticipant.updateOne(
        updated.practicalParticipantId ? { _id: updated.practicalParticipantId } : { orderId: updated.orderId, seatIndex: updated.seatIndex },
        { $set: { firstName, lastName, userName: name } }
    );
    const order = await Order.findById(updated.orderId);
    if (order?.practicalCourseDetails) {
        const idx = updated.seatIndex - (buyerParticipates(order) ? 1 : 0);
        if (idx >= 0 && order.practicalCourseDetails.additionalParticipants?.[idx]) {
            await Order.updateOne(
                { _id: order._id },
                { $set: { [`practicalCourseDetails.additionalParticipants.${idx}`]: { firstName, lastName, name } } }
            );
        }
    }
    return updated;
};

// ─── Strona /einladung/:token ───────────────────────────────────────────────

export type InvitationLookup =
    | { state: "valid"; seat: OrderSeatDoc; order: OrderDoc; hash: string }
    | { state: "expired"; seat: OrderSeatDoc; order: OrderDoc }
    | { state: "used"; seat: OrderSeatDoc }
    | { state: "invalid" };

export const findInvitation = async (token: unknown): Promise<InvitationLookup> => {
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return { state: "invalid" };
    const hash = sha256(token);
    const seat = await OrderSeat.findOne({ tokenHash: hash });
    if (!seat) {
        const used = await OrderSeat.findOne({ claimedTokenHash: hash, status: "claimed" });
        return used ? { state: "used", seat: used } : { state: "invalid" };
    }
    if (seat.status !== "invited" || !seat.email) return { state: "invalid" };
    const order = await Order.findById(seat.orderId);
    if (!order || !["paid", "expired"].includes(order.status)) return { state: "invalid" };
    const now = Date.now();
    if (order.status === "expired" || !seat.tokenExpiresAt || seat.tokenExpiresAt.getTime() <= now ||
        !seat.expiresAt || seat.expiresAt.getTime() <= now) {
        return { state: "expired", seat, order };
    }
    return { state: "valid", seat, order, hash };
};

/** Minimum informacji dla posiadacza ważnego linku (bez pełnego e-maila, bez danych zamówienia) */
export const publicInvitation = async (look: InvitationLookup, viewer?: { _id: any; email: string } | null) => {
    if (look.state === "used") {
        const mine = !!viewer && String(viewer._id) === look.seat.claimedByUserId;
        return { status: "used" as const, mine };
    }
    if (look.state !== "valid") return { status: look.state };
    const { seat, order } = look;
    const accountExists = !!(await findUserByEmail(seat.email, "_id"));
    const viewerState = !viewer ? "anonymous" : normalizeEmail(viewer.email) === seat.email ? "match" : "other";
    const d = order.practicalCourseDetails;
    const now = new Date();
    return {
        status: "valid" as const,
        kind: seat.kind,
        course: await seatCourseTitle(order, orderLanguage(order)),
        buyer: buyerDisplay(order),
        maskedEmail: maskEmail(seat.email),
        language: orderLanguage(order),
        accountExists,
        viewer: viewerState,
        practical: seat.kind === "practical" && d
            ? { startDate: d.startDate, endDate: d.endDate, location: d.locationName, address: d.locationAddress }
            : null,
        onlineExpiresAt: seat.courseId && seat.onlineExpiresAt && seat.onlineExpiresAt > now ? seat.onlineExpiresAt : null,
        linkExpiresAt: seat.tokenExpiresAt,
    };
};

/** Nadanie dostępu po zajęciu miejsca: kurs online (od płatności) i/lub miejsce na kursie praktycznym. */
const grantSeatAccess = async (seat: OrderSeatDoc, user: any) => {
    const userId = String(user._id);
    const now = new Date();
    if (seat.courseId && seat.onlineExpiresAt && seat.onlineExpiresAt > now) {
        const expiresAt = await assignCourseToUser(userId, seat.courseId, seat.orderNumber, seat.onlineExpiresAt);
        await UserCourse.updateOne({ userId, courseId: seat.courseId }, { $set: { seatId: String(seat._id) } });
        await User.updateOne(
            { _id: user._id },
            { $push: { purchasedCourses: { courseId: seat.courseId, purchaseDate: now, expiresAt, status: "active", orderNumber: seat.orderNumber } } }
        );
    }
    if (seat.kind === "practical") {
        const participant = await PracticalCourseParticipant.findOne(
            seat.practicalParticipantId ? { _id: seat.practicalParticipantId } : { orderId: seat.orderId, seatIndex: seat.seatIndex }
        );
        if (participant) {
            participant.userId = userId;
            participant.userEmail = user.email;
            if (!participant.firstName && user.firstName) participant.firstName = user.firstName;
            if (!participant.lastName && user.lastName) participant.lastName = user.lastName;
            if (!participant.userName?.trim()) participant.userName = user.name;
            await participant.save();
        }
    }
    // Imię i nazwisko na miejscu online (do listy w panelu kupującego)
    if (!seat.firstName && !seat.lastName && (user.firstName || user.lastName)) {
        await OrderSeat.updateOne({ _id: seat._id }, { $set: { firstName: user.firstName, lastName: user.lastName } });
    }
};

/**
 * Potwierdzenie rezerwacji dla osoby, która zajęła miejsce na kursie praktycznym (także pakiet):
 * termin, dojazd, co zabrać, egzamin, przy pakiecie dostęp online z datą końca. Do tej osoby,
 * w języku kupującego, bez listy uczestników, cen i storna. Najwyżej raz na miejsce
 * (bookingMailSentAt); przy błędzie wysyłki flaga wraca, a zajęcie miejsca zostaje.
 */
export const sendSeatBookingMail = async (seatId: unknown, user: any): Promise<boolean> => {
    const seat = await OrderSeat.findOneAndUpdate(
        { _id: seatId, kind: "practical", status: "claimed", claimedByUserId: String(user._id), bookingMailSentAt: null },
        { $set: { bookingMailSentAt: new Date() } },
        { new: true }
    );
    if (!seat) return false;
    try {
        const order = await Order.findById(seat.orderId);
        const d = order?.practicalCourseDetails;
        // Kupujący z własnym miejscem dostał już pełne potwierdzenie przy płatności
        if (!order || !d || String(order.userId) === String(user._id)) return false;
        const name = [seat.firstName, seat.lastName].filter(Boolean).join(" ").trim()
            || [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.name || "";
        let onlineAccess: { courseName: string; expiresAt: Date; days?: number } | undefined;
        if (seat.courseId) {
            const uc = await UserCourse.findOne({ userId: String(user._id), courseId: seat.courseId }).lean();
            const expiresAt = uc?.expiresAt || seat.onlineExpiresAt;
            const item = order.items.find((i) => i.courseId === seat.courseId);
            if (expiresAt && new Date(expiresAt) > new Date()) {
                onlineAccess = {
                    courseName: (item?.courseName || "").replace(/\s*\(Online-Zugang\)\s*$/, ""),
                    expiresAt: new Date(expiresAt),
                    days: seat.accessDays || item?.accessDays || 30,
                };
            }
        }
        await emailService.sendPracticalCourseBookingEmail({
            to: user.email,
            name,
            orderNumber: order.orderNumber,
            locationName: d.locationName,
            locationAddress: d.locationAddress,
            startDate: d.startDate,
            endDate: d.endDate,
            time: d.time,
            onlineAccess,
            language: orderLanguage(order),
            productId: order.productId,
            locationId: d.locationId,
            dateId: d.dateId,
            participants: [name],
            seatHolder: true,
        });
        return true;
    } catch (err) {
        await OrderSeat.updateOne({ _id: seat._id }, { $unset: { bookingMailSentAt: 1 } });
        throw err;
    }
};

const sendSeatBookingMailSafe = (seatId: unknown, user: any) => {
    sendSeatBookingMail(seatId, user).catch((err) =>
        console.error(`❌ Buchungsbestätigung für Platz ${String(seatId)} fehlgeschlagen:`, err?.message || err));
};

/**
 * Zajęcie miejsca: ważny token + zalogowane konto z tym samym e-mailem. Atomowo, z cofnięciem,
 * gdyby nadanie dostępu się nie udało (link działa wtedy dalej).
 */
export const claimInvitation = async (token: unknown, user: any): Promise<{ seat: OrderSeatDoc; already?: boolean }> => {
    const look = await findInvitation(token);
    if (look.state === "used") {
        if (look.seat.claimedByUserId === String(user._id)) {
            sendSeatBookingMailSafe(look.seat._id, user); // tylko gdy pierwsza wysyłka się nie udała (flaga)
            return { seat: look.seat, already: true };
        }
        throw new SeatError("USED", 410);
    }
    if (look.state === "expired") throw new SeatError("EXPIRED", 410);
    if (look.state !== "valid") throw new SeatError("INVALID", 410);
    const email = normalizeEmail(user.email);
    if (email !== look.seat.email) throw new SeatError("WRONG_ACCOUNT", 403);

    const now = new Date();
    const before = await OrderSeat.findOneAndUpdate(
        { _id: look.seat._id, status: "invited", tokenHash: look.hash, tokenExpiresAt: { $gt: now }, email },
        {
            $set: { status: "claimed", claimedByUserId: String(user._id), claimedAt: now, claimedTokenHash: look.hash },
            $unset: { tokenHash: 1, tokenExpiresAt: 1 },
        },
        { new: false }
    );
    if (!before) {
        // Równoległe kliknięcie tej samej osoby: miejsce już jej — traktujemy jak sukces
        const mine = await OrderSeat.findOne({ _id: look.seat._id, status: "claimed", claimedByUserId: String(user._id) });
        if (mine) return { seat: mine, already: true };
        throw new SeatError("INVALID", 409); // zmiana e-maila / cofnięcie w międzyczasie
    }

    const claimed = (await OrderSeat.findById(before._id)) as OrderSeatDoc;
    try {
        await grantSeatAccess(claimed, user);
    } catch (err) {
        await OrderSeat.updateOne(
            { _id: before._id, status: "claimed", claimedByUserId: String(user._id) },
            {
                $set: { status: "invited", tokenHash: before.tokenHash, tokenExpiresAt: before.tokenExpiresAt },
                $unset: { claimedByUserId: 1, claimedAt: 1, claimedTokenHash: 1 },
            }
        );
        throw err;
    }
    console.log(`✅ Platz ${claimed.orderNumber} #${claimed.seatIndex + 1} angenommen von ${maskEmail(email)}`);
    sendSeatBookingMailSafe(claimed._id, user); // nie blokuje i nie cofa zajęcia miejsca
    return { seat: claimed };
};

/** Widok miejsca dla kupującego (bez hashy tokenów) */
export const ownerSeatView = (seat: OrderSeatDoc | any, order: Pick<OrderDoc, "userId">) => ({
    id: String(seat._id),
    seatIndex: seat.seatIndex,
    kind: seat.kind,
    status: seatDisplayStatus(seat),
    isBuyer: seat.status === "claimed" && seat.claimedByUserId === String(order.userId),
    email: seat.email || null,
    firstName: seat.firstName || null,
    lastName: seat.lastName || null,
    expiresAt: seat.expiresAt || null,
    onlineExpiresAt: seat.onlineExpiresAt || null,
    courseEndsAt: seat.courseEndsAt || null,
    invitedAt: seat.invitedAt || null,
    linkExpiresAt: seat.status === "invited" ? seat.tokenExpiresAt || null : null,
    claimedAt: seat.claimedAt || null,
    sendsLeft: sendsLeft(seat),
});

export default {
    issueInvite, sendPendingInvites, sendInviteReminder, withdrawInvite, updateSeatNames, findInvitation, publicInvitation,
    claimInvitation, sendSeatBookingMail, ownerSeatView, maskEmail, buyerDisplay,
};
