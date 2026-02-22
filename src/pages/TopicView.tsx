import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, CheckCircle, Lock, Menu, X,
  BookOpen, Home, Clock, Award, PlayCircle, Trophy, GraduationCap
} from "lucide-react";
import { useCourse } from "@/hooks/useCourse";
import { useProgress } from "@/hooks/useProgress";
import { Chapter, ContentBlock } from "@/types/course.types";
import { BlocksRenderer } from "@/components/course/BlockRenderer";
import CourseAssistant from "@/components/course/CourseAssistant";

function getChapterStatus(
    chapter: Chapter,
    topics: Record<string, boolean>,
    quizzes: Record<string, { passed: boolean }>
) {
  const allDone = chapter.topics.every(t => topics[t.id]);
  const quizPassed = chapter.quiz ? quizzes[chapter.id]?.passed === true : true;
  return chapter.status ?? (allDone && quizPassed ? "complete" : "pending");
}

function totalTopicsCompleted(chapters: Chapter[], topics: Record<string, boolean>) {
  return chapters.reduce((sum, ch) => sum + ch.topics.filter(t => topics[t.id]).length, 0);
}

function totalTopics(chapters: Chapter[]) {
  return chapters.reduce((sum, ch) => sum + ch.topics.length, 0);
}

function isChapterBlocked(chapter: Chapter, chapterIndex: number, chapters: Chapter[], topics: Record<string, boolean>, quizzes: Record<string, { passed: boolean }>) {
  if (chapterIndex === 0) return false;
  const prevChapter = chapters[chapterIndex - 1];
  const prevAllDone = prevChapter.topics.every(t => topics[t.id]);
  const prevQuizPassed = prevChapter.quiz ? quizzes[prevChapter.id]?.passed === true : true;
  return !(prevAllDone && prevQuizPassed);
}

function extractTopicText(blocks: ContentBlock[]): string {
  return blocks
      .filter(b => b.type === 'richtext' || b.type === 'callout')
      .map(b => {
        if (b.type === 'richtext') return b.richtextData?.replace(/<[^>]+>/g, ' ') ?? '';
        if (b.type === 'callout') return `${b.calloutTitle ?? ''}: ${b.calloutText ?? ''}`;
        return '';
      })
      .join('\n')
      .slice(0, 3000);
}

const TopicView = () => {
  const { courseId, chapterId, topicId } = useParams<{
    courseId: string;
    chapterId: string;
    topicId: string;
  }>();
  const navigate = useNavigate();

  const { course, isLoading: courseLoading } = useCourse(courseId!);
  const { topics, quizzes, startTopic, markTopicComplete } = useProgress(courseId!);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completing, setCompleting] = useState(false);

  const currentChapter = course?.chapters.find(ch => ch.id === chapterId) ?? null;
  const currentTopic = currentChapter?.topics.find(t => t.id === topicId) ?? null;

  useEffect(() => {
    if (courseId && chapterId && topicId && currentChapter && currentTopic) {
      startTopic(chapterId, topicId);
    }
  }, [courseId, chapterId, topicId, currentChapter, currentTopic]);

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [topicId]);

  const findAdjacentTopic = useCallback(
      (direction: "next" | "prev"): { chapterId: string; topicId: string } | null => {
        if (!course) return null;
        const allTopics: { chapterId: string; topicId: string }[] = [];
        course.chapters.forEach(ch =>
            ch.topics.forEach(t => allTopics.push({ chapterId: ch.id, topicId: t.id }))
        );
        const idx = allTopics.findIndex(
            item => item.chapterId === chapterId && item.topicId === topicId
        );
        if (idx === -1) return null;
        return direction === "next" ? allTopics[idx + 1] ?? null : allTopics[idx - 1] ?? null;
      },
      [course, chapterId, topicId]
  );

  const goToTopic = (ch: string, t: string) =>
      navigate(`/course/${courseId}/chapter/${ch}/topic/${t}`);

  const handleComplete = async () => {
    if (!chapterId || !topicId || !course) return;
    setCompleting(true);
    await markTopicComplete(chapterId, topicId);
    setCompleting(false);

    const next = findAdjacentTopic("next");

    if (next && next.chapterId !== chapterId && currentChapter?.quiz && !quizzes[chapterId!]?.passed) {
      navigate(`/course/${courseId}/chapter/${chapterId}/quiz`);
    } else if (next) {
      goToTopic(next.chapterId, next.topicId);
    } else if (currentChapter?.quiz && !quizzes[chapterId!]?.passed) {
      navigate(`/course/${courseId}/chapter/${chapterId}/quiz`);
    } else if (course.finalQuiz) {
      navigate(`/course/${courseId}/final-quiz`);
    } else {
      navigate(`/course/${courseId}`);
    }
  };

  if (!courseLoading && course && (!currentChapter || !currentTopic)) {
    // chapter or topic was deleted - redirect to first available
    const firstChapter = course.chapters[0];
    const firstTopic = firstChapter?.topics[0];
    if (firstChapter && firstTopic) {
      navigate(`/course/${courseId}/chapter/${firstChapter.id}/topic/${firstTopic.id}`, { replace: true });
    } else {
      navigate(`/dashboard`, { replace: true });
    }
    return null;
  }

  if (courseLoading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Ładowanie kursu…</p>
          </div>
        </div>
    );
  }

  if (!course || !currentChapter || !currentTopic) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <GraduationCap className="h-16 w-16 mx-auto text-gray-300" />
            <p className="text-gray-500 text-lg">Nie znaleziono tematu.</p>
            <Link to="/dashboard">
              <Button className="bg-amber-500 hover:bg-amber-400 text-white font-semibold">Wróć do Dashboard</Button>
            </Link>
          </div>
        </div>
    );
  }

  const totalComplete = totalTopicsCompleted(course.chapters, topics);
  const total = totalTopics(course.chapters);
  const courseProgress = total > 0 ? Math.round((totalComplete / total) * 100) : 0;
  const isCurrentTopicComplete = topics[topicId!] === true;
  const prevTopic = findAdjacentTopic("prev");
  const nextTopic = findAdjacentTopic("next");
  const topicContent = extractTopicText(currentTopic.blocks ?? []);

  return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Top Bar */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-white/95 backdrop-blur-md border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex-shrink-0"
                  onClick={() => setSidebarOpen(o => !o)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-amber-600 transition-colors flex-shrink-0">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Dashboard</span>
              </Link>
              <span className="text-gray-300 flex-shrink-0">/</span>
              <span className="text-gray-700 text-sm font-medium truncate">{course.title}</span>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${courseProgress}%` }} />
                </div>
                <span className="text-gray-500 text-xs font-medium">{courseProgress}%</span>
              </div>
              {currentTopic.duration && (
                  <Badge variant="outline" className="text-gray-500 border-gray-200 gap-1.5 text-xs">
                    <Clock className="h-3 w-3" />
                    {currentTopic.duration}
                  </Badge>
              )}
            </div>
          </div>
        </header>

        <div className="flex flex-1 pt-14">
          {/* Sidebar */}
          <aside
              className="fixed left-0 top-14 bottom-0 z-40 w-72 overflow-y-auto transition-transform duration-300 ease-in-out border-r border-gray-200 bg-white shadow-sm"
              style={{
                transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              }}
          >
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1.5 font-medium">Kurs</p>
              <p className="text-gray-800 font-semibold text-sm leading-tight">{course.title}</p>
              <div className="flex items-center gap-2 mt-3 sm:hidden">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${courseProgress}%` }} />
                </div>
                <span className="text-gray-500 text-xs">{courseProgress}%</span>
              </div>
            </div>

            <nav className="p-3 pb-24">
              {course.chapters.map((chapter, chIdx) => {
                const chapterBlocked = isChapterBlocked(chapter, chIdx, course.chapters, topics, quizzes);
                const status = chapterBlocked ? "blocked" : getChapterStatus(chapter, topics, quizzes);
                const isActive = chapter.id === chapterId;

                return (
                    <div key={chapter.id} className="mb-1">
                      <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 ${isActive ? 'bg-amber-50' : ''}`}>
                        {status === "complete"
                            ? <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"><CheckCircle className="h-3 w-3 text-white" /></div>
                            : status === "blocked"
                                ? <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><Lock className="h-3 w-3 text-gray-400" /></div>
                                : <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center flex-shrink-0">
                                  <span className="text-[9px] font-bold text-amber-600">{chIdx + 1}</span>
                                </div>
                        }
                        <span className={`text-xs font-semibold uppercase tracking-wider truncate ${
                            status === "blocked" ? "text-gray-300"
                                : status === "complete" ? "text-green-600"
                                    : "text-gray-600"
                        }`}>
                      {chapter.title}
                    </span>
                      </div>

                      {!chapterBlocked && (
                          <div className="ml-4 space-y-0.5">
                            {chapter.topics.map((topic) => {
                              const isDone = topics[topic.id];
                              const isCurrent = topic.id === topicId;
                              return (
                                  <button
                                      key={topic.id}
                                      onClick={() => goToTopic(chapter.id, topic.id)}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                                          isCurrent ? 'bg-amber-50 text-amber-700' : 'hover:bg-gray-50'
                                      }`}
                                  >
                            <span className={`flex-shrink-0 ${isDone ? 'text-green-500' : isCurrent ? 'text-amber-500' : 'text-gray-300'}`}>
                              {isDone
                                  ? <CheckCircle className="h-3.5 w-3.5" />
                                  : isCurrent
                                      ? <PlayCircle className="h-3.5 w-3.5" />
                                      : <span className="block w-3.5 h-3.5 rounded-full border border-current" />
                              }
                            </span>
                                    <span className={`truncate text-xs font-medium ${
                                        isCurrent ? 'text-amber-700' : isDone ? 'text-green-600' : 'text-gray-500'
                                    }`}>{topic.title}</span>
                                  </button>
                              );
                            })}

                            {chapter.quiz && (
                                <Link
                                    to={`/course/${courseId}/chapter/${chapter.id}/quiz`}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all hover:bg-gray-50 ${
                                        quizzes[chapter.id]?.passed ? 'text-green-600' : 'text-amber-600'
                                    }`}
                                >
                                  <Award className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="truncate">Test: {chapter.quiz.title}</span>
                                  {quizzes[chapter.id]?.passed && <CheckCircle className="h-3 w-3 flex-shrink-0" />}
                                </Link>
                            )}
                          </div>
                      )}

                      {chapterBlocked && (
                          <div className="ml-9 px-2 py-1">
                            <p className="text-gray-300 text-xs italic">Odblokuj zaliczając poprzedni rozdział</p>
                          </div>
                      )}
                    </div>
                );
              })}

              {course.finalQuiz && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Link
                        to={`/course/${courseId}/final-quiz`}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-amber-600 hover:bg-amber-50"
                    >
                      <Trophy className="h-4 w-4" />
                      Egzamin końcowy
                    </Link>
                  </div>
              )}
            </nav>
          </aside>

          {/* Mobile overlay */}
          {sidebarOpen && (
              <div
                  className="fixed inset-0 z-30 bg-black/40 md:hidden"
                  onClick={() => setSidebarOpen(false)}
              />
          )}

          {/* Main content */}
          <main
              className="flex-1 min-w-0 transition-all duration-300 bg-white"
              style={{ marginLeft: sidebarOpen ? 'clamp(0px, 18rem, 18rem)' : '0' }}
          >
            <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs mb-6 flex-wrap">
                <span className="text-gray-400 uppercase tracking-wider font-medium">{currentChapter.title}</span>
                <ChevronRight className="h-3 w-3 text-gray-300" />
                <span className="text-amber-600">{currentTopic.title}</span>
                {isCurrentTopicComplete && (
                    <span className="flex items-center gap-1 text-green-600 ml-1">
                  <CheckCircle className="h-3 w-3" />
                  Ukończono
                </span>
                )}
              </div>

              {/* Topic title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 leading-tight">
                {currentTopic.title}
              </h1>

              {/* Blocks */}
              {(currentTopic.blocks ?? []).length > 0 ? (
                  <BlocksRenderer blocks={currentTopic.blocks ?? []} />
              ) : (
                  <div className="text-center py-20 text-gray-400">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <p className="text-lg">Ten temat nie ma jeszcze treści.</p>
                  </div>
              )}

              {/* Quiz reminder */}
              {currentChapter.quiz && !quizzes[chapterId!]?.passed && (
                  <div className="mt-10 p-5 rounded-2xl border border-amber-200 bg-amber-50">
                    <div className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-700 font-semibold text-sm">Test rozdziału wymagany</p>
                        <p className="text-amber-600/80 text-sm mt-0.5">Po ukończeniu wszystkich tematów musisz zdać test, aby odblokować następny rozdział.</p>
                      </div>
                    </div>
                  </div>
              )}

              {/* Navigation */}
              <div className="mt-12 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <Button
                    variant="outline"
                    onClick={() => prevTopic && goToTopic(prevTopic.chapterId, prevTopic.topicId)}
                    disabled={!prevTopic}
                    className="border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Poprzedni temat
                </Button>

                {isCurrentTopicComplete ? (
                    <Button
                        onClick={() => {
                          if (nextTopic) {
                            goToTopic(nextTopic.chapterId, nextTopic.topicId);
                          } else if (currentChapter?.quiz && !quizzes[chapterId!]?.passed) {
                            navigate(`/course/${courseId}/chapter/${chapterId}/quiz`);
                          } else if (course.finalQuiz) {
                            navigate(`/course/${courseId}/final-quiz`);
                          } else {
                            navigate(`/course/${courseId}`);
                          }
                        }}
                        className="font-semibold text-white bg-amber-500 hover:bg-amber-400"
                    >
                      {nextTopic
                          ? "Następny temat"
                          : currentChapter?.quiz && !quizzes[chapterId!]?.passed
                              ? "Przejdź do testu"
                              : "Zakończ kurs"
                      }
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleComplete}
                        disabled={completing}
                        className="font-semibold text-white bg-amber-500 hover:bg-amber-400"
                    >
                      {completing ? (
                          <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Zapisuję…
                    </span>
                      ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Oznacz jako ukończony
                          </>
                      )}
                    </Button>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Course AI Assistant */}
        <CourseAssistant
            courseTitle={course.title}
            chapterTitle={currentChapter.title}
            topicTitle={currentTopic.title}
            topicContent={topicContent}
            chapterId={chapterId!}
        />
      </div>
  );
};

export default TopicView;