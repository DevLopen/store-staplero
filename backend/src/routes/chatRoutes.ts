import express from "express";
import { handleChatMessage } from "../controllers/chatController";
import { chatRateLimiter } from "../middleware/rateLimiter";
import { spamDetectionMiddleware } from "../middleware/spamDetection";

const router = express.Router();

// POST /api/chat - Wysyła wiadomość do AI
router.post(
    "/",
    chatRateLimiter,           // 1. Limit zapytań
    spamDetectionMiddleware,   // 2. Detekcja spamu
    handleChatMessage          // 3. Właściwy handler
);

export default router;