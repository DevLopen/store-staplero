import { Response } from "express";
import Course from "../models/Course";
import { TopicProgress, LastPosition } from "../models/TopicProgress";
import QuizResult from "../models/QuizResult";
import Order from "../models/Order";
import { UserCourse } from "../models/UserCourse";
import Certificate from "../models/Certificate";
import { AuthRequest } from "../types";

const ADMIN_EMAILS = ["info@staplero.com", "k.lopuch@satisfly.co"];

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Brak autoryzacji" });

    const userId = req.user._id;
    const userEmail = String(req.user.email || "").trim().toLowerCase();

    // Triple-check admin status: email list, isAdmin field, or decoded JWT
    const isSuperAdmin =
        ADMIN_EMAILS.includes(userEmail) ||
        req.user.isAdmin === true;

    console.log(`[Dashboard] userId=${userId} email=${userEmail} isAdmin=${req.user.isAdmin} isSuperAdmin=${isSuperAdmin}`);

    // Fetch user data in parallel
    const [userCourseDocs, topicProgressRaw, quizResultsRaw, orders, certificates] =
        await Promise.all([
          UserCourse.find({ userId, status: "active" }).lean(),
          TopicProgress.find({ userId }).lean(),
          QuizResult.find({ userId }).sort({ completedAt: -1 }).lean(),
          Order.find({ userId }).sort({ createdAt: -1 }).lean(),
          Certificate.find({ userId }).lean(),
        ]);

    // Admin sees ALL courses, user sees only purchased ones
    let courses: any[];
    let courseIds: string[];

    if (isSuperAdmin) {
      courses = await Course.find({}).lean();
      courseIds = courses.map((c) => c._id.toString());
      console.log(`[Dashboard] Admin sees ${courses.length} total courses`);
    } else {
      courseIds = userCourseDocs.map((uc) => uc.courseId);
      courses = await Course.find({ _id: { $in: courseIds } }).lean();
      console.log(`[Dashboard] User has ${courses.length} purchased courses`);
    }

    const lastPositions = await LastPosition.find({ userId, courseId: { $in: courseIds } }).lean();

    // Build progress maps
    const topics: Record<string, boolean> = {};
    topicProgressRaw.forEach((t) => { topics[t.topicId] = t.completed; });

    const quizzes: Record<string, { passed: boolean; score: number; attempts: number }> = {};
    const chapterResults = quizResultsRaw.filter((q) => !q.isFinalQuiz && q.chapterId);
    const uniqueChapterIds = [...new Set(chapterResults.map((r) => r.chapterId!))];
    uniqueChapterIds.forEach((chId) => {
      const attempts = chapterResults.filter((r) => r.chapterId === chId);
      const best = attempts.reduce((a, b) => (a.score >= b.score ? a : b));
      quizzes[chId] = { passed: best.passed, score: best.score, attempts: attempts.length };
    });

    const finalQuizzes: Record<string, { passed: boolean; score: number; attempts: number }> = {};
    const finalResults = quizResultsRaw.filter((q) => q.isFinalQuiz);
    const uniqueCourseIdsWithFinal = [...new Set(finalResults.map((r) => r.courseId))];
    uniqueCourseIdsWithFinal.forEach((cId) => {
      const attempts = finalResults.filter((r) => r.courseId === cId);
      const best = attempts.reduce((a, b) => (a.score >= b.score ? a : b));
      finalQuizzes[cId] = { passed: best.passed, score: best.score, attempts: attempts.length };
    });

    const coursesWithStatus = courses.map((course) => {
      const courseId = course._id.toString();
      const userCourse = userCourseDocs.find((uc) => uc.courseId === courseId);
      const lastPos = lastPositions.find((lp) => lp.courseId === courseId);
      const cert = certificates.find((c) => c.courseId === courseId);

      const chapters = course.chapters.map((ch: any, idx: number) => {
        const allTopicsDone = ch.topics.every((t: any) => topics[t.id]);
        const quizPassed = ch.quiz ? quizzes[ch.id]?.passed === true : true;

        if (idx === 0) {
          return { ...ch, status: allTopicsDone && quizPassed ? "complete" : "pending" };
        }

        const prev = course.chapters[idx - 1];
        const prevAllDone = prev.topics.every((t: any) => topics[t.id]);
        const prevQuizPassed = prev.quiz ? quizzes[prev.id]?.passed === true : true;

        if (!prevAllDone || !prevQuizPassed) return { ...ch, status: "blocked" };
        return { ...ch, status: allTopicsDone && quizPassed ? "complete" : "pending" };
      });

      const totalTopics = course.chapters.reduce((sum: number, ch: any) => sum + ch.topics.length, 0);
      const completedTopics = course.chapters.reduce(
          (sum: number, ch: any) => sum + ch.topics.filter((t: any) => topics[t.id]).length,
          0
      );
      const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      const daysRemaining = isSuperAdmin
          ? null
          : userCourse
              ? Math.max(0, Math.ceil((new Date(userCourse.expiresAt).getTime() - Date.now()) / 86_400_000))
              : null;

      return {
        _id: courseId,
        id: courseId,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        certificateEnabled: course.certificateEnabled,
        chapters,
        finalQuiz: course.finalQuiz,
        progressPercent,
        completedTopics,
        totalTopics,
        expiresAt: userCourse?.expiresAt,
        purchaseDate: userCourse?.purchaseDate,
        daysRemaining,
        lastPosition: lastPos ? { chapterId: lastPos.chapterId, topicId: lastPos.topicId } : null,
        certificate: cert
            ? { verificationCode: cert.verificationCode, issuedAt: cert.issuedAt, score: cert.score }
            : null,
        finalQuizResult: finalQuizzes[courseId] ?? null,
      };
    });

    res.json({
      user: {
        name: req.user.name,
        email: req.user.email,
        isAdmin: isSuperAdmin, // Return the computed value, not raw DB value
      },
      courses: coursesWithStatus,
      progress: { topics, quizzes, finalQuizzes },
      orders,
    });
  } catch (err) {
    console.error("[Dashboard] Error:", err);
    res.status(500).json({ message: "Dashboard fetch failed" });
  }
};