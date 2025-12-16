import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { mockCourse, isTopicAccessible, getCourseProgress } from "@/data/courseData";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Lock, 
  BookOpen,
  Menu,
  X,
  Home,
  Video
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const CourseView = () => {
  const { chapterId, topicId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
      return;
    }

    const savedProgress = localStorage.getItem("courseProgress");
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, [navigate]);

  const currentChapter = mockCourse.chapters.find(ch => ch.id === chapterId);
  const currentTopic = currentChapter?.topics.find(t => t.id === topicId);
  
  if (!currentChapter || !currentTopic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Thema nicht gefunden</h2>
          <Link to="/dashboard">
            <Button>Zurück zum Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Check if topic is accessible
  if (!isTopicAccessible(topicId!, progress)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <Lock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Thema gesperrt</h2>
          <p className="text-muted-foreground mb-4">
            Bitte schließen Sie zuerst die vorherigen Themen ab, um dieses Thema freizuschalten.
          </p>
          <Link to="/dashboard">
            <Button>Zurück zum Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const allTopics = mockCourse.chapters.flatMap(ch => ch.topics);
  const currentTopicIndex = allTopics.findIndex(t => t.id === topicId);
  const previousTopic = currentTopicIndex > 0 ? allTopics[currentTopicIndex - 1] : null;
  const nextTopic = currentTopicIndex < allTopics.length - 1 ? allTopics[currentTopicIndex + 1] : null;

  const markAsComplete = () => {
    const newProgress = { ...progress, [topicId!]: true };
    setProgress(newProgress);
    localStorage.setItem("courseProgress", JSON.stringify(newProgress));
  };

  const goToNextTopic = () => {
    markAsComplete();
    if (nextTopic) {
      navigate(`/course/${nextTopic.chapterId}/${nextTopic.id}`);
    } else {
      navigate("/dashboard");
    }
  };

  const courseProgress = getCourseProgress(progress);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 ${
        sidebarOpen ? 'w-80' : 'w-0'
      }`}>
        {sidebarOpen && (
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border">
              <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
                <Home className="w-4 h-4" />
                <span className="text-sm">Zurück zum Dashboard</span>
              </Link>
              <h2 className="font-display font-semibold text-foreground">{mockCourse.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={courseProgress} className="flex-1" />
                <span className="text-sm text-muted-foreground">{courseProgress}%</span>
              </div>
            </div>

            {/* Chapters & Topics */}
            <div className="flex-1 overflow-y-auto p-4">
              {mockCourse.chapters.map((chapter) => (
                <div key={chapter.id} className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                      {chapter.order}
                    </span>
                    {chapter.title}
                  </h3>
                  <div className="space-y-1 ml-8">
                    {chapter.topics.map((topic) => {
                      const isCompleted = progress[topic.id];
                      const isAccessible = isTopicAccessible(topic.id, progress);
                      const isCurrent = topic.id === topicId;

                      return (
                        <button
                          key={topic.id}
                          onClick={() => isAccessible && navigate(`/course/${chapter.id}/${topic.id}`)}
                          disabled={!isAccessible}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                            isCurrent 
                              ? 'bg-primary text-primary-foreground' 
                              : isCompleted 
                                ? 'text-success hover:bg-muted'
                                : isAccessible
                                  ? 'text-foreground hover:bg-muted'
                                  : 'text-muted-foreground cursor-not-allowed'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 shrink-0" />
                          ) : !isAccessible ? (
                            <Lock className="w-4 h-4 shrink-0" />
                          ) : (
                            <BookOpen className="w-4 h-4 shrink-0" />
                          )}
                          <span className="truncate">{topic.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-80 bg-card">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display font-semibold text-foreground">Kapitelübersicht</h2>
                <button onClick={() => setMobileSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {mockCourse.chapters.map((chapter) => (
                  <div key={chapter.id} className="mb-6">
                    <h3 className="text-sm font-semibold text-foreground mb-2">{chapter.title}</h3>
                    <div className="space-y-1">
                      {chapter.topics.map((topic) => {
                        const isCompleted = progress[topic.id];
                        const isAccessible = isTopicAccessible(topic.id, progress);
                        const isCurrent = topic.id === topicId;

                        return (
                          <button
                            key={topic.id}
                            onClick={() => {
                              if (isAccessible) {
                                navigate(`/course/${chapter.id}/${topic.id}`);
                                setMobileSidebarOpen(false);
                              }
                            }}
                            disabled={!isAccessible}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                              isCurrent 
                                ? 'bg-primary text-primary-foreground' 
                                : isCompleted 
                                  ? 'text-success hover:bg-muted'
                                  : isAccessible
                                    ? 'text-foreground hover:bg-muted'
                                    : 'text-muted-foreground cursor-not-allowed'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 shrink-0" />
                            ) : !isAccessible ? (
                              <Lock className="w-4 h-4 shrink-0" />
                            ) : (
                              <BookOpen className="w-4 h-4 shrink-0" />
                            )}
                            <span className="truncate">{topic.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-2 hover:bg-muted rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Kapitel {currentChapter.order}: {currentChapter.title}
            </p>
            <h1 className="font-display font-semibold text-foreground">{currentTopic.title}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{currentTopic.duration}</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <article className="max-w-3xl mx-auto px-4 py-8">
            {/* Video Section */}
            {currentTopic.videoUrl && (
              <div className="mb-8">
                <div className="flex items-center gap-2 text-primary mb-3">
                  <Video className="w-5 h-5" />
                  <span className="font-medium">Video zum Thema</span>
                </div>
                <div className="aspect-video rounded-xl overflow-hidden bg-muted shadow-lg">
                  <iframe
                    src={currentTopic.videoUrl}
                    title={currentTopic.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            <div className="prose prose-slate max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="font-display text-3xl font-bold text-foreground mb-6">{children}</h1>,
                  h2: ({ children }) => <h2 className="font-display text-2xl font-semibold text-foreground mt-8 mb-4">{children}</h2>,
                  h3: ({ children }) => <h3 className="font-display text-xl font-semibold text-foreground mt-6 mb-3">{children}</h3>,
                  p: ({ children }) => <p className="text-foreground mb-4 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-foreground">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full border-collapse border border-border">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">{children}</th>,
                  td: ({ children }) => <td className="border border-border px-4 py-2">{children}</td>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">{children}</blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{children}</code>
                  ),
                }}
              >
                {currentTopic.content}
              </ReactMarkdown>
            </div>
          </article>
        </div>

        {/* Bottom Navigation */}
        <footer className="bg-card border-t border-border px-4 py-4 sticky bottom-0">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            {previousTopic ? (
              <Link to={`/course/${previousTopic.chapterId}/${previousTopic.id}`}>
                <Button variant="outline">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Vorheriges Thema
                </Button>
              </Link>
            ) : (
              <div />
            )}

            <Button 
              variant="hero" 
              onClick={goToNextTopic}
              className="min-w-[200px]"
            >
              {progress[topicId!] ? (
                nextTopic ? "Nächstes Thema" : "Zum Dashboard"
              ) : (
                nextTopic ? "Als erledigt markieren & weiter" : "Kurs abschließen"
              )}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default CourseView;
