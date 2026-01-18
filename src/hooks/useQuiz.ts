import { useState, useEffect } from "react";
import { fetchQuiz, submitQuizAPI } from "@/api/quiz.api";

export const useQuiz = (chapterId?: string) => {
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [quizResult, setQuizResult] = useState<{ passed: boolean; score: number } | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!chapterId) return;
            setLoading(true);
            try {
                const data = await fetchQuiz(chapterId);
                setQuestions(data.questions || []);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [chapterId]);

    const setAnswer = (questionId: string, answer: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    };

    const submitQuiz = async () => {
        if (!chapterId) return null;
        setSubmitting(true);
        try {
            const result = await submitQuizAPI(chapterId, answers);
            setQuizResult(result);
            return result;
        } finally {
            setSubmitting(false);
        }
    };

    return {
        questions,
        answers,
        setAnswer,
        loading,
        submitting,
        quizResult,
        submitQuiz,
    };
};
