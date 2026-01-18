import { Request, Response } from "express";
import TopicProgress from "../models/TopicProgress";
import QuizResult from "../models/QuizResult";

interface AuthRequest extends Request {
    user?: {
        _id: string;
        email?: string;
        name?: string;
        isAdmin?: boolean;
    };
}

export const getProgress = async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    try {
        const topicsRaw = await TopicProgress.find({ userId });
        const quizzesRaw = await QuizResult.find({ userId });

        const topics: Record<string, boolean> = {};
        topicsRaw.forEach(t => { topics[t.topicId] = t.completed });

        const quizzes: Record<string, { passed: boolean, score: number }> = {};
        quizzesRaw.forEach(q => {
            if (q.chapterId) {
                quizzes[q.chapterId] = { passed: q.passed, score: q.score };
            }
        });

        res.json({ topics, quizzes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err });
    }
};

export const markTopicCompleted = async (req: AuthRequest, res: Response) => {
    const userId = req.user?._id;
    const { topicId } = req.body;

    if (!userId) return res.status(401).json({ message: "Not authorized" });

    try {
        let progress = await TopicProgress.findOne({ userId, topicId });
        if (!progress) {
            progress = await TopicProgress.create({ userId, topicId, completed: true, completedAt: new Date() });
        } else {
            progress.completed = true;
            progress.completedAt = new Date();
            await progress.save();
        }
        res.json(progress);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err });
    }
};


export const submitQuizResult = async (req: Request, res: Response) => {
    const { userId, quizId, chapterId, score, passed, isFinalQuiz } = req.body;
    try {
        const result = await QuizResult.create({
            userId,
            quizId,
            chapterId,
            score,
            passed,
            completedAt: new Date(),
            isFinalQuiz
        });
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err });
    }
};
