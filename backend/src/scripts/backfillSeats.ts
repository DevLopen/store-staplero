/**
 * Backfill miejsc (OrderSeat) dla zamówień opłaconych przed wprowadzeniem modelu miejsc.
 *
 * Domyślnie DRY-RUN: nic nie zapisuje, tylko wypisuje, co by powstało.
 *   npx ts-node src/scripts/backfillSeats.ts            # podgląd
 *   npx ts-node src/scripts/backfillSeats.ts --apply    # zapis (idempotentny, można powtórzyć)
 *
 * Zasady (takie same jak przy nowej płatności, ensureOrderSeats):
 * - stare zamówienia nie mają pola buyerParticipates → kupujący uczestniczy, więc miejsce 0
 *   powstaje jako „claimed” przez kupującego (dostęp zostaje dokładnie taki jak dziś),
 * - kurs online: tyle miejsc, ile wynosi quantity pozycji (stare zamówienia: 1),
 * - kurs praktyczny / pakiet: jedno miejsce na uczestnika, połączone z PracticalCourseParticipant,
 * - tylko status "paid"; zamówienia "expired"/"cancelled"/"pending" są pomijane.
 * Istniejące miejsca nie są nadpisywane. UserCourse kupującego dostaje seatId.
 * Maile NIE są wysyłane.
 */
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Order from "../models/Order";
import OrderSeat from "../models/OrderSeat";
import { ensureOrderSeats, practicalPeople, buyerParticipates } from "../services/orderSeat.service";

const APPLY = process.argv.includes("--apply");

(async () => {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`Backfill OrderSeat — ${APPLY ? "APPLY (zapis)" : "DRY-RUN (bez zapisu)"} — ${mongoose.connection.name}`);
    if (APPLY) await OrderSeat.syncIndexes();

    const orders = await Order.find({ status: "paid" }).sort({ paidAt: 1 });
    let ordersToFill = 0;
    let seatsToCreate = 0;
    for (const order of orders) {
        const existing = await OrderSeat.countDocuments({ orderId: String(order._id) });
        let expected = 0;
        if (order.type === "online") {
            const item = order.items.find((i) => !!i.courseId);
            expected = item ? Math.max(1, item.quantity || 1) : 0;
        } else if (order.practicalCourseDetails) {
            expected = practicalPeople(order, order.userDetails || {}).length;
        }
        const missing = Math.max(0, expected - existing);
        if (missing === 0) continue;
        ordersToFill++;
        seatsToCreate += missing;
        console.log(
            `${order.orderNumber}  ${order.type.padEnd(9)} paid ${order.paidAt?.toISOString().slice(0, 10) || "?"}  ` +
            `Plätze: ${existing} vorhanden, ${missing} fehlen  Käufer nimmt teil: ${buyerParticipates(order) ? "ja" : "nein"}`
        );
        if (APPLY) {
            const seats = await ensureOrderSeats(order);
            console.log(`   → ${seats.length} Plätze`);
        }
    }
    console.log(`\n${orders.length} bezahlte Bestellungen geprüft. ${ordersToFill} ohne (alle) Plätze, ${seatsToCreate} Plätze ${APPLY ? "angelegt" : "würden angelegt"}.`);
    await mongoose.disconnect();
})().catch(async (err) => {
    console.error("Backfill failed:", err);
    await mongoose.disconnect();
    process.exit(1);
});
