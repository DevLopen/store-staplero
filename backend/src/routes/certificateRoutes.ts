import express from "express";
import { protect } from "../middleware/authMiddleware";
import { getCertificate, downloadCertificate, verifyCertificate } from "../controllers/certificateController";

const router = express.Router();

// User routes
router.get("/:courseId",          protect, getCertificate);
router.get("/:courseId/download", protect, downloadCertificate);

// Public verification
router.get("/verify/:code", verifyCertificate);

export default router;
