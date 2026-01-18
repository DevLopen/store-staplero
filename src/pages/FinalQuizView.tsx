import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertTriangle, Trophy, XCircle } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Question {
    id: string;
    question: string;
    options: string[];
}

interface QuizData {
    quizId: string;
    title: string;
    description?: string;
    passingScore: number;
    questions: Question[];
    isFinalQuiz: boolean;
    previousResult?: {
        score: number;
        passed: boolean;
        completedAt: Date;
    };
}

interface QuizResult {
    score: number;
    passed: boolean;
    passingScore: number;
    correctCount: number;
    totalQuestions: number;
}

const FinalQuizView = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [result, setResult] = useState<QuizResult | null>(null);

    useEffect(() => {
        fetchQuiz();
    }, [courseId]);

    const fetchQuiz = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/courses/${courseId}/final-quiz`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Quiz konnte nicht geladen werden");
            }

            const data = await res.json();
            setQuizData(data);
        } catch (err: any) {
            toast({
                title: "Fehler",
                description: err.message,
                variant: "destructive"
            });
            navigate("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!quizData) return;

        // Sprawdź czy wszystkie pytania mają odpowiedzi
        const unanswered = quizData.questions.filter(q => !answers[q.id]);
        if (unanswered.length > 0) {
            toast({
                title: "Unvollständig",
                description: `Bitte beantworten Sie alle Fragen (${unanswered.length} verbleibend)`,
                variant: "destructive"
            });
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch(`${API_URL}/courses/${courseId}/final-quiz`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ answers })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Fehler beim Absenden");
            }

            const resultData = await res.json();
            setResult(resultData);

            if (resultData.passed) {
                toast({
                    title: "Glückwunsch! 🎉",
                    description: "Sie haben den Abschlusstest bestanden!",
                    variant: "default"
                });
            } else {
                toast({
                    title: "Nicht bestanden",
                    description: "Versuchen Sie es erneut",
                    variant: "destructive"
                });
            }
        } catch (err: any) {
            toast({
                title: "Fehler",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const resetQuiz = () => {
        setAnswers({});
        setResult(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <span>Lade Test...</span>
            </div>
        );
    }

    if (!quizData) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-3xl space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mb-4">
                            <Trophy className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                            {quizData.title}
                        </h1>
                        {quizData.description && (
                            <p className="text-muted-foreground mb-4">{quizData.description}</p>
                        )}
                        <div className="flex items-center justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-primary" />
                                <span>Mindestpunktzahl: {quizData.passingScore}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-warning" />
                                <span>{quizData.questions.length} Fragen</span>
                            </div>
                        </div>
                    </div>

                    {/* Previous Result */}
                    {quizData.previousResult && !result && (
                        <Card className={quizData.previousResult.passed ? "border-success" : "border-destructive"}>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    {quizData.previousResult.passed ? (
                                        <CheckCircle className="w-8 h-8 text-success" />
                                    ) : (
                                        <XCircle className="w-8 h-8 text-destructive" />
                                    )}
                                    <div>
                                        <p className="font-semibold">
                                            {quizData.previousResult.passed ? "Bereits bestanden" : "Letzter Versuch"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Punktzahl: {quizData.previousResult.score}%
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Result Display */}
                    {result && (
                        <Card className={result.passed ? "border-success bg-success/5" : "border-destructive bg-destructive/5"}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {result.passed ? (
                                        <>
                                            <CheckCircle className="w-6 h-6 text-success" />
                                            Test bestanden!
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-6 h-6 text-destructive" />
                                            Nicht bestanden
                                        </>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    Sie haben {result.correctCount} von {result.totalQuestions} Fragen richtig beantwortet
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span>Ihre Punktzahl:</span>
                                        <span className="text-2xl font-bold">{result.score}%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span>Erforderlich:</span>
                                        <span>{result.passingScore}%</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <Button onClick={() => navigate("/dashboard")} className="flex-1">
                                        Zum Dashboard
                                    </Button>
                                    {!result.passed && (
                                        <Button onClick={resetQuiz} variant="outline" className="flex-1">
                                            Erneut versuchen
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Questions */}
                    {!result && quizData.questions.map((q, idx) => (
                        <Card key={q.id}>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Frage {idx + 1} von {quizData.questions.length}
                                </CardTitle>
                                <CardDescription className="text-base text-foreground">
                                    {q.question}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {q.options.map((opt) => (
                                        <label
                                            key={opt}
                                            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                answers[q.id] === opt
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name={q.id}
                                                value={opt}
                                                checked={answers[q.id] === opt}
                                                onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                                className="w-4 h-4"
                                            />
                                            <span className="flex-1">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Submit Button */}
                    {!result && (
                        <div className="sticky bottom-4 bg-background/80 backdrop-blur-sm border rounded-lg p-4">
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || Object.keys(answers).length !== quizData.questions.length}
                                className="w-full"
                                size="lg"
                                variant="hero"
                            >
                                {submitting ? (
                                    "Wird gesendet..."
                                ) : (
                                    <>
                                        <Trophy className="w-5 h-5 mr-2" />
                                        Test abschließen ({Object.keys(answers).length}/{quizData.questions.length})
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

// WAŻNE: Default export na końcu
export default FinalQuizView;