import { Request, Response } from "express";
import { nanoid } from "nanoid";
import Course, { Question, Quiz } from "../models/Course";
import QuizResult, { QuestionResult } from "../models/QuizResult";
import { AuthRequest } from "../types";

const generateId = (prefix = "") => `${prefix}${nanoid(8)}`;

// ─── ADMIN: Save / Update Quiz ────────────────────────────────────────────────

export const saveQuiz = async (req: Request, res: Response) => {
  try {
    const { courseId, chapterId } = req.params;
    const incoming = req.body as Partial<Quiz>;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    const quizData: Quiz = {
      id: incoming.id || generateId("q_"),
      title: incoming.title?.trim() || "Test",
      description: incoming.description?.trim(),
      passingScore: incoming.passingScore ?? 70,
      timeLimitSeconds: incoming.timeLimitSeconds,
      isFinalQuiz: chapterId === "final",
      questions: (incoming.questions ?? []).map(q => ({
        ...q,
        id: q.id || generateId("qn_"),
      })),
    };

    if (chapterId === "final") {
      quizData.isFinalQuiz = true;
      course.finalQuiz = quizData;
    } else {
      const chapter = course.chapters.find(ch => ch.id === chapterId);
      if (!chapter) return res.status(404).json({ message: "Rozdział nie znaleziony" });
      quizData.chapterId = chapterId;
      chapter.quiz = quizData;
    }

    await course.save();
    res.json(course);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── ADMIN: Delete Quiz ───────────────────────────────────────────────────────

export const deleteQuiz = async (req: Request, res: Response) => {
  try {
    const { courseId, chapterId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    if (chapterId === "final") {
      course.finalQuiz = undefined;
    } else {
      const chapter = course.chapters.find(ch => ch.id === chapterId);
      if (!chapter) return res.status(404).json({ message: "Rozdział nie znaleziony" });
      chapter.quiz = undefined;
    }

    await course.save();
    res.json(course);
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── USER: Get Quiz Questions (without correct answers) ───────────────────────

export const getQuizQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, chapterId } = req.params;
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Brak autoryzacji" });

    const course = await Course.findById(courseId).lean();
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    const isFinal = req.path.includes("/final-quiz");
    let quiz: Quiz | undefined;

    if (isFinal) {
      quiz = course.finalQuiz;
    } else {
      const chapter = course.chapters.find(ch => ch.id === chapterId);
      quiz = chapter?.quiz;
    }

    if (!quiz) return res.status(404).json({ message: "Quiz nie znaleziony" });

    // Strip correct answers before sending to user
    const questionsForUser = quiz.questions.map(stripCorrectAnswers);

    // Get previous attempts
    const query = isFinal
        ? { userId, courseId, isFinalQuiz: true }
        : { userId, courseId, chapterId, isFinalQuiz: false };

    const results = await QuizResult.find(query).sort({ completedAt: -1 }).limit(3).lean();

    res.json({
      quizId: quiz.id,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimitSeconds: quiz.timeLimitSeconds,
      isFinalQuiz: isFinal,
      questions: questionsForUser,
      attemptCount: results.length,
      bestScore: results.length ? Math.max(...results.map(r => r.score)) : null,
      previousResult: results[0]
          ? { score: results[0].score, passed: results[0].passed, completedAt: results[0].completedAt }
          : null,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── USER: Submit Quiz Answers ────────────────────────────────────────────────

export const submitQuizAnswers = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, chapterId } = req.params;
    const userId = req.user?._id;
    const { answers } = req.body as { answers: Record<string, unknown> };

    if (!userId) return res.status(401).json({ message: "Brak autoryzacji" });
    if (!answers) return res.status(400).json({ message: "Brak odpowiedzi" });

    const course = await Course.findById(courseId).lean();
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });

    const isFinal = req.path.includes("/final-quiz");
    let quiz: Quiz | undefined;

    if (isFinal) {
      quiz = course.finalQuiz;
    } else {
      const chapter = course.chapters.find(ch => ch.id === chapterId);
      quiz = chapter?.quiz;
    }

    if (!quiz) return res.status(404).json({ message: "Quiz nie znaleziony" });

    // Grade answers
    const { correctCount, questionResults } = gradeAnswers(quiz.questions, answers);
    const total = quiz.questions.length;
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = score >= quiz.passingScore;

    // Count attempts
    const attemptQuery = isFinal
        ? { userId, courseId, isFinalQuiz: true }
        : { userId, courseId, chapterId, isFinalQuiz: false };
    const attemptCount = await QuizResult.countDocuments(attemptQuery);

    const result = await QuizResult.create({
      userId,
      courseId,
      quizId: quiz.id,
      chapterId: isFinal ? undefined : chapterId,
      score,
      passed,
      isFinalQuiz: isFinal,
      attemptNumber: attemptCount + 1,
      questionResults,
      completedAt: new Date(),
    });

    // With correct answers for feedback
    const questionsWithFeedback = quiz.questions.map(q => ({
      ...stripCorrectAnswers(q),
      explanation: q.explanation,
      correctAnswer: q.correctAnswer,
      correctAnswers: q.correctAnswers,
      correctBool: q.correctBool,
      correctOrder: q.correctOrder,
      hotspots: q.hotspots,
      userAnswer: answers[q.id],
      wasCorrect: questionResults.find(r => r.questionId === q.id)?.correct ?? false,
    }));

    res.json({
      score,
      passed,
      passingScore: quiz.passingScore,
      correctCount,
      totalQuestions: total,
      isFinalQuiz: isFinal,
      attemptNumber: attemptCount + 1,
      questions: questionsWithFeedback,
      resultId: result._id,
    });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripCorrectAnswers(q: Question) {
  return {
    id: q.id,
    type: q.type ?? "single",
    question: q.question,
    imageUrl: q.imageUrl,
    options: q.options,
    items: q.items,
    hotspotImageUrl: q.hotspotImageUrl,
    hotspots: q.type === "hotspot"
        ? q.hotspots?.map(h => ({ id: h.id, x: h.x, y: h.y, label: h.label })) // no isHazard
        : undefined,
  };
}

function gradeAnswers(
    questions: Question[],
    answers: Record<string, unknown>
): { correctCount: number; questionResults: QuestionResult[] } {
  let correctCount = 0;
  const questionResults: QuestionResult[] = [];

  for (const q of questions) {
    const userAnswer = answers[q.id];
    let correct = false;

    switch (q.type ?? "single") {
      case "single": {
        // user sends option string
        const correctOption = q.options?.[q.correctAnswer ?? 0];
        correct = userAnswer === correctOption;
        break;
      }
      case "multi": {
        // user sends array of option strings
        const userArr = Array.isArray(userAnswer) ? userAnswer as string[] : [];
        const correctOptions = (q.correctAnswers ?? []).map(i => q.options?.[i]).filter(Boolean);
        correct =
            userArr.length === correctOptions.length &&
            correctOptions.every(opt => userArr.includes(opt as string));
        break;
      }
      case "truefalse": {
        correct = userAnswer === q.correctBool;
        break;
      }
      case "drag-order": {
        // user sends array of DragOrderItem ids
        const userOrder = Array.isArray(userAnswer) ? userAnswer as string[] : [];
        correct =
            userOrder.length === (q.correctOrder?.length ?? 0) &&
            (q.correctOrder ?? []).every((id, i) => id === userOrder[i]);
        break;
      }
      case "hotspot": {
        // user sends array of hotspot ids they marked as hazards
        const userMarked = Array.isArray(userAnswer) ? userAnswer as string[] : [];
        const actualHazards = (q.hotspots ?? []).filter(h => h.isHazard).map(h => h.id);
        const falsePositives = userMarked.filter(id => !actualHazards.includes(id));
        correct = actualHazards.every(id => userMarked.includes(id)) && falsePositives.length === 0;
        break;
      }
    }

    if (correct) correctCount++;
    questionResults.push({ questionId: q.id, correct, userAnswer: userAnswer as string | number | string[] | number[] | undefined });
  }

  return { correctCount, questionResults };
}