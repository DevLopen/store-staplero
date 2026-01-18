import { Request, Response } from "express";
import Course from "../models/Course";
import QuizResult from "../models/QuizResult";

interface AuthRequest extends Request {
    user?: {
        _id: string;
        email: string;
        name: string;
        isAdmin: boolean;
    };
}

// ==================== ADMIN: Save/Update Quiz ====================
export const saveQuiz = async (req: Request, res: Response) => {
    const { courseId, chapterId } = req.params;

    const incomingQuizData = req.body as {
        id: string;
        chapterId?: string;
        title: string;
        description?: string;
        passingScore: number;
        isFinalQuiz?: boolean;
        questions: {
            id: string;
            question: string;
            options: string[];
            correctAnswer: number;
        }[];
    };

    try {
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found" });

        // FINAL QUIZ
        if (chapterId === "final") {
            if (course.finalQuiz) {
                // Merge questions
                course.finalQuiz.questions = [
                    ...course.finalQuiz.questions.filter(
                        (q) => !incomingQuizData.questions.find((iq) => iq.id === q.id)
                    ),
                    ...incomingQuizData.questions,
                ];
                course.finalQuiz.title = incomingQuizData.title;
                course.finalQuiz.description = incomingQuizData.description;
                course.finalQuiz.passingScore = incomingQuizData.passingScore;
            } else {
                course.finalQuiz = { ...incomingQuizData, isFinalQuiz: true };
            }

            await course.save();
            return res.json(course);
        }

        // CHAPTER QUIZ
        const chapter = course.chapters.find((ch) => ch.id === chapterId);
        if (!chapter) return res.status(404).json({ message: "Chapter not found" });

        if (chapter.quiz) {
            // Merge questions
            chapter.quiz.questions = [
                ...chapter.quiz.questions.filter(
                    (q) => !incomingQuizData.questions.find((iq) => iq.id === q.id)
                ),
                ...incomingQuizData.questions
            ];
            chapter.quiz.title = incomingQuizData.title;
            chapter.quiz.description = incomingQuizData.description;
            chapter.quiz.passingScore = incomingQuizData.passingScore;
        } else {
            chapter.quiz = { ...incomingQuizData, chapterId };
        }

        await course.save();
        return res.json(course);

    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ message: "Server error", error: err.message || err });
    }
};

// ==================== ADMIN: Delete Quiz ====================
export const deleteQuiz = async (req: Request, res: Response) => {
    const { courseId, chapterId } = req.params;

    try {
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found" });

        if (chapterId === "final") {
            course.finalQuiz = undefined;
        } else {
            const chapter = course.chapters.find(ch => ch.id === chapterId);
            if (!chapter) return res.status(404).json({ message: "Chapter not found" });
            chapter.quiz = undefined;
        }

        await course.save();
        res.json(course);
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ message: "Server error", error: err.message || err });
    }
};

// ==================== USER: Get Quiz Questions ====================
export const getQuizQuestions = async (req: AuthRequest, res: Response) => {
    const { courseId, chapterId } = req.params;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    try {
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

        let quiz;
        let isFinalQuiz = false;

        // Check if this is final quiz request
        if (req.path.includes('/final-quiz')) {
            if (!course.finalQuiz) {
                return res.status(404).json({ message: "Brak testu końcowego" });
            }
            quiz = course.finalQuiz;
            isFinalQuiz = true;
        } else {
            // Chapter quiz
            const chapter = course.chapters.find(ch => ch.id === chapterId);
            if (!chapter) return res.status(404).json({ message: "Rozdział nie znaleziony" });
            if (!chapter.quiz) return res.status(404).json({ message: "Brak testu dla tego rozdziału" });
            quiz = chapter.quiz;
        }

        // Return questions without correct answers
        const questionsForUser = quiz.questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options
        }));

        // Check if user has already completed this quiz
        const existingResult = await QuizResult.findOne({
            userId,
            quizId: quiz.id,
            ...(isFinalQuiz ? { isFinalQuiz: true } : { chapterId })
        });

        res.json({
            quizId: quiz.id,
            title: quiz.title,
            description: quiz.description,
            passingScore: quiz.passingScore,
            questions: questionsForUser,
            isFinalQuiz,
            previousResult: existingResult ? {
                score: existingResult.score,
                passed: existingResult.passed,
                completedAt: existingResult.completedAt
            } : null
        });

    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ message: "Server error", error: err.message || err });
    }
};

// ==================== USER: Submit Quiz Answers ====================
export const submitQuizAnswers = async (req: AuthRequest, res: Response) => {
    const { courseId, chapterId } = req.params;
    const userId = req.user?._id;
    const { answers } = req.body; // { questionId: selectedOption }

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!answers) return res.status(400).json({ message: "Brak odpowiedzi" });

    try {
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

        let quiz;
        let isFinalQuiz = false;

        // Determine if final quiz or chapter quiz
        if (req.path.includes('/final-quiz')) {
            if (!course.finalQuiz) {
                return res.status(404).json({ message: "Brak testu końcowego" });
            }
            quiz = course.finalQuiz;
            isFinalQuiz = true;
        } else {
            const chapter = course.chapters.find(ch => ch.id === chapterId);
            if (!chapter) return res.status(404).json({ message: "Rozdział nie znaleziony" });
            if (!chapter.quiz) return res.status(404).json({ message: "Brak testu" });
            quiz = chapter.quiz;
        }

        // Calculate score
        let correctCount = 0;
        const totalQuestions = quiz.questions.length;

        quiz.questions.forEach(q => {
            const userAnswer = answers[q.id];
            if (userAnswer !== undefined) {
                const correctOptionIndex = q.correctAnswer;
                const correctOption = q.options[correctOptionIndex];
                if (userAnswer === correctOption) {
                    correctCount++;
                }
            }
        });

        const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
        const passed = scorePercentage >= quiz.passingScore;

        // Save result
        const quizResult = new QuizResult({
            userId,
            quizId: isFinalQuiz ? courseId : quiz.id, // For final quiz, use courseId
            chapterId: isFinalQuiz ? undefined : chapterId,
            score: scorePercentage,
            passed,
            isFinalQuiz,
            completedAt: new Date()
        });

        await quizResult.save();

        res.json({
            score: scorePercentage,
            passed,
            passingScore: quiz.passingScore,
            correctCount,
            totalQuestions,
            isFinalQuiz
        });

    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ message: "Server error", error: err.message || err });
    }
};