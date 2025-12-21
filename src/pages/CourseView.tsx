import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Lock, BookOpen, ChevronLeft, ChevronRight, Video, Home, Menu, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useLocation } from "react-router-dom";

// Typy lokalne dla kursu
type Topic = {
  id: string;
  title: string;
  content: string;
  duration?: string;
  videoUrl?: string | null;
  chapterId?: string;
};

type Chapter = {
  id: string;
  title: string;
  description?: string;
  order?: number;
  topics: Topic[];
};

type Course = {
  _id: string;
  title: string;
  description?: string;
  chapters: Chapter[];
};

// Proste utility
const isTopicAccessible = (topicId: string, progress: Record<string, boolean>, course: Course) => {
  for (const ch of course.chapters) {
    for (const t of ch.topics) {
      if (t.id === topicId) return true; // tu można rozszerzyć logikę blokowania poprzednich tematów
    }
  }
  return false;
};

const getCourseProgress = (progress: Record<string, boolean>, course: Course) => {
  const allTopics = course.chapters.flatMap(ch => ch.topics);
  const completed = allTopics.filter(t => progress[t.id]).length;
  return Math.round((completed / allTopics.length) * 100);
};

const CourseView = () => {
  const { courseId, chapterId, topicId } = useParams<{ courseId: string, chapterId: string, topicId: string }>();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Pobranie kursów z localStorage
  const savedCourses = localStorage.getItem("userCourses");
  const location = useLocation();
  const userCourses = location.state?.userCourses || [];

  useEffect(() => {
    const savedProgress = localStorage.getItem("courseProgress");
    if (savedProgress) setProgress(JSON.parse(savedProgress));
  }, []);

  const course = userCourses.find(c => c._id === courseId);
  if (!course) return <NotFound message="Kurs nicht gefunden" />;

  const chapter = course.chapters.find(ch => ch.id === chapterId);
  if (!chapter) return <NotFound message="Kapitel nicht gefunden" />;

  const topic = chapter.topics.find(t => t.id === topicId);
  if (!topic) return <NotFound message="Thema nicht gefunden" />;

  if (!isTopicAccessible(topicId!, progress, course)) {
    return <LockedTopic />;
  }

  const allTopics = course.chapters.flatMap(ch => ch.topics);
  const currentIndex = allTopics.findIndex(t => t.id === topicId);
  const previousTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null;
  const nextTopic = currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null;

  const markAsComplete = () => {
    const newProgress = { ...progress, [topicId!]: true };
    setProgress(newProgress);
    localStorage.setItem("courseProgress", JSON.stringify(newProgress));
  };

  const goToNextTopic = () => {
    markAsComplete();
    if (nextTopic) navigate(`/course/${course._id}/${nextTopic.chapterId || chapter.id}/${nextTopic.id}`);
    else navigate("/dashboard");
  };

  const courseProgress = getCourseProgress(progress, course);

  return (
      <div className="min-h-screen flex bg-background">
        <aside className={`hidden lg:flex flex-col bg-card border-r border-border ${sidebarOpen ? 'w-80' : 'w-0'}`}>
          {sidebarOpen && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border">
                  <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
                    <Home className="w-4 h-4" /> Zurück zum Dashboard
                  </Link>
                  <h2 className="font-display font-semibold text-foreground">{course.title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={courseProgress} className="flex-1" />
                    <span className="text-sm text-muted-foreground">{courseProgress}%</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {course.chapters.map(ch => (
                      <div key={ch.id} className="mb-6">
                        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{ch.order}</span>
                          {ch.title}
                        </h3>
                        <div className="space-y-1 ml-8">
                          {ch.topics.map(t => {
                            const isCompleted = progress[t.id];
                            const isAccessible = isTopicAccessible(t.id, progress, course);
                            const isCurrent = t.id === topicId;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => isAccessible && navigate(`/course/${course._id}/${ch.id}/${t.id}`)}
                                    disabled={!isAccessible}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                                        isCurrent ? 'bg-primary text-primary-foreground' : isCompleted ? 'text-success hover:bg-muted' : isAccessible ? 'text-foreground hover:bg-muted' : 'text-muted-foreground cursor-not-allowed'
                                    }`}
                                >
                                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : !isAccessible ? <Lock className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                  <span className="truncate">{t.title}</span>
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

        <main className="flex-1 flex flex-col min-h-screen">
          <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Kapitel {chapter.order}: {chapter.title}</p>
              <h1 className="font-display font-semibold text-foreground">{topic.title}</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{topic.duration}</span>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-8 max-w-3xl mx-auto">
            {topic.videoUrl && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 text-primary mb-3">
                    <Video className="w-5 h-5" /> <span className="font-medium">Video zum Thema</span>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden bg-muted shadow-lg">
                    <iframe src={topic.videoUrl} title={topic.title} className="w-full h-full" allowFullScreen />
                  </div>
                </div>
            )}
            <ReactMarkdown>{topic.content}</ReactMarkdown>
          </div>

          <footer className="bg-card border-t border-border px-4 py-4 sticky bottom-0">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              {previousTopic ? (
                  <Link to={`/course/${course._id}/${previousTopic.chapterId || chapter.id}/${previousTopic.id}`}>
                    <Button variant="outline"><ChevronLeft className="w-4 h-4 mr-2" /> Vorheriges Thema</Button>
                  </Link>
              ) : <div />}
              <Button variant="hero" onClick={goToNextTopic} className="min-w-[200px]">
                {progress[topicId!] ? (nextTopic ? "Nächstes Thema" : "Zum Dashboard") : (nextTopic ? "Als erledigt markieren & weiter" : "Kurs abschließen")}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </footer>
        </main>
      </div>
  );
};

const NotFound = ({ message }: { message: string }) => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">{message}</h2>
        <Link to="/dashboard"><Button>Zurück zum Dashboard</Button></Link>
      </Card>
    </div>
);

const LockedTopic = () => (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 text-center max-w-md">
        <Lock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Thema gesperrt</h2>
        <p className="text-muted-foreground mb-4">Bitte schließen Sie zuerst die vorherigen Themen ab, um dieses Thema freizuschalten.</p>
        <Link to="/dashboard"><Button>Zurück zum Dashboard</Button></Link>
      </Card>
    </div>
);

export default CourseView;
