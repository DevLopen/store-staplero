import express from "express";
import { getDashboard } from "../controllers/dashboardController";
import { protect } from "../middleware/authMiddleware";
import Course from "../models/Course";

const router = express.Router();
const ADMIN_EMAILS = ["info@staplero.com", "k.lopuch@satisfly.co"];

// Main dashboard endpoint
router.get("/", protect, getDashboard);

// Diagnostic endpoint - GET /api/dashboard/debug
router.get("/debug", protect, async (req: any, res) => {
    try {
        const userEmail = String(req.user?.email || "").trim().toLowerCase();
        const isSuperAdmin = ADMIN_EMAILS.includes(userEmail) || req.user?.isAdmin === true;
        const totalCourses = await Course.countDocuments();

        res.json({
            userId: req.user?._id?.toString(),
            email: req.user?.email,
            isAdminInDB: req.user?.isAdmin,
            isOnAdminEmailList: ADMIN_EMAILS.includes(userEmail),
            isSuperAdmin,
            totalCoursesInDB: totalCourses,
            status: isSuperAdmin
                ? `✅ Admin - powinien widziec ${totalCourses} kursow`
                : `ℹ️ Zwykly uzytkownik - widzi tylko zakupione kursy`,
        });
    } catch (err) {
        res.status(500).json({ error: String(err) });
    }
});

export default router;