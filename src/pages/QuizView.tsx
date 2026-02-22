import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getChapterQuiz, submitChapterQuiz } from "@/api/quiz.api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, XCircle, ChevronLeft, ChevronRight,
  Clock, RotateCcw
} from "lucide-react";
import { QuizQuestion } from "@/types/course.types";

function useTimer(seconds: number | undefined, onExpire: () => void) {
  const [remaining, setRemaining] = useState(seconds ?? 0);
  useEffect(() => {
    if (!seconds) return;
    setRemaining(seconds);
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(id); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);
  return remaining;
}

function QuestionCard({
                        question, answer, setAnswer, feedback,
                      }: {
  question: QuizQuestion;
  answer: unknown;
  setAnswer: (a: unknown) => void;
  feedback?: { wasCorrect: boolean; correctAnswer?: number; correctAnswers?: number[]; correctBool?: boolean; explanation?: string } | null;
}) {
  const { type, options } = question;

  return (
      <div className="space-y-4">
        {question.imageUrl && (
            <img src={question.imageUrl} alt="" className="w-full max-h-64 object-cover rounded-xl border border-gray-200" />
        )}

        {type === "single" && options && (
            <div className="space-y-2.5">
              {options.map((opt, idx) => {
                const selected = answer === opt;
                const isCorrect = feedback && idx === feedback.correctAnswer;
                const isWrong = feedback && selected && !isCorrect;
                return (
                    <button key={idx} onClick={() => !feedback && setAnswer(opt)} disabled={!!feedback}
                            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all
                  ${selected && !feedback ? "border-amber-500 bg-amber-50 text-amber-800" :
                                isCorrect ? "border-green-500 bg-green-50 text-green-800" :
                                    isWrong ? "border-red-400 bg-red-50 text-red-700" :
                                        "border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50/50"}`}>
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold
                  ${selected && !feedback ? "border-amber-500 bg-amber-500 text-white" :
                    isCorrect ? "border-green-500 bg-green-500 text-white" :
                        isWrong ? "border-red-400 bg-red-400 text-white" :
                            "border-gray-300 text-gray-400"}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                      <span className="text-sm leading-relaxed">{opt}</span>
                      {isCorrect && <CheckCircle className="h-4 w-4 text-green-500 ml-auto flex-shrink-0" />}
                      {isWrong && <XCircle className="h-4 w-4 text-red-400 ml-auto flex-shrink-0" />}
                    </button>
                );
              })}
            </div>
        )}

        {type === "multi" && options && (
            <div className="space-y-2.5">
              <p className="text-gray-400 text-xs mb-1">Możliwe kilka odpowiedzi</p>
              {options.map((opt, idx) => {
                const arr = (answer as string[]) ?? [];
                const selected = arr.includes(opt);
                const isCorrect = feedback && feedback.correctAnswers?.includes(idx);
                const isWrong = feedback && selected && !isCorrect;
                return (
                    <button key={idx} onClick={() => { if (feedback) return; const prev = (answer as string[]) ?? []; setAnswer(selected ? prev.filter(a => a !== opt) : [...prev, opt]); }} disabled={!!feedback}
                            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all
                  ${selected && !feedback ? "border-amber-500 bg-amber-50 text-amber-800" :
                                isCorrect ? "border-green-500 bg-green-50 text-green-800" :
                                    isWrong ? "border-red-400 bg-red-50 text-red-700" :
                                        "border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50/50"}`}>
                <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected ? "border-amber-500 bg-amber-500" : "border-gray-300"}`}>
                  {selected && <CheckCircle className="h-3 w-3 text-white" />}
                </span>
                      <span className="text-sm">{opt}</span>
                    </button>
                );
              })}
            </div>
        )}

        {type === "truefalse" && (
            <div className="flex gap-3">
              {[true, false].map(val => {
                const selected = answer === val;
                const isCorrect = feedback && val === feedback.correctBool;
                const isWrong = feedback && selected && !isCorrect;
                return (
                    <button key={String(val)} onClick={() => !feedback && setAnswer(val)} disabled={!!feedback}
                            className={`flex-1 py-5 rounded-xl border-2 font-semibold transition-all
                  ${selected && !feedback ? "border-amber-500 bg-amber-50 text-amber-700" :
                                isCorrect ? "border-green-500 bg-green-50 text-green-700" :
                                    isWrong ? "border-red-400 bg-red-50 text-red-600" :
                                        "border-gray-200 bg-white text-gray-600 hover:border-amber-300 hover:bg-amber-50/50"}`}>
                      {val ? "✅ Prawda" : "❌ Fałsz"}
                    </button>
                );
              })}
            </div>
        )}

        {feedback && question.explanation && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-xs text-blue-500 uppercase tracking-wider mb-1">Wyjaśnienie</p>
              <p className="text-blue-800 text-sm leading-relaxed">{question.explanation}</p>
            </div>
        )}
      </div>
  );
}

function ResultScreen({ score, passed, passingScore, correctCount, total, onRetry, onContinue }: {
  score: number; passed: boolean; passingScore: number; correctCount: number; total: number; onRetry: () => void; onContinue: () => void;
}) {
  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl ${passed ? "bg-green-100 ring-4 ring-green-200" : "bg-red-100 ring-4 ring-red-200"}`}>
            {passed ? "🏆" : "😔"}
          </div>
          <div>
            <h2 className="text-4xl font-bold text-gray-900">{score}%</h2>
            <p className={`text-lg mt-1 font-semibold ${passed ? "text-green-600" : "text-red-500"}`}>{passed ? "Zaliczono!" : "Nie zaliczono"}</p>
            <p className="text-gray-400 text-sm mt-2">{correctCount} z {total} poprawnych · próg: {passingScore}%</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={onRetry} variant="outline" className="flex-1 border-gray-200 text-gray-600">
              <RotateCcw className="h-4 w-4 mr-2" />Spróbuj ponownie
            </Button>
            <Button onClick={onContinue} className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-semibold">
              {passed ? "Kontynuuj" : "Wróć do materiałów"}
            </Button>
          </div>
        </div>
      </div>
  );
}

const QuizView = () => {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const remaining = useTimer(quizData?.timeLimitSeconds, () => handleSubmit());

  useEffect(() => {
    if (!courseId || !chapterId) return;
    getChapterQuiz(courseId, chapterId)
        .then(data => { setQuizData(data); setLoading(false); })
        .catch(() => { setLoading(false); });
  }, [courseId, chapterId]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await submitChapterQuiz(courseId!, chapterId!, answers);
      setResult(res);
      const fb: Record<string, any> = {};
      res.questions?.forEach((q: any) => { fb[q.id] = q; });
      setFeedbacks(fb);
    } finally { setSubmitting(false); }
  }, [courseId, chapterId, answers, submitting]);

  if (loading) return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
  );

  if (!quizData) return (
      <div className="min-h-screen bg-background flex items-center justify-center text-gray-400">Nie znaleziono testu.</div>
  );

  if (result) return (
      <ResultScreen score={result.score} passed={result.passed} passingScore={result.passingScore}
                    correctCount={result.correctCount} total={result.totalQuestions}
                    onRetry={() => { setResult(null); setAnswers({}); setFeedbacks({}); setCurrentIdx(0); }}
                    onContinue={() => navigate(`/course/${courseId}`)} />
  );

  const questions: QuizQuestion[] = quizData.questions ?? [];
  const q = questions[currentIdx];
  const progress = Math.round(((currentIdx + 1) / questions.length) * 100);
  const allAnswered = questions.every(qq => answers[qq.id] !== undefined && answers[qq.id] !== null);
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-gray-500 text-xs mb-1.5 font-medium">{quizData.title}</p>
              <Progress value={progress} className="h-1.5" />
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge variant="outline" className="text-gray-500 border-gray-200">{currentIdx + 1} / {questions.length}</Badge>
              {quizData.timeLimitSeconds && (
                  <Badge className={`gap-1.5 ${remaining < 60 ? "bg-red-500" : "bg-amber-500"} text-white`}>
                    <Clock className="h-3 w-3" />{formatTime(remaining)}
                  </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="pt-20 pb-24 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-amber-600 text-xs uppercase tracking-wider mb-2 font-semibold">Pytanie {currentIdx + 1}</p>
              <h2 className="text-xl font-semibold text-gray-900 leading-relaxed mb-6">{q.question}</h2>
              <QuestionCard question={q} answer={answers[q.id]} setAnswer={val => setAnswers(prev => ({ ...prev, [q.id]: val }))} feedback={feedbacks[q.id] ?? null} />
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-sm px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0} className="border-gray-200 text-gray-500 hover:bg-gray-50">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1.5 flex-wrap justify-center">
              {questions.map((qq, idx) => (
                  <button key={qq.id} onClick={() => setCurrentIdx(idx)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentIdx ? "bg-amber-500 scale-125" : answers[qq.id] !== undefined ? "bg-green-400" : "bg-gray-200"}`} />
              ))}
            </div>
            {currentIdx < questions.length - 1 ? (
                <Button onClick={() => setCurrentIdx(i => i + 1)} className="bg-amber-500 hover:bg-amber-400 text-white font-semibold">
                  <ChevronRight className="h-4 w-4" />
                </Button>
            ) : (
                <Button onClick={handleSubmit} disabled={submitting || !allAnswered} className="bg-amber-500 hover:bg-amber-400 text-white font-semibold px-5">
                  {submitting ? "Wysyłam…" : "Zakończ test"}
                </Button>
            )}
          </div>
        </div>
      </div>
  );
};

export default QuizView;