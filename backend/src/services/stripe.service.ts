import Stripe from "stripe";

// Initialize Stripe - throw error if key missing
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("⚠️ STRIPE_SECRET_KEY is required!");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-12-15.clover'
});

console.log('💳 Stripe initialized successfully');

export interface CheckoutSessionData {
    orderNumber: string;
    userId: string;
    userEmail: string;
    type: "online" | "practical";
    items: Array<{
        priceId?: string;
        name: string;
        price: number;
        quantity: number;
    }>;
    totalAmount: number;
    metadata?: Record<string, string>;
}

/**
 * Create Stripe Checkout Session
 */
export const createCheckoutSession = async (
    data: CheckoutSessionData
): Promise<Stripe.Checkout.Session> => {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = data.items.map(
        (item) => {
            if (item.priceId) {
                // Użyj istniejącego Price ID ze Stripe
                return {
                    price: item.priceId,
                    quantity: item.quantity,
                };
            } else {
                // Fallback: Utwórz cenę dynamicznie (dla produktów bez priceId)
                return {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: item.name,
                            description:
                                data.type === "online"
                                    ? "30 Tage Zugang zum Online-Kurs"
                                    : "Praktischer Staplerführerschein-Kurs",
                        },
                        unit_amount: Math.round(item.price * 100),
                    },
                    quantity: item.quantity,
                };
            }
        }
    );
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card", "paypal", "klarna"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/checkout/cancel`,
        customer_email: data.userEmail,
        client_reference_id: data.userId,
        metadata: {
            orderNumber: data.orderNumber,
            userId: data.userId,
            type: data.type,
            ...data.metadata,
        },
    });

    return session;
};

/**
 * Retrieve Stripe Checkout Session
 */
export const retrieveCheckoutSession = async (
    sessionId: string
): Promise<Stripe.Checkout.Session> => {
    return await stripe.checkout.sessions.retrieve(sessionId);
};

/**
 * Construct webhook event from request
 */
export const constructWebhookEvent = (
    payload: string | Buffer,
    signature: string
): Stripe.Event => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
};

/**
 * Create refund
 */
export const createRefund = async (
    paymentIntentId: string,
    amount?: number
): Promise<Stripe.Refund> => {
    return await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
    });
};

export default {
    createCheckoutSession,
    retrieveCheckoutSession,
    constructWebhookEvent,
    createRefund,
};