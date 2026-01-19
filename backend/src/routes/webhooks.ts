import express from "express";
import webhookController from "../controllers/webhookController";

const router = express.Router();

// Stripe webhook endpoint
// NOTE: This must use raw body, not JSON parsed body
router.post(
    "/stripe",
    express.raw({ type: "application/json" }),
    webhookController.handleStripeWebhook
);

export default router;