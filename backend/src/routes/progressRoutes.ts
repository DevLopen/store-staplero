import express from "express";
import { protect } from "../middleware/authMiddleware";
import { getProgress, startTopic, completeTopic } from "../controllers/progressController";

const router = express.Router();

router.get("/",       protect, getProgress);
router.post("/start", protect, startTopic);
router.post("/complete", protect, completeTopic);

export default router;
