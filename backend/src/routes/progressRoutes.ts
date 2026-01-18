import express from "express";
import { protect } from "../middleware/authMiddleware";
import { getProgress, markTopicCompleted, submitQuizResult } from "../controllers/progressController";

const router = express.Router();

router.get("/", getProgress);
router.post("/topic", protect, markTopicCompleted);
router.post("/quiz", submitQuizResult);

export default router;
