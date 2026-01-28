import express from "express";
import { handleChatMessage } from "../controllers/chatController";

const router = express.Router();

// POST /api/chat - Wysyła wiadomość do AI
router.post("/", handleChatMessage);

export default router;