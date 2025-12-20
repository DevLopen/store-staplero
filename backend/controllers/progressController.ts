import { Request, Response } from "express";
import TopicProgress from "../models/TopicProgress";
import QuizResult from "../models/QuizResult";

export const getProgress = async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    try {
        const topics = await TopicProgress.find({ userId });
        const quizzes = await QuizResult.find({ userId });
        res.json({ topics, quizzes });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};

export const markTopicCompleted = async (req: Request, res: Response) => {
    const { userId, topicId } = req.body;
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
        res.status(500).json({ message: "Server error", error: err });
    }
};
