import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { mockCourse, Quiz as QuizType, QuizResult } from "@/data/courseData";
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Trophy, 
  RefreshCw,
  BookOpen,
  AlertTriangle
} from "lucide-react";

const Quiz = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<Record<string, QuizResult>>({});

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
      return;
    }

    const savedResults = localStorage.getItem("quizResults");
    if (savedResults) {
      setQuizResults(JSON.parse(savedResults));
    }
  }, [navigate]);

  const chapter = mockCourse.chapters.find(ch => ch.id === chapterId);
  const quiz = chapter?.quiz;

  if (!chapter || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 mx-auto text-warning mb-4" />
          <h2 className="text-xl font-semibold mb-2">Test nicht gefunden</h2>
          <p className="text-muted-foreground mb-4">
            Für dieses Kapitel ist kein Test verfügbar.
          </p>
          <Link to="/dashboard">
            <Button>Zurück zum Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Check if all topics in chapter are completed
  const savedProgress = localStorage.getItem("courseProgress");
  const progress = savedProgress ? JSON.parse(savedProgress) : {};
  const allTopicsCompleted = chapter.topics.every(t => progress[t.id]);

  if (!allTopicsCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <BookOpen className="w-16 h-16 mx-auto text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">Kapitel nicht abgeschlossen</h2>
          <p className="text-muted-foreground mb-4">
            Bitte schließen Sie zuerst alle Themen in diesem Kapitel ab, bevor Sie den Test beginnen.
          </p>
          <Link to="/dashboard">
            <Button>Zurück zum Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: parseInt(value) }));
  };

  const calculateScore = (): number => {
    let correct = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

  const handleSubmit = () => {
    const score = calculateScore();
    const passed = score >= quiz.passingScore;
    
    const result: QuizResult = {
      chapterId: chapterId!,
      passed,
      score,
      completedAt: new Date()
    };

    const newResults = { ...quizResults, [chapterId!]: result };
    setQuizResults(newResults);
    localStorage.setItem("quizResults", JSON.stringify(newResults));
    setShowResults(true);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const score = calculateScore();
  const passed = score >= quiz.passingScore;
  const currentQ = quiz.questions[currentQuestion];
  const progressPercent = Math.round(((currentQuestion + 1) / quiz.questions.length) * 100);

  if (showResults) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
              passed ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            }`}>
              {passed ? <Trophy className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
            </div>
            <CardTitle className="text-2xl">
              {passed ? 'Herzlichen Glückwunsch!' : 'Leider nicht bestanden'}
            </CardTitle>
            <CardDescription>
              {passed 
                ? 'Sie haben den Test erfolgreich bestanden!'
                : 'Versuchen Sie es noch einmal, nachdem Sie die Themen wiederholt haben.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2" style={{ color: passed ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }}>
                {score}%
              </div>
              <p className="text-muted-foreground">
                {quiz.questions.filter((q, i) => answers[i] === q.correctAnswer).length} von {quiz.questions.length} Fragen richtig
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Mindestens {quiz.passingScore}% erforderlich
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Ihre Antworten:</h3>
              {quiz.questions.map((q, index) => {
                const isCorrect = answers[index] === q.correctAnswer;
                return (
                  <div 
                    key={q.id} 
                    className={`p-3 rounded-lg flex items-center gap-3 ${
                      isCorrect ? 'bg-success/10' : 'bg-destructive/10'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-success shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive shrink-0" />
                    )}
                    <span className="text-sm">{q.question}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              {!passed && (
                <Button variant="outline" onClick={resetQuiz} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Erneut versuchen
                </Button>
              )}
              <Link to="/dashboard" className="flex-1">
                <Button className="w-full">
                  Zum Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Kapitel {chapter.order}: {chapter.title}</p>
              <h1 className="font-display font-semibold text-foreground">{quiz.title}</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Frage</p>
              <p className="font-semibold">{currentQuestion + 1} / {quiz.questions.length}</p>
            </div>
          </div>
          <Progress value={progressPercent} />
        </div>
      </header>

      {/* Question */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-xl">{currentQ.question}</CardTitle>
            <CardDescription>Wählen Sie die richtige Antwort</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={answers[currentQuestion]?.toString() || ""} 
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {currentQ.options.map((option, index) => (
                <div 
                  key={index}
                  className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                    answers[currentQuestion] === index 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => handleAnswer(index.toString())}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-card border-t border-border px-4 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            disabled={currentQuestion === 0}
          >
            Zurück
          </Button>

          {currentQuestion < quiz.questions.length - 1 ? (
            <Button 
              onClick={() => setCurrentQuestion(prev => prev + 1)}
              disabled={answers[currentQuestion] === undefined}
            >
              Weiter
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < quiz.questions.length}
              variant="hero"
            >
              Test abschließen
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Quiz;
