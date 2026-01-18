import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertTriangle } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCourse } from "@/hooks/useCourse";
import { useProgress } from "@/hooks/useProgress";
import { useQuiz } from "@/hooks/useQuiz";

const QuizView = () => {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { course, isLoading: courseLoading, error: courseError } = useCourse(courseId!);
  const { markTopicComplete } = useProgress(courseId!);

  const {
    questions,
    answers,
    setAnswer,
    loading: quizLoading,
    submitting,
    quizResult,
    fetchQuestions,
    submitQuiz,
  } = useQuiz(chapterId);

  useEffect(() => {
    if (courseError) {
      toast({
        title: "Fehler",
        description: "Kurs konnte nicht geladen werden",
        variant: "destructive",
      });
    }
  }, [courseError, toast]);

  const handleSubmit = async () => {
    const result = await submitQuiz();
    if (!result) return;

    if (result.passed) {
      toast({
        title: "Glückwunsch",
        description: "Quiz bestanden!",
        variant: "default",
      });

      // Oznaczenie wszystkich tematów chapter jako ukończone
      const chapter = course?.chapters.find((c) => c.id === chapterId);
      if (chapter) {
        for (const topic of chapter.topics) {
          await markTopicComplete(chapter.id, topic.id);
        }
      }

      // Przejście do kolejnego chapter lub zakończenie kursu
      const currentIndex = course?.chapters.findIndex((c) => c.id === chapterId) ?? -1;
      const nextChapter = course?.chapters[currentIndex + 1];
      if (nextChapter) {
        navigate(
            `/course/${courseId}/chapter/${nextChapter.id}/topic/${nextChapter.topics[0].id}`
        );
      } else {
        toast({
          title: "Kurs abgeschlossen",
          description: "Sie haben alle Kapitel abgeschlossen.",
          variant: "default",
        });
      }
    } else {
      toast({
        title: "Nicht bestanden",
        description: "Versuchen Sie es erneut",
        variant: "destructive",
      });
    }
  };

  if (courseLoading || quizLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <span>Lade Quiz...</span>
        </div>
    );
  }

  if (!course || !chapterId) return null;

  return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        <main className="flex-1 pt-24 pb-12">
          <div className="container mx-auto px-4 space-y-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">Quiz</h1>

            {questions.length === 0 && <p>Keine Fragen vorhanden.</p>}

            {questions.map((q) => (
                <Card key={q.id}>
                  <CardHeader>
                    <CardTitle>{q.question}</CardTitle>
                    {quizResult && (
                        <CardDescription>
                          {quizResult.passed ? (
                              <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Richtig
                      </span>
                          ) : (
                              <span className="text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Falsch
                      </span>
                          )}
                        </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {q.options.map((opt: string) => (
                        <div key={opt} className="flex items-center gap-2 mb-2">
                          <input
                              type="radio"
                              name={q.id}
                              value={opt}
                              checked={answers[q.id] === opt}
                              onChange={() => setAnswer(q.id, opt)}
                              disabled={!!quizResult}
                              className="cursor-pointer"
                          />
                          <label className="cursor-pointer">{opt}</label>
                        </div>
                    ))}
                  </CardContent>
                </Card>
            ))}

            <div className="mt-6">
              <Button
                  onClick={handleSubmit}
                  disabled={submitting || !!quizResult}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Quiz abschließen
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
  );
};

export default QuizView;
