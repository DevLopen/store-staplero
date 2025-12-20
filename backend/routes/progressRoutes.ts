import express from "express";
import { getProgress, markTopicCompleted, submitQuizResult } from "../controllers/progressController";

const router = express.Router();

router.get("/", getProgress);
router.post("/topic", markTopicCompleted);
router.post("/quiz", submitQuizResult);

export default router;
