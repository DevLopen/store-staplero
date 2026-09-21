import express from "express";
import practicalCourseController, { participantPhotoUpload } from "../controllers/practicalcourseController";
import { protect, admin } from "../middleware/authMiddleware";

const router = express.Router();

// All endpoints require admin auth
router.get("/participants",                         protect, admin, practicalCourseController.getAllParticipants);
router.get("/participants/location/:locationId",    protect, admin, practicalCourseController.getParticipantsByLocation);
router.get("/participants/date/:locationId/:dateId",protect, admin, practicalCourseController.getParticipantsByDate);
router.get("/locations-with-participants",          protect, admin, practicalCourseController.getLocationsWithParticipants);
router.get("/stats",                                protect, admin, practicalCourseController.getParticipantsStats);

router.post("/participants/:orderNumber/cancel",              protect, admin, practicalCourseController.cancelParticipant);

// NEW: mark as completed + issue certificate
router.post("/participants/:orderNumber/complete",            protect, admin, practicalCourseController.completeParticipant);

// NEW: resend certificate email
router.post("/participants/:orderNumber/resend-certificate",  protect, admin, practicalCourseController.resendCertificateEmail);


// NEW: archive all participants paginated
router.get("/participants/all",       protect, admin, practicalCourseController.getAllParticipantsPaginated);

// NEW: manually add participant
router.post("/participants/manual",   protect, admin, practicalCourseController.addManualParticipant);

// Edycja kursanta i jego zdjęcie (używane na certyfikacie)
router.put("/participants/:id",              protect, admin, practicalCourseController.updateParticipant);
router.post("/participants/:id/photo",       protect, admin, participantPhotoUpload, practicalCourseController.uploadParticipantPhoto);
router.delete("/participants/:id/photo",     protect, admin, practicalCourseController.deleteParticipantPhoto);

export default router;