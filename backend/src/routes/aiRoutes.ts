import express from "express";
import { generateContent, enhanceContent, uploadMiddleware } from "../controllers/aiController";
import { protect, admin } from "../middleware/authMiddleware";

const router = express.Router();

// Generowanie nowej zawartości (z uploadem plików)
router.post(
    "/generate-content",
    protect,
    admin,
    uploadMiddleware,
    generateContent
);

// Ulepszanie istniejącej zawartości
router.post(
    "/enhance-content",
    protect,
    admin,
    enhanceContent
);

export default router;