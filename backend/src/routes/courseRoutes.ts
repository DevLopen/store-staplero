import express from "express";
import {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    addChapter,
    updateChapter,
    deleteChapter,
    addTopic,
    updateTopic,
    deleteTopic,
    getChapterById,
    getTopicById,
} from "../controllers/courseController";
import { saveQuiz, deleteQuiz, getQuizQuestions, submitQuizAnswers } from "../controllers/quizController";
import { protect, admin } from "../middleware/authMiddleware";
import { checkCourseAccess } from "../middleware/checkCourseAccess";
import { checkChapterAccess, checkFinalQuizAccess } from "../middleware/checkChapterAccess";

const router = express.Router();

// ==================== ADMIN ROUTES ====================
router.get("/admin", protect, admin, getCourses);
router.post("/admin", protect, admin, createCourse);
router.get("/admin/:courseId", protect, admin, getCourseById);
router.put("/admin/:courseId", protect, admin, updateCourse);
router.delete("/admin/:courseId", protect, admin, deleteCourse);

// Chapters
router.post("/admin/:courseId/chapters", protect, admin, addChapter);
router.put("/admin/:courseId/chapters/:chapterId", protect, admin, updateChapter);
router.delete("/admin/:courseId/chapters/:chapterId", protect, admin, deleteChapter);

// Topics (admin routes)
router.post("/admin/:courseId/chapters/:chapterId/topics", protect, admin, addTopic);
router.put("/admin/:courseId/chapters/:chapterId/topics/:topicId", protect, admin, updateTopic);
router.delete("/admin/:courseId/chapters/:chapterId/topics/:topicId", protect, admin, deleteTopic);

// Topics
router.post("/admin/:courseId/chapters/:chapterId/topics", protect, admin, addTopic);
router.put("/admin/:courseId/chapters/:chapterId/topics/:topicId", protect, admin, updateTopic);
router.delete("/admin/:courseId/chapters/:chapterId/topics/:topicId", protect, admin, deleteTopic);

// Quizzes (chapter & final)
router.post("/admin/:courseId/quizzes/:chapterId", protect, admin, saveQuiz);
router.delete("/admin/:courseId/quizzes/:chapterId", protect, admin, deleteQuiz);

// ==================== USER ROUTES ====================
// Course overview
router.get("/:courseId", protect, checkCourseAccess, getCourseById);

// Chapter access (with validation)
router.get(
    "/:courseId/chapters/:chapterId",
    protect,
    checkCourseAccess,
    checkChapterAccess,
    getChapterById
);

// Topic access (with chapter validation)
router.get(
    "/:courseId/chapters/:chapterId/topics/:topicId",
    protect,
    checkCourseAccess,
    checkChapterAccess,
    getTopicById
);

// Chapter Quiz - GET questions
router.get(
    "/:courseId/chapters/:chapterId/quiz",
    protect,
    checkCourseAccess,
    checkChapterAccess,
    getQuizQuestions
);

// Chapter Quiz - POST answers
router.post(
    "/:courseId/chapters/:chapterId/quiz",
    protect,
    checkCourseAccess,
    checkChapterAccess,
    submitQuizAnswers
);

// Final Quiz - GET questions
router.get(
    "/:courseId/final-quiz",
    protect,
    checkCourseAccess,
    checkFinalQuizAccess,
    getQuizQuestions
);

// Final Quiz - POST answers
router.post(
    "/:courseId/final-quiz",
    protect,
    checkCourseAccess,
    checkFinalQuizAccess,
    submitQuizAnswers
);

export default router;