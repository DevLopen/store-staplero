import { useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  BookOpen, CheckCircle, Lock, Play, ClipboardCheck, AlertTriangle, ChevronRight, Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCourse } from "@/hooks/useCourse";
import { useProgress } from "@/hooks/useProgress";
import { isChapterAccessible, needsQuiz } from "@/utils/access";
import { Chapter } from "@/types/course.types";
import { isTopicAccessible } from "@/utils/progressUtils";

const CourseOverview = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const { course, isLoading: courseLoading } = useCourse(courseId!);
  const { progress, quizResults, isLoading: progressLoading } = useProgress(courseId!);

  useEffect(() => {
    if (!course || !progress) return;
    const urlParams = new URLSearchParams(window.location.search);
    const chapterIdFromUrl = urlParams.get("chapterId");
    const topicIdFromUrl = urlParams.get("topicId");
    course.chapters.forEach(chapter => {
      const firstAccessibleTopic = chapter.topics.find(t =>
        isTopicAccessible(chapter.id, t.id, course, progress)
      )?.id;
      if (chapterIdFromUrl === chapter.id && topicIdFromUrl && topicIdFromUrl !== firstAccessibleTopic) {
        navigate(`/course/${course.id}/chapter/${chapter.id}/topic/${firstAccessibleTopic}`, { replace: true });
      }
    });
  }, [course, progress, navigate]);

  const courseStats = useMemo(() => {
    if (!course) return null;
    let totalTopics = 0, completedTopics = 0;
    course.chapters.forEach(ch => ch.topics.forEach(t => {
      totalTopics++;
      if (progress?.topics?.[t.id]) completedTopics++;
    }));
    return { totalTopics, completedTopics, percent: totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100) };
  }, [course, progress]);

  const getChapterProgress = (chapter: Chapter) => {
    const completed = chapter.topics.filter(t => progress?.topics?.[t.id]).length;
    return chapter.topics.length === 0 ? 0 : Math.round((completed / chapter.topics.length) * 100);
  };

  const getFirstAccessibleTopic = (chapter: Chapter): string | null => {
    if (!course || !progress) return null;
    for (const topic of chapter.topics) {
      if (isTopicAccessible(chapter.id, topic.id, course, progress)) return topic.id;
    }
    return null;
  };

  if (courseLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!course || !courseStats) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 space-y-8">

          {/* Header */}
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">{course.title}</h1>
            <p className="text-muted-foreground">{course.description}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <BookOpen className="w-10 h-10 opacity-80" />
                  <span className="text-4xl font-bold">{courseStats.percent}%</span>
                </div>
                <p className="font-medium">Postęp ogólny</p>
                <Progress value={courseStats.percent} className="mt-2 bg-primary-foreground/20" />
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
                <p className="text-muted-foreground font-medium">Ukończone tematy</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <ClipboardCheck className="w-10 h-10 text-primary" />
                  <span className="text-4xl font-bold text-foreground">{course.chapters.length}</span>
                </div>
                <p className="text-muted-foreground font-medium">Rozdziałów łącznie</p>
              </CardContent>
            </Card>
          </div>

          {/* Chapters */}
          <div className="space-y-4">
            {course.chapters.map(chapter => {
              const chapterProgress = getChapterProgress(chapter);
              const chapterAccessible = isChapterAccessible(chapter, progress, quizResults);
              const quizPassed = quizResults?.[chapter.id]?.passed;
              const showQuiz = needsQuiz(chapter, progress, quizResults);
              const firstTopic = getFirstAccessibleTopic(chapter);

              return (
                <Card key={chapter.id} className={!chapterAccessible ? "opacity-70" : ""}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <BookOpen className="w-5 h-5 text-primary flex-shrink-0" />
                      {chapter.title}
                    </CardTitle>
                    {chapter.description && (
                      <CardDescription>{chapter.description}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Status icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                        ${quizPassed
                          ? "bg-success/10 text-success"
                          : !chapterAccessible
                          ? "bg-muted text-muted-foreground"
                          : "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                        }`}
                      >
                        {quizPassed ? <CheckCircle className="w-6 h-6" /> :
                         !chapterAccessible ? <Lock className="w-6 h-6" /> :
                         <span className="text-xl font-bold">{chapter.order}</span>}
                      </div>

                      {/* Progress */}
                      <div className="flex-1 w-full">
                        {chapter.quiz && !quizPassed && (
                          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg w-fit mb-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Wymagany test</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Progress value={chapterProgress} className="flex-1" />
                          <span className="text-sm font-medium text-foreground w-10 text-right">{chapterProgress}%</span>
                        </div>
                      </div>

                      {/* Action button */}
                      <div className="w-full sm:w-auto">
                        {!chapterAccessible ? (
                          <Button variant="secondary" disabled size="sm" className="w-full sm:w-auto">
                            <Lock className="w-4 h-4 mr-2" /> Zablokowany
                          </Button>
                        ) : showQuiz ? (
                          <Link to={`/course/${course.id}/chapter/${chapter.id}/quiz`}>
                            <Button size="sm" className="w-full sm:w-auto">
                              <ClipboardCheck className="w-4 h-4 mr-2" /> Rozpocznij test
                            </Button>
                          </Link>
                        ) : firstTopic ? (
                          <Link to={`/course/${course.id}/chapter/${chapter.id}/topic/${firstTopic}`}>
                            <Button size="sm" className="w-full sm:w-auto">
                              {chapterProgress > 0 ? "Kontynuuj" : "Rozpocznij"}
                              <Play className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        ) : null}
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
