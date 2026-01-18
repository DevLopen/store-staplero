import { useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle,
  Lock,
  Play,
  ClipboardCheck,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

import { useCourse } from "@/hooks/useCourse";
import { useProgress } from "@/hooks/useProgress";
import { isChapterAccessible, needsQuiz } from "@/utils/access";
import { Course, Chapter } from "@/types/course.types";
import { isTopicAccessible } from "@/utils/progressUtils";

const CourseOverview = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { course, isLoading: courseLoading, error: courseError } = useCourse(courseId!);
  const {
    progress,
    quizResults,
    isLoading: progressLoading,
  } = useProgress(courseId!);

  useEffect(() => {
    if (!course || !progress) return;

    // Jeśli mamy chapterId i topicId w URL
    const urlParams = new URLSearchParams(window.location.search);
    const chapterIdFromUrl = urlParams.get("chapterId");
    const topicIdFromUrl = urlParams.get("topicId");

    course.chapters.forEach((chapter) => {
      const firstAccessibleTopic = chapter.topics.find((t) =>
          isTopicAccessible(chapter.id, t.id, course, progress)
      )?.id;

      // jeśli w URL próbujesz wejść w temat, który nie jest dostępny → przekieruj
      if (
          chapterIdFromUrl === chapter.id &&
          topicIdFromUrl &&
          topicIdFromUrl !== firstAccessibleTopic
      ) {
        navigate(`/course/${course.id}/chapter/${chapter.id}/topic/${firstAccessibleTopic}`, { replace: true });
      }
    });
  }, [course, progress, navigate]);


  const courseStats = useMemo(() => {
    if (!course) return null;

    let totalTopics = 0;
    let completedTopics = 0;

    course.chapters.forEach((chapter) => {
      chapter.topics.forEach((topic) => {
        totalTopics++;
        if (progress?.topics?.[topic.id]) completedTopics++;
      });
    });

    const percent =
        totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

    return { totalTopics, completedTopics, percent };
  }, [course, progress]);

  const getChapterProgress = (chapter: Chapter): number => {
    const completed = chapter.topics.filter(
        (t) => progress?.topics?.[t.id]
    ).length;

    return Math.round((completed / chapter.topics.length) * 100);
  };

  const getFirstAccessibleTopic = (chapter: Chapter): string | null => {
    if (!course || !progress) return null;

    for (const topic of chapter.topics) {
      if (isTopicAccessible(chapter.id, topic.id, course, progress)) {
        return topic.id;
      }
    }

    // Jeśli żaden temat nie jest dostępny, zwróć null
    return null;
  };

  if (courseLoading || progressLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <span>Lade Kurs...</span>
        </div>
    );
  }

  if (!course || !courseStats) return null;

  return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        <main className="flex-1 pt-24 pb-12">
          <div className="container mx-auto px-4 space-y-8">

            {/* HEADER */}
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                {course.title}
              </h1>
              <p className="text-muted-foreground">{course.description}</p>
            </div>

            {/* PROGRESS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <BookOpen className="w-10 h-10 opacity-80" />
                    <span className="text-4xl font-bold">
                    {courseStats.percent}%
                  </span>
                  </div>
                  <p className="font-medium">Gesamtfortschritt</p>
                  <Progress
                      value={courseStats.percent}
                      className="mt-2 bg-primary-foreground/20"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <CheckCircle className="w-10 h-10 text-success" />
                    <span className="text-4xl font-bold text-foreground">
                    {courseStats.completedTopics}/{courseStats.totalTopics}
                  </span>
                  </div>
                  <p className="text-muted-foreground font-medium">
                    Abgeschlossene Themen
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <ClipboardCheck className="w-10 h-10 text-primary" />
                    <span className="text-4xl font-bold text-foreground">
                    {course.chapters.length}
                  </span>
                  </div>
                  <p className="text-muted-foreground font-medium">
                    Kapitel insgesamt
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CHAPTER LIST */}
            <div className="space-y-6">
              {course.chapters.map((chapter) => {
                const chapterProgress = getChapterProgress(chapter);
                const chapterAccessible = isChapterAccessible(
                    chapter,
                    progress,
                    quizResults
                );
                const quizPassed = quizResults?.[chapter.id]?.passed;
                const showQuiz = needsQuiz(chapter, progress, quizResults);
                const firstTopic = getFirstAccessibleTopic(chapter);

                return (
                    <Card key={chapter.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-primary" />
                          {chapter.title}
                        </CardTitle>
                        <CardDescription>{chapter.description}</CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center gap-4">
                          {/* NUMBER */}
                          <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                  quizPassed
                                      ? "bg-success text-success-foreground"
                                      : !chapterAccessible
                                          ? "bg-muted text-muted-foreground"
                                          : "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                              }`}
                          >
                            {quizPassed ? (
                                <CheckCircle className="w-6 h-6" />
                            ) : !chapterAccessible ? (
                                <Lock className="w-6 h-6" />
                            ) : (
                                <span className="text-xl font-bold">
                            {chapter.order}
                          </span>
                            )}
                          </div>

                          {/* INFO */}
                          <div className="flex-1">
                            {chapter.quizRequired && !quizPassed && (
                                <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 px-3 py-1.5 rounded-lg w-fit mb-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span>Test erforderlich</span>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                              <Progress value={chapterProgress} className="flex-1" />
                              <span className="text-sm font-medium">
                            {chapterProgress}%
                          </span>
                            </div>
                          </div>

                          {/* ACTION */}
                          <div>
                            {!chapterAccessible ? (
                                <Button variant="secondary" disabled size="sm">
                                  <Lock className="w-4 h-4 mr-2" />
                                  Gesperrt
                                </Button>
                            ) : showQuiz ? (
                                <Link to={`/course/${course.id}/chapter/${chapter.id}/quiz`}>
                                  <Button size="sm" variant="hero">
                                    <ClipboardCheck className="w-4 h-4 mr-2" />
                                    Test starten
                                  </Button>
                                </Link>
                            ) : (
                                firstTopic && (
                                    <Link
                                        to={`/course/${course.id}/chapter/${chapter.id}/topic/${firstTopic}`}
                                    >
                                      <Button size="sm">
                                        {chapterProgress > 0 ? "Fortsetzen" : "Starten"}
                                        <Play className="w-4 h-4 ml-2" />
                                      </Button>
                                    </Link>
                                )
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

export default CourseOverview;
