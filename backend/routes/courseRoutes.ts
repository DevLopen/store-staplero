import express from "express";
import {
    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    addChapter,
    updateChapter,
    deleteChapter,
    addTopic,
    updateTopic,
    deleteTopic,
} from "../controllers/courseController";
import { protect, admin } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", protect, admin, getCourses);
router.post("/", protect, admin, createCourse);
router.put("/:courseId", protect, admin, updateCourse);
router.delete("/:courseId", protect, admin, deleteCourse);

// Chapters
router.post("/:courseId/chapters", protect, admin, addChapter);
router.put("/:courseId/chapters/:chapterId", protect, admin, updateChapter);
router.delete("/:courseId/chapters/:chapterId", protect, admin, deleteChapter);

// Topics
router.post("/:courseId/chapters/:chapterId/topics", protect, admin, addTopic);
router.put("/:courseId/chapters/:chapterId/topics/:topicId", protect, admin, updateTopic);
router.delete("/:courseId/chapters/:chapterId/topics/:topicId", protect, admin, deleteTopic);

export default router;
