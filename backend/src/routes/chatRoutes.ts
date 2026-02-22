import express from "express";
import { handleChatMessage, handleCourseAssistant } from "../controllers/chatController";
import { chatRateLimiter } from "../middleware/rateLimiter";
import { spamDetectionMiddleware } from "../middleware/spamDetection";

const router = express.Router();

// POST /api/chat - Wysyła wiadomość do AI
router.post(
    "/",
    chatRateLimiter,
    spamDetectionMiddleware,
    handleChatMessage
);

// POST /api/chat/course-assistant - Asystent kursu (kontekstowy)
router.post(
    "/course-assistant",
    chatRateLimiter,
    handleCourseAssistant
);

export default router;