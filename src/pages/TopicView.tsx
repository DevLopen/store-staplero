import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Lock,
  BookOpen,
  Menu,
  X,
  Home,
  Video,
  Clock,
  FileText
} from "lucide-react";

import { useCourse } from "@/hooks/useCourse";
import { useProgress } from "@/hooks/useProgress";
import { Chapter, Topic } from "@/types/course.types";
import { isTopicAccessible } from "@/utils/progressUtils";

// Enhanced Markdown to HTML converter with better styling
function markdownToHTML(markdown: string): string {
  let html = markdown;

  // Headers with proper styling
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold text-foreground mb-6 mt-8 pb-3 border-b-2 border-primary/20">$1</h1>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold text-foreground mb-4 mt-8">$1</h2>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-2xl font-semibold text-foreground mb-3 mt-6">$1</h3>');

  // Bold and Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

  // Lists with better spacing
  html = html.replace(/^\- (.*$)/gim, '<li class="ml-6 mb-2 text-lg leading-relaxed">$1</li>');
  html = html.replace(/(<li.*?<\/li>(\n<li.*?<\/li>)*)/gm, '<ul class="list-disc space-y-2 my-6 ml-4">$1</ul>');

  // Numbered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2 text-lg leading-relaxed">$1</li>');

  // Code blocks with syntax highlighting placeholder
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted/50 border border-border p-6 rounded-xl my-6 overflow-x-auto"><code class="text-sm font-mono">$2</code></pre>');

  // Inline code
  html = html.replace(/`(.*?)`/g, '<code class="bg-primary/10 text-primary px-2 py-1 rounded font-mono text-sm">$1</code>');

  // Blockquotes - important notes
  html = html.replace(/^&gt; (.*$)/gim, '<div class="border-l-4 border-primary bg-primary/5 pl-6 pr-4 py-4 my-6 rounded-r-lg"><p class="text-lg italic">$1</p></div>');

  // Paragraphs with proper spacing
  html = html.replace(/\n\n/g, '</p><p class="text-lg leading-relaxed mb-4 text-foreground/90">');
  html = '<p class="text-lg leading-relaxed mb-4 text-foreground/90">' + html + '</p>';

  // Images (if any)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="rounded-xl my-6 shadow-lg max-w-full" />');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary hover:underline font-medium">$1</a>');

  return html;
}

const TopicView = () => {
  const { courseId, chapterId, topicId } = useParams<{
    courseId: string;
    chapterId: string;
    topicId: string;
  }>();
  const navigate = useNavigate();

  const { course, isLoading: courseLoading, error: courseError } = useCourse(courseId!);
  const { progress, markTopicComplete, isLoading: progressLoading } = useProgress(courseId!);

  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!course || !chapterId || !topicId) return;

    const ch = course.chapters.find(c => c.id === chapterId);
    if (!ch) return;
    setCurrentChapter(ch);

    const topic = ch.topics.find(t => t.id === topicId);
    if (!topic) return;
    setCurrentTopic(topic);
  }, [course, chapterId, topicId]);

  if (courseLoading || progressLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <span className="text-lg text-muted-foreground">Lade Thema...</span>
          </div>
        </div>
    );
  }

  if (courseError || !currentChapter || !currentTopic) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Card className="p-8 text-center max-w-md">
            <h2 className="text-xl font-semibold mb-4">Thema nicht gefunden</h2>
            <Link to="/dashboard">
              <Button>Zurück zum Dashboard</Button>
            </Link>
          </Card>
        </div>
    );
  }

  const allTopics = course.chapters.flatMap(chapter =>
      chapter.topics.map(topic => ({ ...topic, chapterId: chapter.id }))
  );
  const currentTopicIndex = allTopics.findIndex(t => t.id === topicId);
  const previousTopic = currentTopicIndex > 0 ? allTopics[currentTopicIndex - 1] : null;
  const nextTopic = currentTopicIndex < allTopics.length - 1 ? allTopics[currentTopicIndex + 1] : null;

  const goToNextTopic = async () => {
    if (!currentTopic) return;

    await markTopicComplete(currentChapter.id, currentTopic.id);

    if (nextTopic) {
      navigate(`/course/${courseId}/chapter/${nextTopic.chapterId}/topic/${nextTopic.id}`);
    } else {
      navigate("/dashboard");
    }
  };

  const courseProgress = course.chapters.reduce((acc, ch) => {
    const total = ch.topics.length;
    const done = ch.topics.filter(t => progress?.topics?.[t.id]).length;
    return acc + (done / total) * (100 / course.chapters.length);
  }, 0);

  return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:flex flex-col bg-card/80 backdrop-blur-sm border-r border-border transition-all duration-300 ${
            sidebarOpen ? 'w-80' : 'w-0'
        }`}>
          {sidebarOpen && (
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-border bg-card/50">
                  <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4 group">
                    <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Zurück zum Dashboard</span>
                  </Link>
                  <h2 className="font-display font-bold text-lg text-foreground">{course.title}</h2>
                  <div className="flex items-center gap-3 mt-3">
                    <Progress value={courseProgress} className="flex-1 h-2" />
                    <span className="text-sm font-semibold text-primary">{Math.floor(courseProgress)}%</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {course.chapters.map((chapter) => (
                      <div key={chapter.id} className="mb-6">
                        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs flex items-center justify-center font-bold shadow-sm">
                            {chapter.order}
                          </span>
                          {chapter.title}
                        </h3>
                        <div className="space-y-1 ml-10">
                          {chapter.topics.map((topic) => {
                            const isCompleted = progress?.topics?.[topic.id];
                            const accessible = isTopicAccessible(chapter.id, topic.id, course, progress);
                            const isCurrent = topic.id === topicId;

                            return (
                                <button
                                    key={topic.id}
                                    onClick={() => accessible && navigate(`/course/${courseId}/chapter/${chapter.id}/topic/${topic.id}`)}
                                    disabled={!accessible}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3 ${
                                        isCurrent
                                            ? 'bg-primary text-primary-foreground shadow-md scale-105'
                                            : isCompleted
                                                ? 'text-success hover:bg-success/10'
                                                : accessible
                                                    ? 'text-foreground hover:bg-muted'
                                                    : 'text-muted-foreground cursor-not-allowed opacity-50'
                                    }`}
                                >
                                  {isCompleted ? <CheckCircle className="w-4 h-4 shrink-0" />
                                      : !accessible ? <Lock className="w-4 h-4 shrink-0" />
                                          : <BookOpen className="w-4 h-4 shrink-0" />}
                                  <span className="truncate font-medium">{topic.title}</span>
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

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="bg-card/80 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center gap-4 sticky top-0 z-40 shadow-sm">
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block p-2 hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <FileText className="w-4 h-4" />
                <span>Kapitel {currentChapter.order}: {currentChapter.title}</span>
              </div>
              <h1 className="font-display font-bold text-xl text-foreground">{currentTopic.title}</h1>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{currentTopic.duration}</span>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-background">
            <article className="max-w-4xl mx-auto px-6 py-12">
              {/* Video if exists */}
              {currentTopic.videoUrl && (
                  <div className="mb-12 rounded-xl overflow-hidden shadow-2xl">
                    <div className="bg-gradient-to-r from-primary to-accent p-4 flex items-center gap-3">
                      <Video className="w-5 h-5 text-primary-foreground" />
                      <span className="font-semibold text-primary-foreground">Video-Lektion</span>
                    </div>
                    <div className="aspect-video bg-black">
                      <iframe
                          src={currentTopic.videoUrl}
                          className="w-full h-full"
                          allowFullScreen
                      />
                    </div>
                  </div>
              )}

              {/* Content */}
              <div
                  className="prose prose-lg prose-slate max-w-none
                  prose-headings:font-display
                  prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-8
                  prose-h2:text-3xl prose-h2:mb-4 prose-h2:mt-8
                  prose-h3:text-2xl prose-h3:mb-3 prose-h3:mt-6
                  prose-p:text-lg prose-p:leading-relaxed prose-p:mb-4
                  prose-li:text-lg prose-li:leading-relaxed
                  prose-strong:text-foreground prose-strong:font-bold
                  prose-code:bg-primary/10 prose-code:text-primary prose-code:px-2 prose-code:py-1 prose-code:rounded
                  prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border
                  prose-img:rounded-xl prose-img:shadow-lg
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: markdownToHTML(currentTopic.content) }}
              />

              {/* Progress indicator */}
              {progress?.topics?.[currentTopic.id] && (
                  <div className="mt-12 p-6 bg-success/10 border border-success/20 rounded-xl flex items-center gap-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                    <div>
                      <h3 className="font-bold text-success text-lg">Thema abgeschlossen!</h3>
                      <p className="text-sm text-success/80">Sie haben dieses Thema bereits durchgearbeitet.</p>
                    </div>
                  </div>
              )}
            </article>
          </div>

          {/* Footer Navigation */}
          <footer className="bg-card/80 backdrop-blur-sm border-t border-border px-6 py-4 sticky bottom-0 shadow-lg">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              {previousTopic ? (
                  <Button
                      variant="outline"
                      onClick={() => navigate(`/course/${courseId}/chapter/${previousTopic.chapterId}/topic/${previousTopic.id}`)}
                      className="group"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Vorheriges Thema
                  </Button>
              ) : <div />}

              <Button
                  variant="default"
                  size="lg"
                  onClick={goToNextTopic}
                  className="min-w-[240px] bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all group"
              >
                {progress?.topics?.[currentTopic.id] ? (
                    nextTopic ? (
                        <>
                          Nächstes Thema
                          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    ) : (
                        <>
                          Zum Dashboard
                          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )
                ) : (
                    nextTopic ? (
                        <>
                          Als erledigt markieren & weiter
                          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    ) : (
                        <>
                          Kurs abschließen
                          <CheckCircle className="w-5 h-5 ml-2" />
                        </>
                    )
                )}
              </Button>
            </div>
          </footer>
        </main>
      </div>
  );
};

export default TopicView;