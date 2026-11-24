import { Request, Response } from "express";
import stripeService from "../services/stripe.service";
import orderService from "../services/order.service";
import Stripe from "stripe";
import Order from "../models/Order";

/**
 * Handle Stripe webhooks
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
        return res.status(400).json({ message: "Missing stripe-signature header" });
    }

    try {
        // Construct event from webhook
        const event = stripeService.constructWebhookEvent(
            req.body,
            signature
        );

        console.log(`Webhook received: ${event.type}`);

        // Handle different event types
        switch (event.type) {
            case "checkout.session.completed":
                await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;

            case "payment_intent.succeeded":
                await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
                break;

            case "payment_intent.payment_failed":
                await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
                break;

            case "charge.refunded":
                await handleChargeRefunded(event.data.object as Stripe.Charge);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (err: any) {
        console.error("Webhook error:", err);
        res.status(400).json({ message: "Webhook error", error: err.message });
    }
};

/**
 * Handle checkout session completed
 */
const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
    console.log("Checkout session completed:", session.id);

    const orderNumber = session.metadata?.orderNumber;
    if (!orderNumber) {
        console.error("No order number in session metadata");
        return;
    }

    const order = await orderService.findOrderByNumber(orderNumber);
    if (!order) {
        console.error(`Order ${orderNumber} not found`);
        return;
    }

    // Mark order as paid and assign courses
    if (session.payment_status === "paid" && session.payment_intent) {
        await orderService.markOrderAsPaid(
            orderNumber,
            session.payment_intent as string
        );
        console.log(`Order ${orderNumber} marked as paid`);
    }
};

/**
 * Handle payment intent succeeded
 */
const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
    console.log("Payment intent succeeded:", paymentIntent.id);
    // Additional handling if needed
};

/**
 * Handle payment intent failed.
 * W Checkout klient może po nieudanej próbie zapłacić jeszcze raz w tej samej sesji — dlatego
 * nie anulujemy zamówienia, tylko zapisujemy próbę (paymentFailedAt). Tylko zamówienia „pending”;
 * opłaconych, anulowanych ani miejsc to zdarzenie nie dotyka.
 * Zamówienie po metadanych PaymentIntent (payment_intent_data.metadata w createCheckoutSession).
 */
const handlePaymentIntentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
    console.log("Payment intent failed:", paymentIntent.id);
    const { orderId, orderNumber } = paymentIntent.metadata || {};
    const filter = orderId && /^[a-f\d]{24}$/i.test(orderId) ? { _id: orderId } : orderNumber ? { orderNumber: String(orderNumber) } : null;
    if (!filter) {
        console.log(`ℹ️ Payment intent ${paymentIntent.id}: keine Bestellung in den Metadaten`);
        return;
    }
    const r = await Order.updateOne({ ...filter, status: "pending" }, { $set: { paymentFailedAt: new Date() } });
    if (r.modifiedCount) console.log(`ℹ️ Order ${orderNumber || orderId}: Zahlungsversuch fehlgeschlagen (bleibt offen)`);
};

/**
 * Handle charge refunded: nur protokollieren. Erstattungen bearbeitet der Inhaber selbst
 * (Stripe-Dashboard, Zugänge bei Bedarf im Admin über „Zugang entziehen”).
 */
const handleChargeRefunded = async (charge: Stripe.Charge) => {
    const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
    console.log(`Charge refunded: ${charge.id} (payment_intent ${pi}, ${(charge.amount_refunded || 0) / 100} € erstattet) — keine automatische Änderung`);
};

export default {
    handleStripeWebhook,
};