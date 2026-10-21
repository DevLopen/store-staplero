import express from "express";
import { protect, admin } from "../middleware/authMiddleware";
import {
    getMyCourses, getCourse, getLesson, saveProgress,
    adminListCourses, adminCreateCourse, adminGetCourse, adminSaveDraft, adminUpdateMeta, adminPublish, adminDeleteCourse,
} from "../controllers/learningController";

// Learning courses v2 (step lessons, 4 languages). Runs next to the old /api/courses until the switch.
const router = express.Router();

// admin
router.get("/admin/courses",                     protect, admin, adminListCourses);
router.post("/admin/courses",                    protect, admin, adminCreateCourse);
router.get("/admin/courses/:courseId",           protect, admin, adminGetCourse);
router.put("/admin/courses/:courseId/draft",     protect, admin, adminSaveDraft);
router.patch("/admin/courses/:courseId",         protect, admin, adminUpdateMeta);
router.post("/admin/courses/:courseId/publish",  protect, admin, adminPublish);
router.delete("/admin/courses/:courseId",        protect, admin, adminDeleteCourse);

// learner
router.get("/my",                                         protect, getMyCourses);
router.get("/courses/:courseId",                          protect, getCourse);
router.get("/courses/:courseId/lessons/:lessonId",        protect, getLesson);
router.put("/courses/:courseId/lessons/:lessonId/progress", protect, saveProgress);

export default router;
