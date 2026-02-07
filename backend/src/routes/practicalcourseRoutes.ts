import express from "express";
import practicalCourseController from "../controllers/practicalcourseController";
import { protect, admin } from "../middleware/authMiddleware";

const router = express.Router();

/**
 * Wszystkie endpointy wymagają autoryzacji admina
 */

// GET /api/admin/practical-courses/participants - lista wszystkich uczestników
router.get(
    "/participants",
    protect,
    admin,
    practicalCourseController.getAllParticipants
);

// GET /api/admin/practical-courses/participants/location/:locationId - uczestnicy dla lokalizacji
router.get(
    "/participants/location/:locationId",
    protect,
    admin,
    practicalCourseController.getParticipantsByLocation
);

// GET /api/admin/practical-courses/participants/date/:locationId/:dateId - uczestnicy dla terminu
router.get(
    "/participants/date/:locationId/:dateId",
    protect,
    admin,
    practicalCourseController.getParticipantsByDate
);

// GET /api/admin/practical-courses/locations-with-participants - lokalizacje z licznikami
router.get(
    "/locations-with-participants",
    protect,
    admin,
    practicalCourseController.getLocationsWithParticipants
);

// POST /api/admin/practical-courses/participants/:orderNumber/cancel - anuluj uczestnika
router.post(
    "/participants/:orderNumber/cancel",
    protect,
    admin,
    practicalCourseController.cancelParticipant
);

// GET /api/admin/practical-courses/stats - statystyki
router.get(
    "/stats",
    protect,
    admin,
    practicalCourseController.getParticipantsStats
);

export default router;