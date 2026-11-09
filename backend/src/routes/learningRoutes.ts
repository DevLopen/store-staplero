import express from "express";
import { protect, admin } from "../middleware/authMiddleware";
import {
    getMyCourses, getCourse, getLesson, saveProgress, submitCheck,
    adminListCourses, adminCreateCourse, adminGetCourse, adminSaveDraft, adminUpdateMeta, adminPublish, adminDeleteCourse,
    adminListAccess, adminGrantAccess, adminRevokeAccess,
} from "../controllers/learningController";
import {
    getBank, answerBank, resetBankProgress, submitBankTest,
    adminListBanks, adminGetBank, adminCreateQuestion, adminUpdateQuestion, adminDeleteQuestion,
} from "../controllers/questionBankController";

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
router.get("/admin/courses/:courseId/access",            protect, admin, adminListAccess);
router.put("/admin/courses/:courseId/access/:userId",    protect, admin, adminGrantAccess);
router.delete("/admin/courses/:courseId/access/:userId", protect, admin, adminRevokeAccess);

// learner
router.get("/my",                                         protect, getMyCourses);
router.get("/courses/:courseId",                          protect, getCourse);
router.get("/courses/:courseId/lessons/:lessonId",        protect, getLesson);
router.put("/courses/:courseId/lessons/:lessonId/progress", protect, saveProgress);
router.put("/courses/:courseId/lessons/:lessonId/check",    protect, submitCheck);

// katalog pytań (nauka z odpowiedziami, osobny produkt)
router.get("/admin/banks",                              protect, admin, adminListBanks);
router.get("/admin/banks/:bankId",                      protect, admin, adminGetBank);
router.post("/admin/banks/:bankId/questions",           protect, admin, adminCreateQuestion);
router.put("/admin/banks/:bankId/questions/:qid",       protect, admin, adminUpdateQuestion);
router.delete("/admin/banks/:bankId/questions/:qid",    protect, admin, adminDeleteQuestion);
router.get("/banks/:bankId",                            protect, getBank);
router.put("/banks/:bankId/answers/:qid",               protect, answerBank);
router.post("/banks/:bankId/tests",                      protect, submitBankTest);
router.delete("/banks/:bankId/progress",                protect, resetBankProgress);

export default router;
