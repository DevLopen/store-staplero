import express from "express";
import { getDashboard } from "../controllers/dashboardController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * GET /api/dashboard
 * Zwraca komplet danych dla zalogowanego usera
 */
router.get("/", protect, getDashboard);

export default router;
