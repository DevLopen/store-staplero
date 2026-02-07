import express from "express";
import practicalCourseController from "../controllers/practicalCourse.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";

const router = express.Router();

/**
 * Wszystkie endpointy wymagają autoryzacji admina
 */

// GET /api/admin/practical-courses/participants - lista wszystkich uczestników
router.get(
    "/participants",
    authMiddleware,
    adminMiddleware,
    practicalCourseController.getAllParticipants
);

// GET /api/admin/practical-courses/participants/location/:locationId - uczestnicy dla lokalizacji
router.get(
    "/participants/location/:locationId",
    authMiddleware,
    adminMiddleware,
    practicalCourseController.getParticipantsByLocation
);

// GET /api/admin/practical-courses/participants/date/:locationId/:dateId - uczestnicy dla terminu
router.get(
    "/participants/date/:locationId/:dateId",
    authMiddleware,
    adminMiddleware,
    practicalCourseController.getParticipantsByDate
);

// GET /api/admin/practical-courses/locations-with-participants - lokalizacje z licznikami
router.get(
    "/locations-with-participants",
    authMiddleware,
    adminMiddleware,
    practicalCourseController.getLocationsWithParticipants
);

// POST /api/admin/practical-courses/participants/:orderNumber/cancel - anuluj uczestnika
router.post(
    "/participants/:orderNumber/cancel",
    authMiddleware,
    adminMiddleware,
    practicalCourseController.cancelParticipant
);

// GET /api/admin/practical-courses/stats - statystyki
router.get(
    "/stats",
    authMiddleware,
    adminMiddleware,
    practicalCourseController.getParticipantsStats
);

export default router;