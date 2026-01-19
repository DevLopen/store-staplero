import { Request, Response } from "express";
import stripeService from "../services/stripe.service";
import orderService from "../services/order.service";
import Stripe from "stripe";

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
 * Handle payment intent failed
 */
const handlePaymentIntentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
    console.log("Payment intent failed:", paymentIntent.id);

    // Find order by payment intent ID
    const order = await orderService.findOrderById(paymentIntent.metadata?.orderId);

    if (order) {
        order.status = "cancelled";
        await order.save();
        console.log(`Order ${order.orderNumber} cancelled due to payment failure`);
    }
};

/**
 * Handle charge refunded
 */
const handleChargeRefunded = async (charge: Stripe.Charge) => {
    console.log("Charge refunded:", charge.id);

    // Find order by payment intent
    const order = await orderService.findOrderById(charge.metadata?.orderId);

    if (order) {
        order.status = "cancelled";
        await order.save();
        console.log(`Order ${order.orderNumber} cancelled due to refund`);
    }
};

export default {
    handleStripeWebhook,
};