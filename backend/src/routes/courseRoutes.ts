import express from "express";
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addChapter,
  updateChapter,
  reorderChapters,
  deleteChapter,
  getChapterById,
  addTopic,
  updateTopic,
  reorderTopics,
  deleteTopic,
  getTopicById,
} from "../controllers/courseController";
import { saveQuiz, deleteQuiz, getQuizQuestions, submitQuizAnswers } from "../controllers/quizController";
import { protect, admin } from "../middleware/authMiddleware";
import { checkCourseAccess } from "../middleware/checkCourseAccess";
import { checkChapterAccess, checkFinalQuizAccess } from "../middleware/checkChapterAccess";

const router = express.Router();

// ── ADMIN: Course CRUD ─────────────────────────────────────────────────────────
router.get("/admin",                           protect, admin, getCourses);
router.post("/admin",                          protect, admin, createCourse);
router.get("/admin/:courseId",                 protect, admin, getCourseById);
router.put("/admin/:courseId",                 protect, admin, updateCourse);
router.delete("/admin/:courseId",              protect, admin, deleteCourse);

// ── ADMIN: Chapters ────────────────────────────────────────────────────────────
router.post("/admin/:courseId/chapters",                          protect, admin, addChapter);
router.put("/admin/:courseId/chapters/reorder",                   protect, admin, reorderChapters);
router.put("/admin/:courseId/chapters/:chapterId",                protect, admin, updateChapter);
router.delete("/admin/:courseId/chapters/:chapterId",             protect, admin, deleteChapter);

// ── ADMIN: Topics ──────────────────────────────────────────────────────────────
router.post("/admin/:courseId/chapters/:chapterId/topics",                             protect, admin, addTopic);
router.put("/admin/:courseId/chapters/:chapterId/topics/reorder",                     protect, admin, reorderTopics);
router.put("/admin/:courseId/chapters/:chapterId/topics/:topicId",                    protect, admin, updateTopic);
router.get("/admin/:courseId/chapters/:chapterId/topics/:topicId",                    protect, admin, getTopicById);
router.delete("/admin/:courseId/chapters/:chapterId/topics/:topicId",                 protect, admin, deleteTopic);

// ── ADMIN: Quizzes ─────────────────────────────────────────────────────────────
router.post("/admin/:courseId/quizzes/:chapterId",   protect, admin, saveQuiz);
router.delete("/admin/:courseId/quizzes/:chapterId", protect, admin, deleteQuiz);

// ── USER: Course & Chapter access ─────────────────────────────────────────────
router.get("/:courseId",                           protect, checkCourseAccess, getCourseById);
router.get("/:courseId/chapters/:chapterId",       protect, checkCourseAccess, checkChapterAccess, getChapterById);
router.get("/:courseId/chapters/:chapterId/topics/:topicId", protect, checkCourseAccess, checkChapterAccess, getTopicById);

// ── USER: Chapter Quiz ─────────────────────────────────────────────────────────
router.get( "/:courseId/chapters/:chapterId/quiz", protect, checkCourseAccess, checkChapterAccess, getQuizQuestions);
router.post("/:courseId/chapters/:chapterId/quiz", protect, checkCourseAccess, checkChapterAccess, submitQuizAnswers);

// ── USER: Final Quiz ───────────────────────────────────────────────────────────
router.get( "/:courseId/final-quiz", protect, checkCourseAccess, checkFinalQuizAccess, getQuizQuestions);
router.post("/:courseId/final-quiz", protect, checkCourseAccess, checkFinalQuizAccess, submitQuizAnswers);

export default router;