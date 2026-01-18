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

        // Kursy przypisane użytkownikowi
        const userCourses = await UserCourse.find({ userId });
        const courseIds = userCourses.map(uc => uc.courseId);

        const [courses, topicProgressRaw, quizResultsRaw, orders] = await Promise.all([
            Course.find({ _id: { $in: courseIds } }),
            TopicProgress.find({ userId }),
            QuizResult.find({ userId }),
            Order.find({ userEmail }),
        ]);

        // Przekształcamy progress w mapę topicId -> completed
        const topics: Record<string, boolean> = {};
        topicProgressRaw.forEach(t => {
            topics[t.topicId] = t.completed;
        });

        // Przekształcamy quizy rozdziałów w mapę chapterId -> { passed, score }
        const quizzes: Record<string, { passed: boolean; score: number }> = {};
        quizResultsRaw.forEach(q => {
            if (q.chapterId && !q.isFinalQuiz) {
                quizzes[q.chapterId] = { passed: q.passed, score: q.score };
            }
        });

        // Przekształcamy quizy końcowe w mapę courseId -> { passed, score }
        const finalQuizzes: Record<string, { passed: boolean; score: number }> = {};
        quizResultsRaw.forEach(q => {
            if (q.isFinalQuiz) {
                // quizId to courseId dla final quiz
                finalQuizzes[q.quizId] = { passed: q.passed, score: q.score };
            }
        });

        // Aktualizacja statusów rozdziałów dla każdego kursu
        const coursesWithStatus = courses.map(course => {
            const courseObj = course.toObject();

            courseObj.chapters = courseObj.chapters.map((ch: any, idx: number) => {
                const allTopicsDone = ch.topics.every((t: any) => topics[t.id]);
                const quizPassed = ch.quiz ? quizzes[ch.id]?.passed : true;

                // Sprawdź czy poprzedni rozdział jest ukończony
                if (idx > 0) {
                    const prevCh = courseObj.chapters[idx - 1];
                    const prevAllTopicsDone = prevCh.topics.every((t: any) => topics[t.id]);
                    const prevQuizPassed = prevCh.quiz ? quizzes[prevCh.id]?.passed : true;

                    if (!prevAllTopicsDone || !prevQuizPassed) {
                        return { ...ch, status: "blocked" };
                    }
                }

                // Ustaw status na podstawie postępu
                if (allTopicsDone && quizPassed) {
                    return { ...ch, status: "complete" };
                } else if (allTopicsDone && ch.quiz && !quizPassed) {
                    return { ...ch, status: "pending" }; // czeka na quiz
                } else {
                    return { ...ch, status: "pending" };
                }
            });

            return courseObj;
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