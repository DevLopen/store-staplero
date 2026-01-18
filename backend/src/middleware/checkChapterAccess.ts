import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import Course from "../models/Course";
import TopicProgress from "../models/TopicProgress";
import QuizResult from "../models/QuizResult";

export const checkChapterAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { courseId, chapterId } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    const chapterIndex = course.chapters.findIndex(ch => ch.id === chapterId);
    if (chapterIndex === -1) return res.status(404).json({ message: "Rozdział nie znaleziony" });

    // Pierwszy rozdział jest zawsze dostępny
    if (chapterIndex === 0) {
        return next();
    }

    // Sprawdź, czy poprzedni rozdział jest ukończony
    const prevChapter = course.chapters[chapterIndex - 1];

    // Pobierz postęp tematów poprzedniego rozdziału
    const prevTopicIds = prevChapter.topics.map(t => t.id);
    const topicProgress = await TopicProgress.find({
        userId,
        topicId: { $in: prevTopicIds }
    });

    // Sprawdź czy wszystkie tematy są ukończone
    const allTopicsDone = prevChapter.topics.every(t =>
        topicProgress.find(tp => tp.topicId === t.id && tp.completed)
    );

    if (!allTopicsDone) {
        return res.status(403).json({
            message: "Rozdział zablokowany – musisz ukończyć wszystkie tematy w poprzednim rozdziale"
        });
    }

    // Jeśli poprzedni rozdział ma quiz, sprawdź czy został zdany
    if (prevChapter.quiz) {
        const quizResult = await QuizResult.findOne({
            userId,
            chapterId: prevChapter.id,
            isFinalQuiz: false
        });

        if (!quizResult || !quizResult.passed) {
            return res.status(403).json({
                message: "Rozdział zablokowany – musisz zdać test w poprzednim rozdziale"
            });
        }
    }

    next();
};

export const checkFinalQuizAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { courseId } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });
    if (!course.finalQuiz) return res.status(404).json({ message: "Brak testu końcowego" });

    // Sprawdź czy wszystkie rozdziały są ukończone
    for (const chapter of course.chapters) {
        // Sprawdź tematy
        const topicIds = chapter.topics.map(t => t.id);
        const topicProgress = await TopicProgress.find({
            userId,
            topicId: { $in: topicIds }
        });

        const allTopicsDone = chapter.topics.every(t =>
            topicProgress.find(tp => tp.topicId === t.id && tp.completed)
        );

        if (!allTopicsDone) {
            return res.status(403).json({
                message: `Test końcowy zablokowany – ukończ wszystkie tematy w rozdziale "${chapter.title}"`
            });
        }

        // Sprawdź quiz rozdziału (jeśli istnieje)
        if (chapter.quiz) {
            const quizResult = await QuizResult.findOne({
                userId,
                chapterId: chapter.id,
                isFinalQuiz: false
            });

            if (!quizResult || !quizResult.passed) {
                return res.status(403).json({
                    message: `Test końcowy zablokowany – zdaj test w rozdziale "${chapter.title}"`
                });
            }
        }
    }

    next();
};