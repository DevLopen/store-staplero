/**
 * Przypomnienia o miejscach (cron, raz dziennie). Idempotentne: flagi na zamówieniu / miejscu
 * są ustawiane atomowo PRZED wysyłką (zwalniane, gdy mail się nie uda), więc dwa równoległe
 * uruchomienia ani ponowny start serwera nie wyślą maila drugi raz.
 *
 * 1. Kupujący (szablon „seats-reminder”): są miejsca bez e-maila
 *    - 2 dni po płatności,
 *    - 7 dni przed końcem ważności miejsc (online) albo przed dniem kursu (praktyka, pakiet).
 *    Maks. dwa na zamówienie. Gdy 2 dni po płatności jesteśmy już w oknie 7 dni, wychodzi tylko drugie.
 * 2. Zaproszona osoba (szablon „seat-invite-reminder”): 5 dni po zaproszeniu, raz na zaproszenie,
 *    z nowym linkiem (seatInvite.service.sendInviteReminder).
 * Pomijamy: zamówienia nie „paid” (zwrot, anulowane, wygasłe), miejsca zajęte, cofnięte, po terminie.
 */
import Order, { OrderDoc } from "../models/Order";
import OrderSeat from "../models/OrderSeat";
import User from "../models/User";
import emailService from "./email.service";
import { seatMailBlock } from "./orderSeat.service";
import { seatCourseTitle, sendInviteReminder, isSeatLanguage } from "./seatInvite.service";

const DAY_MS = 24 * 60 * 60 * 1000;
export const FIRST_AFTER_MS = 2 * DAY_MS;
export const LAST_BEFORE_MS = 7 * DAY_MS;
export const INVITE_REMINDER_AFTER_MS = 5 * DAY_MS;

/** Do kiedy kupujący może przydzielić miejsca: dzień kursu (praktyka/pakiet) albo koniec ważności (online) */
const seatDeadline = (order: OrderDoc, openExpiries: Date[]): Date | null => {
    if (order.type === "practical") {
        const d = order.practicalCourseDetails?.startDate;
        const date = d ? new Date(`${d}T00:00:00`) : null;
        return date && !isNaN(date.getTime()) ? date : null;
    }
    return openExpiries.length ? new Date(Math.min(...openExpiries.map((x) => x.getTime()))) : null;
};

export const sendSeatsOpenReminders = async (now = new Date()): Promise<{ sent: string[]; checked: number }> => {
    const sent: string[] = [];
    const orderIds: string[] = await OrderSeat.distinct("orderId", {
        status: "open", email: { $exists: false }, expiresAt: { $gt: now },
    });
    let checked = 0;
    for (const orderId of orderIds) {
        const order = await Order.findOne({
            _id: orderId, status: "paid", paidAt: { $lte: new Date(now.getTime() - FIRST_AFTER_MS) },
            $or: [{ seatReminderFirstAt: { $exists: false } }, { seatReminderLastAt: { $exists: false } }],
        });
        if (!order) continue;
        checked++;
        const open = await OrderSeat.find({ orderId, status: "open", email: { $exists: false }, expiresAt: { $gt: now } }).select("expiresAt").lean();
        if (!open.length) continue;
        const deadline = seatDeadline(order, open.map((s) => s.expiresAt as Date));
        if (!deadline || deadline.getTime() <= now.getTime()) continue;
        const inLastWindow = deadline.getTime() - now.getTime() <= LAST_BEFORE_MS;
        const field = inLastWindow ? "seatReminderLastAt" : "seatReminderFirstAt";
        if (order[field]) continue;

        const claimed = await Order.findOneAndUpdate(
            { _id: order._id, status: "paid", [field]: { $exists: false } },
            { $set: { [field]: now } },
            { new: true }
        );
        if (!claimed) continue;
        try {
            const user = await User.findById(order.userId).select("email name").lean();
            const seatBlock = await seatMailBlock(order, now);
            if (!user || !seatBlock) throw new Error("Käufer oder Plätze fehlen");
            const lang = isSeatLanguage(order.language) ? order.language : "de";
            await emailService.sendSeatsReminderEmail(user.email, {
                name: user.name,
                course: await seatCourseTitle(order, lang),
                orderNumber: order.orderNumber,
                last: inLastWindow,
                until: deadline,
                seatBlock,
            }, lang);
            sent.push(`${order.orderNumber}:${inLastWindow ? "last" : "first"}`);
            console.log(`🔔 Plätze-Erinnerung (${inLastWindow ? "vor Ablauf" : "nach Kauf"}) ${order.orderNumber}`);
        } catch (err: any) {
            await Order.updateOne({ _id: order._id }, { $unset: { [field]: 1 } });
            console.error(`❌ Plätze-Erinnerung ${order.orderNumber}:`, err?.message || err);
        }
    }
    return { sent, checked };
};

export const sendInvitationReminders = async (now = new Date()): Promise<{ sent: number; checked: number }> => {
    const seats = await OrderSeat.find({
        status: "invited",
        email: { $type: "string" },
        invitedAt: { $lte: new Date(now.getTime() - INVITE_REMINDER_AFTER_MS) },
        reminderSentAt: { $exists: false },
        expiresAt: { $gt: now },
    }).select("_id").lean();
    let sent = 0;
    for (const s of seats) {
        if (await sendInviteReminder(String(s._id), now)) sent++;
    }
    return { sent, checked: seats.length };
};

export const runSeatReminders = async (now = new Date()) => {
    const buyers = await sendSeatsOpenReminders(now);
    const invites = await sendInvitationReminders(now);
    return { buyers, invites };
};

export default { sendSeatsOpenReminders, sendInvitationReminders, runSeatReminders };
