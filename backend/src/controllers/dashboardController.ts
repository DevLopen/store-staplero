import { Request, Response } from "express";
import Course from "../models/Course";
import TopicProgress from "../models/TopicProgress";
import QuizResult from "../models/QuizResult";
import Order from "../models/Order";
import { UserCourse } from "../models/UserCourse";

interface AuthRequest extends Request {
    user?: {
        _id: string;
        email: string;
        name: string;
        isAdmin: boolean;
    };
}

export const getDashboard = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = req.user._id;
        const userEmail = req.user.email;

        // Get active courses for user
        const userCourses = await UserCourse.find({
            userId,
            status: "active" // Only show active courses
        });
        const courseIds = userCourses.map((uc) => uc.courseId);

        const [courses, topicProgressRaw, quizResultsRaw, orders] = await Promise.all([
            Course.find({ _id: { $in: courseIds } }),
            TopicProgress.find({ userId }),
            QuizResult.find({ userId }),
            Order.find({ userId }).sort({ createdAt: -1 }),
        ]);

        // Transform progress into topic map
        const topics: Record<string, boolean> = {};
        topicProgressRaw.forEach((t) => {
            topics[t.topicId] = t.completed;
        });

        // Transform chapter quizzes
        const quizzes: Record<string, { passed: boolean; score: number }> = {};
        quizResultsRaw.forEach((q) => {
            if (q.chapterId && !q.isFinalQuiz) {
                quizzes[q.chapterId] = { passed: q.passed, score: q.score };
            }
        });

        // Transform final quizzes
        const finalQuizzes: Record<string, { passed: boolean; score: number }> = {};
        quizResultsRaw.forEach((q) => {
            if (q.isFinalQuiz) {
                finalQuizzes[q.quizId] = { passed: q.passed, score: q.score };
            }
        });

        // Add status and expiry info to courses
        const coursesWithStatus = courses.map((course) => {
            const courseObj = course.toObject();

            // Find user course data for expiry info
            const userCourse = userCourses.find(
                (uc) => uc.courseId === course._id.toString()
            );

            // Add chapters with status
            courseObj.chapters = courseObj.chapters.map((ch: any, idx: number) => {
                const allTopicsDone = ch.topics.every((t: any) => topics[t.id]);
                const quizPassed = ch.quiz ? quizzes[ch.id]?.passed : true;

                // Check if previous chapter is complete
                if (idx > 0) {
                    const prevCh = courseObj.chapters[idx - 1];
                    const prevAllTopicsDone = prevCh.topics.every((t: any) => topics[t.id]);
                    const prevQuizPassed = prevCh.quiz ? quizzes[prevCh.id]?.passed : true;

                    if (!prevAllTopicsDone || !prevQuizPassed) {
                        return { ...ch, status: "blocked" };
                    }
                }

                if (allTopicsDone && quizPassed) {
                    return { ...ch, status: "complete" };
                } else if (allTopicsDone && ch.quiz && !quizPassed) {
                    return { ...ch, status: "pending" };
                } else {
                    return { ...ch, status: "pending" };
                }
            });

            // Add expiry information
            return {
                ...courseObj,
                expiresAt: userCourse?.expiresAt,
                purchaseDate: userCourse?.purchaseDate,
                daysRemaining: userCourse
                    ? Math.ceil(
                        (new Date(userCourse.expiresAt).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    )
                    : null,
            };
        });

        res.json({
            user: {
                name: req.user.name,
                email: req.user.email,
                isAdmin: req.user.isAdmin,
            },
            courses: coursesWithStatus,
            progress: {
                topics,
                quizzes,
                finalQuizzes,
            },
            orders,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Dashboard fetch failed" });
    }
};