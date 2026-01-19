import express from "express";
import checkoutController from "../controllers/checkoutController";

const router = express.Router();

// Create checkout session
router.post("/create-session", checkoutController.createCheckoutSession);

// Verify checkout session
router.get("/verify/:sessionId", checkoutController.verifyCheckoutSession);

export default router;