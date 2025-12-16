import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { mockCourse, getInitialProgress, getCourseProgress, isTopicAccessible, isChapterAccessible, QuizResult } from "@/data/courseData";
import { BookOpen, Clock, CheckCircle, Lock, ChevronRight, Play, Award, ClipboardCheck } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [quizResults, setQuizResults] = useState<Record<string, QuizResult>>({});
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const admin = localStorage.getItem("isAdmin") === "true";
    const name = localStorage.getItem("userName") || "Benutzer";
    
    if (!loggedIn) {
      navigate("/login");
      return;
    }
    
    setIsLoggedIn(loggedIn);
    setIsAdmin(admin);
    setUserName(name);
    
    // Load progress from localStorage or initialize
    const savedProgress = localStorage.getItem("courseProgress");
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    } else {
      const initial = getInitialProgress();
      setProgress(initial);
      localStorage.setItem("courseProgress", JSON.stringify(initial));
    }

    // Load quiz results
    const savedQuizResults = localStorage.getItem("quizResults");
    if (savedQuizResults) {
      setQuizResults(JSON.parse(savedQuizResults));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    navigate("/");
  };

  const courseProgress = getCourseProgress(progress);
  const completedTopics = Object.values(progress).filter(Boolean).length;
  const totalTopics = mockCourse.chapters.reduce((acc, ch) => acc + ch.topics.length, 0);

  const getChapterProgress = (chapterId: string): number => {
    const chapter = mockCourse.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return 0;
    const completed = chapter.topics.filter(t => progress[t.id]).length;
    return Math.round((completed / chapter.topics.length) * 100);
  };

  const isChapterComplete = (chapterId: string): boolean => {
    const chapter = mockCourse.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return false;
    return chapter.topics.every(t => progress[t.id]);
  };

  const isQuizPassed = (chapterId: string): boolean => {
    return quizResults[chapterId]?.passed === true;
  };

  const needsQuiz = (chapterId: string): boolean => {
    const chapter = mockCourse.chapters.find(ch => ch.id === chapterId);
    return isChapterComplete(chapterId) && chapter?.quiz && !isQuizPassed(chapterId);
  };

  const getFirstAccessibleTopic = (chapterId: string): string | null => {
    const chapter = mockCourse.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return null;
    
    for (const topic of chapter.topics) {
      if (!progress[topic.id] && isTopicAccessible(topic.id, progress, quizResults)) {
        return topic.id;
      }
    }
    return chapter.topics[0]?.id || null;
  };

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={handleLogout} />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Willkommen zurück, {userName}!
            </h1>
            <p className="text-muted-foreground">
              Setzen Sie Ihr Training fort und erreichen Sie Ihr Ziel.
            </p>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-10 h-10 opacity-80" />
                  <span className="text-4xl font-bold">{courseProgress}%</span>
                </div>
                <p className="font-medium">Gesamtfortschritt</p>
                <Progress value={courseProgress} className="mt-2 bg-primary-foreground/20" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="w-10 h-10 text-success" />
                  <span className="text-4xl font-bold text-foreground">
                    {completedTopics}/{totalTopics}
                  </span>
                </div>
                <p className="text-muted-foreground font-medium">Abgeschlossene Themen</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-10 h-10 text-primary" />
                  <span className="text-4xl font-bold text-foreground">
                    {mockCourse.chapters.length}
                  </span>
                </div>
                <p className="text-muted-foreground font-medium">Kapitel insgesamt</p>
              </CardContent>
            </Card>
          </div>

          {/* Course Chapters */}
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Kursübersicht
            </h2>
          </div>

          <div className="space-y-4">
            {mockCourse.chapters.map((chapter, index) => {
              const chapterProgress = getChapterProgress(chapter.id);
              const isComplete = isChapterComplete(chapter.id);
              const quizPassed = isQuizPassed(chapter.id);
              const showQuizButton = needsQuiz(chapter.id);
              const firstAccessibleTopic = getFirstAccessibleTopic(chapter.id);
              const isLocked = !isChapterAccessible(chapter.id, progress, quizResults);

              return (
                <Card 
                  key={chapter.id} 
                  className={`card-hover ${isLocked ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      {/* Chapter Number */}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                        isComplete && quizPassed
                          ? 'bg-success text-success-foreground' 
                          : isLocked 
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-gradient-to-br from-primary to-accent text-primary-foreground'
                      }`}>
                        {isComplete && quizPassed ? (
                          <CheckCircle className="w-7 h-7" />
                        ) : isLocked ? (
                          <Lock className="w-7 h-7" />
                        ) : (
                          <span className="text-2xl font-bold">{chapter.order}</span>
                        )}
                      </div>

                      {/* Chapter Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-display text-lg font-semibold text-foreground truncate">
                            {chapter.title}
                          </h3>
                          {isComplete && quizPassed && (
                            <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                              Abgeschlossen
                            </span>
                          )}
                          {showQuizButton && (
                            <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">
                              Test erforderlich
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {chapter.description}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BookOpen className="w-4 h-4" />
                            <span>{chapter.topics.length} Themen</span>
                          </div>
                          {chapter.quiz && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ClipboardCheck className="w-4 h-4" />
                              <span className={quizPassed ? 'text-success' : ''}>
                                {quizPassed ? 'Test bestanden' : 'Test vorhanden'}
                              </span>
                            </div>
                          )}
                          <Progress value={chapterProgress} className="flex-1 max-w-[200px]" />
                          <span className="text-sm font-medium text-foreground">{chapterProgress}%</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0">
                        {isLocked ? (
                          <Button variant="secondary" disabled>
                            <Lock className="w-4 h-4 mr-2" />
                            Gesperrt
                          </Button>
                        ) : showQuizButton ? (
                          <Link to={`/quiz/${chapter.id}`}>
                            <Button variant="hero">
                              <ClipboardCheck className="w-4 h-4 mr-2" />
                              Test starten
                            </Button>
                          </Link>
                        ) : (
                          <Link to={`/course/${chapter.id}/${firstAccessibleTopic}`}>
                            <Button variant={isComplete && quizPassed ? "outline" : "default"}>
                              {isComplete && quizPassed ? (
                                <>
                                  Wiederholen
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </>
                              ) : chapterProgress > 0 ? (
                                <>
                                  Fortsetzen
                                  <Play className="w-4 h-4 ml-1" />
                                </>
                              ) : (
                                <>
                                  Starten
                                  <Play className="w-4 h-4 ml-1" />
                                </>
                              )}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
