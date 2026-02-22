import { Request, Response } from "express";
import { TopicProgress, LastPosition } from "../models/TopicProgress";
import QuizResult from "../models/QuizResult";
import Course from "../models/Course";
import { AuthRequest } from "../types";

// ─── GET progress for a course ────────────────────────────────────────────────

export const getProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Brak autoryzacji" });

    const { courseId } = req.query;
    if (!courseId) return res.status(400).json({ message: "Brak courseId" });

    const [topicsRaw, quizzesRaw, lastPos, course] = await Promise.all([
      TopicProgress.find({ userId, courseId: courseId as string }).lean(),
      QuizResult.find({ userId, courseId: courseId as string }).sort({ completedAt: -1 }).lean(),
      LastPosition.findOne({ userId, courseId: courseId as string }).lean(),
      Course.findById(courseId as string).lean(),
    ]);

    const topics: Record<string, boolean> = {};
    topicsRaw.forEach(t => { topics[t.topicId] = t.completed; });

    const quizzes: Record<string, { passed: boolean; score: number; attempts: number }> = {};
    const chapterQuizzes = quizzesRaw.filter(q => !q.isFinalQuiz && q.chapterId);
    const chapterIds = [...new Set(chapterQuizzes.map(q => q.chapterId!))];
    chapterIds.forEach(chId => {
      const attempts = chapterQuizzes.filter(q => q.chapterId === chId);
      const best = attempts.reduce((a, b) => a.score >= b.score ? a : b);
      quizzes[chId] = { passed: best.passed, score: best.score, attempts: attempts.length };
    });

    const finalQuizzes: Record<string, { passed: boolean; score: number; attempts: number }> = {};
    const finalResults = quizzesRaw.filter(q => q.isFinalQuiz);
    if (finalResults.length) {
      const best = finalResults.reduce((a, b) => a.score >= b.score ? a : b);
      finalQuizzes[courseId as string] = { passed: best.passed, score: best.score, attempts: finalResults.length };
    }

    // Validate lastPosition — chapter and topic must still exist in the course
    let validLastPosition: { chapterId: string; topicId: string } | null = null;
    if (lastPos && course) {
      const chapterExists = course.chapters.some((ch: any) =>
          ch.id === lastPos.chapterId &&
          ch.topics.some((t: any) => t.id === lastPos.topicId)
      );
      if (chapterExists) {
        validLastPosition = { chapterId: lastPos.chapterId, topicId: lastPos.topicId };
      } else {
        // Clean up stale lastPosition from DB
        await LastPosition.deleteOne({ userId, courseId: courseId as string });
        console.log(`[Progress] Deleted stale lastPosition for user=${userId} course=${courseId}`);
      }
    }

    res.json({ topics, quizzes, finalQuizzes, lastPosition: validLastPosition });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ─── POST mark topic as started / update last position ────────────────────────

export const startTopic = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Brak autoryzacji" });

    const { courseId, chapterId, topicId } = req.body;
    if (!courseId || !chapterId || !topicId)
      return res.status(400).json({ message: "Brak wymaganych pól" });

    await LastPosition.findOneAndUpdate(
        { userId, courseId },
        { chapterId, topicId },
        { upsert: true, new: true }
    );

    await TopicProgress.findOneAndUpdate(
        { userId, topicId },
        {
          $setOnInsert: { userId, courseId, chapterId, topicId, completed: false },
          $set: { lastAccessedAt: new Date() },
        },
        { upsert: true, new: true }
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ─── POST mark topic as completed ────────────────────────────────────────────

export const completeTopic = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Brak autoryzacji" });

    const { courseId, chapterId, topicId } = req.body;
    if (!courseId || !chapterId || !topicId)
      return res.status(400).json({ message: "Brak wymaganych pól" });

    const progress = await TopicProgress.findOneAndUpdate(
        { userId, topicId },
        { $set: { userId, courseId, chapterId, topicId, completed: true, completedAt: new Date(), lastAccessedAt: new Date() } },
        { upsert: true, new: true }
    );

    res.json({ ok: true, progress });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};