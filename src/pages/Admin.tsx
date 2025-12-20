import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { mockCourse, Chapter, Topic, Course, Quiz, QuizQuestion } from "@/data/courseData";
import { mockLocations, Location, CourseDate } from "@/data/practicalCourseData";
import { mockOrders, Order, getOrderStatusLabel, getOrderStatusColor } from "@/data/orderData";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  BookOpen,
  FileText,
  GripVertical,
  Users,
  BarChart3,
  Video,
  Library,
  ClipboardCheck,
  HelpCircle,
  MapPin,
  Calendar,
  Award,
  ChevronUp,
  ChevronDown,
  Timer,
  ShoppingBag,
  Euro,
  Eye,
  Phone,
  Mail
} from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [courses, setCourses] = useState<Course[]>([mockCourse]);
  const [selectedCourse, setSelectedCourse] = useState<Course>(mockCourse);

  // Locations state
  const [locations, setLocations] = useState<Location[]>(mockLocations);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingDate, setEditingDate] = useState<CourseDate | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [locationForm, setLocationForm] = useState({ city: "", address: "", price: "299", isActive: true });
  const [dateForm, setDateForm] = useState({ date: "", time: "08:00 - 16:00", availableSpots: "10" });

  // Orders state
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);

  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);

  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);

  // Form states
  const [chapterForm, setChapterForm] = useState({ title: "", description: "" });
  const [topicForm, setTopicForm] = useState({ title: "", content: "", duration: "", videoUrl: "", minDurationSeconds: "", requireMinDuration: false });
  const [courseForm, setCourseForm] = useState({ title: "", description: "" });
  const [quizForm, setQuizForm] = useState({ title: "", description: "", passingScore: "70", chapterId: "" });
  const [questionForm, setQuestionForm] = useState({
    question: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correctAnswer: "0"
  });
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [selectedQuizChapterId, setSelectedQuizChapterId] = useState<string>("");

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const admin = localStorage.getItem("isAdmin") === "true";

    if (!loggedIn) {
      navigate("/login");
      return;
    }

    if (!admin) {
      navigate("/dashboard");
      return;
    }

    setIsLoggedIn(loggedIn);
    setIsAdmin(admin);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("isAdmin");
    navigate("/");
  };

  // Course handlers
  const openCourseDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({ title: course.title, description: course.description });
    } else {
      setEditingCourse(null);
      setCourseForm({ title: "", description: "" });
    }
    setIsCourseDialogOpen(true);
  };

  const saveCourse = () => {
    if (!courseForm.title.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie einen Titel ein.", variant: "destructive" });
      return;
    }

    if (editingCourse) {
      setCourses(prev => prev.map(c =>
          c.id === editingCourse.id
              ? { ...c, title: courseForm.title, description: courseForm.description }
              : c
      ));
      if (selectedCourse.id === editingCourse.id) {
        setSelectedCourse(prev => ({ ...prev, title: courseForm.title, description: courseForm.description }));
      }
      toast({ title: "Erfolg", description: "Kurs wurde aktualisiert." });
    } else {
      const newCourse: Course = {
        id: `course${Date.now()}`,
        title: courseForm.title,
        description: courseForm.description,
        chapters: []
      };
      setCourses(prev => [...prev, newCourse]);
      setSelectedCourse(newCourse);
      toast({ title: "Erfolg", description: "Neuer Kurs wurde erstellt." });
    }
    setIsCourseDialogOpen(false);
  };

  const deleteCourse = (courseId: string) => {
    if (courses.length <= 1) {
      toast({ title: "Fehler", description: "Sie müssen mindestens einen Kurs behalten.", variant: "destructive" });
      return;
    }
    setCourses(prev => prev.filter(c => c.id !== courseId));
    if (selectedCourse.id === courseId) {
      setSelectedCourse(courses.find(c => c.id !== courseId) || courses[0]);
    }
    toast({ title: "Erfolg", description: "Kurs wurde gelöscht." });
  };

  // Chapter handlers
  const openChapterDialog = (chapter?: Chapter) => {
    if (chapter) {
      setEditingChapter(chapter);
      setChapterForm({ title: chapter.title, description: chapter.description });
    } else {
      setEditingChapter(null);
      setChapterForm({ title: "", description: "" });
    }
    setIsChapterDialogOpen(true);
  };

  const saveChapter = () => {
    if (!chapterForm.title.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie einen Titel ein.", variant: "destructive" });
      return;
    }

    if (editingChapter) {
      setSelectedCourse(prev => ({
        ...prev,
        chapters: prev.chapters.map(ch =>
            ch.id === editingChapter.id
                ? { ...ch, title: chapterForm.title, description: chapterForm.description }
                : ch
        )
      }));
      toast({ title: "Erfolg", description: "Kapitel wurde aktualisiert." });
    } else {
      const newChapter: Chapter = {
        id: `ch${Date.now()}`,
        title: chapterForm.title,
        description: chapterForm.description,
        order: selectedCourse.chapters.length + 1,
        topics: []
      };
      setSelectedCourse(prev => ({
        ...prev,
        chapters: [...prev.chapters, newChapter]
      }));
      toast({ title: "Erfolg", description: "Neues Kapitel wurde hinzugefügt." });
    }
    setIsChapterDialogOpen(false);
  };

  const deleteChapter = (chapterId: string) => {
    setSelectedCourse(prev => ({
      ...prev,
      chapters: prev.chapters.filter(ch => ch.id !== chapterId)
    }));
    toast({ title: "Erfolg", description: "Kapitel wurde gelöscht." });
  };

  // Topic handlers
  const openTopicDialog = (chapterId: string, topic?: Topic) => {
    setSelectedChapterId(chapterId);
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({
        title: topic.title,
        content: topic.content,
        duration: topic.duration,
        videoUrl: topic.videoUrl || "",
        minDurationSeconds: topic.minDurationSeconds?.toString() || "",
        requireMinDuration: topic.requireMinDuration || false
      });
    } else {
      setEditingTopic(null);
      setTopicForm({ title: "", content: "", duration: "15 min", videoUrl: "", minDurationSeconds: "", requireMinDuration: false });
    }
    setIsTopicDialogOpen(true);
  };

  const saveTopic = () => {
    if (!topicForm.title.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie einen Titel ein.", variant: "destructive" });
      return;
    }

    if (editingTopic) {
      setSelectedCourse(prev => ({
        ...prev,
        chapters: prev.chapters.map(ch => ({
          ...ch,
          topics: ch.topics.map(t =>
              t.id === editingTopic.id
                  ? {
                    ...t,
                    title: topicForm.title,
                    content: topicForm.content,
                    duration: topicForm.duration,
                    videoUrl: topicForm.videoUrl || undefined,
                    minDurationSeconds: topicForm.minDurationSeconds ? parseInt(topicForm.minDurationSeconds) : undefined,
                    requireMinDuration: topicForm.requireMinDuration
                  }
                  : t
          )
        }))
      }));
      toast({ title: "Erfolg", description: "Thema wurde aktualisiert." });
    } else {
      const chapter = selectedCourse.chapters.find(ch => ch.id === selectedChapterId);
      const newTopic: Topic = {
        id: `t${Date.now()}`,
        chapterId: selectedChapterId,
        title: topicForm.title,
        content: topicForm.content,
        order: chapter ? chapter.topics.length + 1 : 1,
        duration: topicForm.duration,
        videoUrl: topicForm.videoUrl || undefined,
        minDurationSeconds: topicForm.minDurationSeconds ? parseInt(topicForm.minDurationSeconds) : undefined,
        requireMinDuration: topicForm.requireMinDuration
      };
      setSelectedCourse(prev => ({
        ...prev,
        chapters: prev.chapters.map(ch =>
            ch.id === selectedChapterId
                ? { ...ch, topics: [...ch.topics, newTopic] }
                : ch
        )
      }));
      toast({ title: "Erfolg", description: "Neues Thema wurde hinzugefügt." });
    }
    setIsTopicDialogOpen(false);
  };

  // Topic sorting
  const moveTopicUp = (chapterId: string, topicId: string) => {
    setSelectedCourse(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => {
        if (ch.id !== chapterId) return ch;
        const topicIndex = ch.topics.findIndex(t => t.id === topicId);
        if (topicIndex <= 0) return ch;
        const newTopics = [...ch.topics];
        [newTopics[topicIndex - 1], newTopics[topicIndex]] = [newTopics[topicIndex], newTopics[topicIndex - 1]];
        return { ...ch, topics: newTopics.map((t, i) => ({ ...t, order: i + 1 })) };
      })
    }));
  };

  const moveTopicDown = (chapterId: string, topicId: string) => {
    setSelectedCourse(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch => {
        if (ch.id !== chapterId) return ch;
        const topicIndex = ch.topics.findIndex(t => t.id === topicId);
        if (topicIndex >= ch.topics.length - 1) return ch;
        const newTopics = [...ch.topics];
        [newTopics[topicIndex], newTopics[topicIndex + 1]] = [newTopics[topicIndex + 1], newTopics[topicIndex]];
        return { ...ch, topics: newTopics.map((t, i) => ({ ...t, order: i + 1 })) };
      })
    }));
  };

  const deleteTopic = (chapterId: string, topicId: string) => {
    setSelectedCourse(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
          ch.id === chapterId
              ? { ...ch, topics: ch.topics.filter(t => t.id !== topicId) }
              : ch
      )
    }));
    toast({ title: "Erfolg", description: "Thema wurde gelöscht." });
  };

  // Quiz handlers
  const openQuizDialog = (chapterId: string, quiz?: Quiz) => {
    setSelectedQuizChapterId(chapterId);
    if (quiz) {
      setEditingQuiz(quiz);
      setQuizForm({
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore.toString(),
        chapterId: quiz.chapterId
      });
    } else {
      setEditingQuiz(null);
      setQuizForm({ title: "", description: "", passingScore: "70", chapterId });
    }
    setIsQuizDialogOpen(true);
  };

  const saveQuiz = () => {
    if (!quizForm.title.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie einen Titel ein.", variant: "destructive" });
      return;
    }

    // Handle final quiz
    if (selectedQuizChapterId === "final") {
      if (editingQuiz) {
        setSelectedCourse(prev => ({
          ...prev,
          finalQuiz: prev.finalQuiz ? {
            ...prev.finalQuiz,
            title: quizForm.title,
            description: quizForm.description,
            passingScore: parseInt(quizForm.passingScore) || 80
          } : undefined
        }));
      } else {
        const newQuiz: Quiz = {
          id: `final-quiz-${Date.now()}`,
          title: quizForm.title,
          description: quizForm.description,
          passingScore: parseInt(quizForm.passingScore) || 80,
          isFinalQuiz: true,
          questions: []
        };
        setSelectedCourse(prev => ({ ...prev, finalQuiz: newQuiz }));
      }
      toast({ title: "Erfolg", description: "Abschlusstest wurde gespeichert." });
      setIsQuizDialogOpen(false);
      return;
    }

    // Handle chapter quiz
    if (editingQuiz) {
      setSelectedCourse(prev => ({
        ...prev,
        chapters: prev.chapters.map(ch =>
            ch.id === selectedQuizChapterId && ch.quiz
                ? {
                  ...ch,
                  quiz: {
                    ...ch.quiz,
                    title: quizForm.title,
                    description: quizForm.description,
                    passingScore: parseInt(quizForm.passingScore) || 70
                  }
                }
                : ch
        )
      }));
      toast({ title: "Erfolg", description: "Test wurde aktualisiert." });
    } else {
      const newQuiz: Quiz = {
        id: `quiz${Date.now()}`,
        chapterId: selectedQuizChapterId,
        title: quizForm.title,
        description: quizForm.description,
        passingScore: parseInt(quizForm.passingScore) || 70,
        questions: []
      };
      setSelectedCourse(prev => ({
        ...prev,
        chapters: prev.chapters.map(ch =>
            ch.id === selectedQuizChapterId
                ? { ...ch, quiz: newQuiz }
                : ch
        )
      }));
      toast({ title: "Erfolg", description: "Test wurde erstellt." });
    }
    setIsQuizDialogOpen(false);
  };

  const deleteQuiz = (chapterId: string) => {
    setSelectedCourse(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
          ch.id === chapterId
              ? { ...ch, quiz: undefined }
              : ch
      )
    }));
    toast({ title: "Erfolg", description: "Test wurde gelöscht." });
  };

  // Question handlers
  const openQuestionDialog = (chapterId: string, question?: QuizQuestion) => {
    setSelectedQuizChapterId(chapterId);
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        question: question.question,
        option1: question.options[0] || "",
        option2: question.options[1] || "",
        option3: question.options[2] || "",
        option4: question.options[3] || "",
        correctAnswer: question.correctAnswer.toString()
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        question: "",
        option1: "",
        option2: "",
        option3: "",
        option4: "",
        correctAnswer: "0"
      });
    }
    setIsQuestionDialogOpen(true);
  };

  const saveQuestion = () => {
    if (!questionForm.question.trim() || !questionForm.option1.trim() || !questionForm.option2.trim()) {
      toast({ title: "Fehler", description: "Bitte füllen Sie mindestens die Frage und 2 Antworten aus.", variant: "destructive" });
      return;
    }

    const options = [questionForm.option1, questionForm.option2];
    if (questionForm.option3.trim()) options.push(questionForm.option3);
    if (questionForm.option4.trim()) options.push(questionForm.option4);

    if (editingQuestion) {
      setSelectedCourse(prev => ({
        ...prev,
        chapters: prev.chapters.map(ch =>
            ch.id === selectedQuizChapterId && ch.quiz
                ? {
                  ...ch,
                  quiz: {
                    ...ch.quiz,
                    questions: ch.quiz.questions.map(q =>
                        q.id === editingQuestion.id
                            ? { ...q, question: questionForm.question, options, correctAnswer: parseInt(questionForm.correctAnswer) }
                            : q
                    )
                  }
                }
                : ch
        )
      }));
      toast({ title: "Erfolg", description: "Frage wurde aktualisiert." });
    } else {
      const newQuestion: QuizQuestion = {
        id: `q${Date.now()}`,
        question: questionForm.question,
        options,
        correctAnswer: parseInt(questionForm.correctAnswer)
      };
      setSelectedCourse(prev => ({
        ...prev,
        chapters: prev.chapters.map(ch =>
            ch.id === selectedQuizChapterId && ch.quiz
                ? { ...ch, quiz: { ...ch.quiz, questions: [...ch.quiz.questions, newQuestion] } }
                : ch
        )
      }));
      toast({ title: "Erfolg", description: "Frage wurde hinzugefügt." });
    }
    setIsQuestionDialogOpen(false);
  };

  const deleteQuestion = (chapterId: string, questionId: string) => {
    setSelectedCourse(prev => ({
      ...prev,
      chapters: prev.chapters.map(ch =>
          ch.id === chapterId && ch.quiz
              ? { ...ch, quiz: { ...ch.quiz, questions: ch.quiz.questions.filter(q => q.id !== questionId) } }
              : ch
      )
    }));
    toast({ title: "Erfolg", description: "Frage wurde gelöscht." });
  };

  if (!isLoggedIn || !isAdmin) return null;

  return (
      <div className="min-h-screen bg-background">
        <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={handleLogout} />

        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Admin-Bereich
              </h1>
              <p className="text-muted-foreground">
                Verwalten Sie Kurse, Kapitel und Themen.
              </p>
            </div>

            <Tabs defaultValue="courses" className="space-y-6">
              <TabsList className="grid w-full max-w-4xl grid-cols-7">
                <TabsTrigger value="courses" className="flex items-center gap-2">
                  <Library className="w-4 h-4" />
                  <span className="hidden sm:inline">Kurse</span>
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Inhalte</span>
                </TabsTrigger>
                <TabsTrigger value="tests" className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Tests</span>
                </TabsTrigger>
                <TabsTrigger value="locations" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">Standorte</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">Bestellungen</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Benutzer</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Statistiken</span>
                </TabsTrigger>
              </TabsList>

              {/* Courses Tab */}
              <TabsContent value="courses" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    Alle Kurse
                  </h2>
                  <Button onClick={() => openCourseDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Neuer Kurs
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                      <Card key={course.id} className={`cursor-pointer transition-all ${selectedCourse.id === course.id ? 'ring-2 ring-primary' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div onClick={() => setSelectedCourse(course)} className="flex-1 cursor-pointer">
                              <CardTitle className="text-lg">{course.title}</CardTitle>
                              <CardDescription className="mt-1">{course.description}</CardDescription>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openCourseDialog(course)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => deleteCourse(course.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{course.chapters.length} Kapitel</span>
                            <span>{course.chapters.reduce((acc, ch) => acc + ch.topics.length, 0)} Themen</span>
                          </div>
                        </CardContent>
                      </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Course Content Tab */}
              <TabsContent value="content" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Kapitel & Themen
                    </h2>
                    <p className="text-sm text-muted-foreground">Kurs: {selectedCourse.title}</p>
                  </div>
                  <Button onClick={() => openChapterDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Neues Kapitel
                  </Button>
                </div>

                <div className="space-y-4">
                  {selectedCourse.chapters.map((chapter) => (
                      <Card key={chapter.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                {chapter.order}
                              </div>
                              <div>
                                <CardTitle className="text-lg">{chapter.title}</CardTitle>
                                <CardDescription>{chapter.description}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openChapterDialog(chapter)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => deleteChapter(chapter.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {chapter.topics.map((topic, topicIndex) => (
                                <div
                                    key={topic.id}
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                      <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5"
                                          disabled={topicIndex === 0}
                                          onClick={() => moveTopicUp(chapter.id, topic.id)}
                                      >
                                        <ChevronUp className="w-3 h-3" />
                                      </Button>
                                      <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5"
                                          disabled={topicIndex === chapter.topics.length - 1}
                                          onClick={() => moveTopicDown(chapter.id, topic.id)}
                                      >
                                        <ChevronDown className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-foreground">{topic.title}</p>
                                        {topic.videoUrl && (
                                            <Video className="w-4 h-4 text-primary" />
                                        )}
                                        {topic.minDurationSeconds && (
                                            <Timer className="w-4 h-4 text-orange-500" />
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {topic.duration}
                                        {topic.minDurationSeconds && (
                                            <span className="ml-2 text-orange-500">
                                      (Min. {Math.floor(topic.minDurationSeconds / 60)} min)
                                    </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => openTopicDialog(chapter.id, topic)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => deleteTopic(chapter.id, topic.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                className="w-full mt-2"
                                onClick={() => openTopicDialog(chapter.id)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Thema hinzufügen
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                  ))}

                  {selectedCourse.chapters.length === 0 && (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-muted-foreground">Noch keine Kapitel vorhanden.</p>
                          <Button className="mt-4" onClick={() => openChapterDialog()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Erstes Kapitel erstellen
                          </Button>
                        </CardContent>
                      </Card>
                  )}
                </div>
              </TabsContent>

              {/* Tests Tab */}
              <TabsContent value="tests" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Kapitel-Tests & Abschlusstest
                    </h2>
                    <p className="text-sm text-muted-foreground">Kurs: {selectedCourse.title}</p>
                  </div>
                </div>

                {/* Final Quiz Section */}
                <Card className="border-2 border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Abschlusstest (Zertifizierung)</CardTitle>
                          <CardDescription>
                            {selectedCourse.finalQuiz
                                ? `Test: ${selectedCourse.finalQuiz.title} (${selectedCourse.finalQuiz.questions.length} Fragen)`
                                : 'Kein Abschlusstest vorhanden'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedCourse.finalQuiz ? (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => {
                                setEditingQuiz(selectedCourse.finalQuiz!);
                                setQuizForm({
                                  title: selectedCourse.finalQuiz!.title,
                                  description: selectedCourse.finalQuiz!.description,
                                  passingScore: selectedCourse.finalQuiz!.passingScore.toString(),
                                  chapterId: "final"
                                });
                                setSelectedQuizChapterId("final");
                                setIsQuizDialogOpen(true);
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setSelectedCourse(prev => ({ ...prev, finalQuiz: undefined }));
                                    toast({ title: "Erfolg", description: "Abschlusstest wurde gelöscht." });
                                  }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                        ) : (
                            <Button variant="outline" onClick={() => {
                              setEditingQuiz(null);
                              setQuizForm({ title: "", description: "", passingScore: "80", chapterId: "final" });
                              setSelectedQuizChapterId("final");
                              setIsQuizDialogOpen(true);
                            }}>
                              <Plus className="w-4 h-4 mr-2" />
                              Abschlusstest erstellen
                            </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {selectedCourse.finalQuiz && (
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <span>Bestehensgrenze: {selectedCourse.finalQuiz.passingScore}%</span>
                          </div>
                          {selectedCourse.finalQuiz.questions.map((question, idx) => (
                              <div
                                  key={question.id}
                                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium text-foreground">{idx + 1}. {question.question}</p>
                                    <p className="text-sm text-muted-foreground">{question.options.length} Antworten</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => {
                                    setSelectedQuizChapterId("final");
                                    setEditingQuestion(question);
                                    setQuestionForm({
                                      question: question.question,
                                      option1: question.options[0] || "",
                                      option2: question.options[1] || "",
                                      option3: question.options[2] || "",
                                      option4: question.options[3] || "",
                                      correctAnswer: question.correctAnswer.toString()
                                    });
                                    setIsQuestionDialogOpen(true);
                                  }}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => {
                                        setSelectedCourse(prev => ({
                                          ...prev,
                                          finalQuiz: prev.finalQuiz ? {
                                            ...prev.finalQuiz,
                                            questions: prev.finalQuiz.questions.filter(q => q.id !== question.id)
                                          } : undefined
                                        }));
                                        toast({ title: "Erfolg", description: "Frage wurde gelöscht." });
                                      }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                          ))}
                          <Button
                              variant="outline"
                              className="w-full mt-2"
                              onClick={() => {
                                setSelectedQuizChapterId("final");
                                setEditingQuestion(null);
                                setQuestionForm({ question: "", option1: "", option2: "", option3: "", option4: "", correctAnswer: "0" });
                                setIsQuestionDialogOpen(true);
                              }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Frage hinzufügen
                          </Button>
                        </div>
                      </CardContent>
                  )}
                </Card>

                {/* Chapter Quizzes */}
                <div className="space-y-4">
                  {selectedCourse.chapters.map((chapter) => (
                      <Card key={chapter.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                {chapter.order}
                              </div>
                              <div>
                                <CardTitle className="text-lg">{chapter.title}</CardTitle>
                                <CardDescription>
                                  {chapter.quiz ? `Test: ${chapter.quiz.title} (${chapter.quiz.questions.length} Fragen)` : 'Kein Test vorhanden'}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {chapter.quiz ? (
                                  <>
                                    <Button variant="ghost" size="icon" onClick={() => openQuizDialog(chapter.id, chapter.quiz)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => deleteQuiz(chapter.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                              ) : (
                                  <Button variant="outline" onClick={() => openQuizDialog(chapter.id)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Test erstellen
                                  </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        {chapter.quiz && (
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                                  <span>Bestehensgrenze: {chapter.quiz.passingScore}%</span>
                                </div>
                                {chapter.quiz.questions.map((question, idx) => (
                                    <div
                                        key={question.id}
                                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                    >
                                      <div className="flex items-center gap-3">
                                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium text-foreground">{idx + 1}. {question.question}</p>
                                          <p className="text-sm text-muted-foreground">{question.options.length} Antworten</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openQuestionDialog(chapter.id, question)}>
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => deleteQuestion(chapter.id, question.id)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    className="w-full mt-2"
                                    onClick={() => openQuestionDialog(chapter.id)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Frage hinzufügen
                                </Button>
                              </div>
                            </CardContent>
                        )}
                      </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Locations Tab */}
              <TabsContent value="locations" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Standorte & Termine
                    </h2>
                    <p className="text-sm text-muted-foreground">Verwalten Sie Standorte für praktische Kurse</p>
                  </div>
                  <Button onClick={() => {
                    setEditingLocation(null);
                    setLocationForm({ city: "", address: "", price: "299", isActive: true });
                    setIsLocationDialogOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Neuer Standort
                  </Button>
                </div>

                <div className="space-y-4">
                  {locations.map((location) => (
                      <Card key={location.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${location.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                <MapPin className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-lg">{location.city}</CardTitle>
                                  {!location.isActive && (
                                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Inaktiv</span>
                                  )}
                                </div>
                                <CardDescription>{location.address}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-primary">{location.price} €</span>
                              <Button variant="ghost" size="icon" onClick={() => {
                                setEditingLocation(location);
                                setLocationForm({
                                  city: location.city,
                                  address: location.address,
                                  price: location.price.toString(),
                                  isActive: location.isActive
                                });
                                setIsLocationDialogOpen(true);
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setLocations(prev => prev.filter(l => l.id !== location.id));
                                    toast({ title: "Erfolg", description: "Standort wurde gelöscht." });
                                  }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                              <span>{location.dates.length} Termine</span>
                            </div>
                            {location.dates.map((date) => (
                                <div
                                    key={date.id}
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                      <p className="font-medium text-foreground">
                                        {new Date(date.date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                      </p>
                                      <p className="text-sm text-muted-foreground">{date.time} • {date.availableSpots} Plätze</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => {
                                      setSelectedLocationId(location.id);
                                      setEditingDate(date);
                                      setDateForm({
                                        date: date.date,
                                        time: date.time,
                                        availableSpots: date.availableSpots.toString()
                                      });
                                      setIsDateDialogOpen(true);
                                    }}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => {
                                          setLocations(prev => prev.map(l =>
                                              l.id === location.id
                                                  ? { ...l, dates: l.dates.filter(d => d.id !== date.id) }
                                                  : l
                                          ));
                                          toast({ title: "Erfolg", description: "Termin wurde gelöscht." });
                                        }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                className="w-full mt-2"
                                onClick={() => {
                                  setSelectedLocationId(location.id);
                                  setEditingDate(null);
                                  setDateForm({ date: "", time: "08:00 - 16:00", availableSpots: "10" });
                                  setIsDateDialogOpen(true);
                                }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Termin hinzufügen
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                  ))}

                  {locations.length === 0 && (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-muted-foreground">Noch keine Standorte vorhanden.</p>
                          <Button className="mt-4" onClick={() => {
                            setEditingLocation(null);
                            setLocationForm({ city: "", address: "", price: "299", isActive: true });
                            setIsLocationDialogOpen(true);
                          }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Ersten Standort erstellen
                          </Button>
                        </CardContent>
                      </Card>
                  )}
                </div>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Bestellungen
                    </h2>
                    <p className="text-sm text-muted-foreground">Übersicht aller Bestellungen</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {orders.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-muted-foreground">Noch keine Bestellungen vorhanden.</p>
                        </CardContent>
                      </Card>
                  ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Bestellung</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Kunde</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Datum</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Betrag</th>
                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Aktionen</th>
                          </tr>
                          </thead>
                          <tbody>
                          {orders.map((order) => (
                              <tr key={order.id} className="border-b border-border hover:bg-muted/30">
                                <td className="py-3 px-4">
                                  <span className="font-medium text-foreground">#{order.id}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <div>
                                    <p className="font-medium text-foreground">{order.userName}</p>
                                    <p className="text-sm text-muted-foreground">{order.userEmail}</p>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString('de-DE')}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-semibold text-foreground">{order.total.toFixed(2)} €</span>
                                </td>
                                <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getOrderStatusColor(order.status)}`}>
                                {getOrderStatusLabel(order.status)}
                              </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setSelectedOrder(order);
                                          setIsOrderDetailOpen(true);
                                        }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Select
                                        value={order.status}
                                        onValueChange={(value) => {
                                          setOrders(prev => prev.map(o =>
                                              o.id === order.id
                                                  ? { ...o, status: value as Order['status'] }
                                                  : o
                                          ));
                                          toast({ title: "Erfolg", description: "Status wurde aktualisiert." });
                                        }}
                                    >
                                      <SelectTrigger className="w-32">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Ausstehend</SelectItem>
                                        <SelectItem value="paid">Bezahlt</SelectItem>
                                        <SelectItem value="completed">Abgeschlossen</SelectItem>
                                        <SelectItem value="cancelled">Storniert</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                  )}
                </div>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>Benutzerverwaltung</CardTitle>
                    <CardDescription>
                      Verwalten Sie registrierte Benutzer und deren Zugänge.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Benutzerverwaltung wird nach der Datenbankintegration verfügbar sein.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats">
                <Card>
                  <CardHeader>
                    <CardTitle>Statistiken</CardTitle>
                    <CardDescription>
                      Übersicht über Kursnutzung und Benutzeraktivitäten.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Statistiken werden nach der Datenbankintegration verfügbar sein.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Quiz Dialog */}
        <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingQuiz ? "Test bearbeiten" : "Neuen Test erstellen"}</DialogTitle>
              <DialogDescription>Geben Sie die Details für den Test ein.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quiz-title">Titel</Label>
                <Input id="quiz-title" value={quizForm.title} onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))} placeholder="z.B. Kapitel 1 Abschlusstest" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiz-desc">Beschreibung</Label>
                <Textarea id="quiz-desc" value={quizForm.description} onChange={(e) => setQuizForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Kurze Beschreibung..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiz-score">Bestehensgrenze (%)</Label>
                <Input id="quiz-score" type="number" min="1" max="100" value={quizForm.passingScore} onChange={(e) => setQuizForm(prev => ({ ...prev, passingScore: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsQuizDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={saveQuiz}><Save className="w-4 h-4 mr-2" />Speichern</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Question Dialog */}
        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "Frage bearbeiten" : "Neue Frage erstellen"}</DialogTitle>
              <DialogDescription>Geben Sie die Frage und Antwortmöglichkeiten ein.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="q-question">Frage</Label>
                <Textarea id="q-question" value={questionForm.question} onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))} placeholder="Ihre Frage..." rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Antwort 1</Label>
                  <Input value={questionForm.option1} onChange={(e) => setQuestionForm(prev => ({ ...prev, option1: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Antwort 2</Label>
                  <Input value={questionForm.option2} onChange={(e) => setQuestionForm(prev => ({ ...prev, option2: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Antwort 3 (optional)</Label>
                  <Input value={questionForm.option3} onChange={(e) => setQuestionForm(prev => ({ ...prev, option3: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Antwort 4 (optional)</Label>
                  <Input value={questionForm.option4} onChange={(e) => setQuestionForm(prev => ({ ...prev, option4: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Richtige Antwort</Label>
                <Select value={questionForm.correctAnswer} onValueChange={(v) => setQuestionForm(prev => ({ ...prev, correctAnswer: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Antwort 1</SelectItem>
                    <SelectItem value="1">Antwort 2</SelectItem>
                    <SelectItem value="2">Antwort 3</SelectItem>
                    <SelectItem value="3">Antwort 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={saveQuestion}><Save className="w-4 h-4 mr-2" />Speichern</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Course Dialog */}
        <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? "Kurs bearbeiten" : "Neuen Kurs erstellen"}
              </DialogTitle>
              <DialogDescription>
                Geben Sie die Details für den Kurs ein.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="course-title">Titel</Label>
                <Input
                    id="course-title"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="z.B. Staplerschein Theorie"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-desc">Beschreibung</Label>
                <Textarea
                    id="course-desc"
                    value={courseForm.description}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Kurze Beschreibung des Kurses..."
                    rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCourseDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={saveCourse}>
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Chapter Dialog */}
        <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingChapter ? "Kapitel bearbeiten" : "Neues Kapitel erstellen"}
              </DialogTitle>
              <DialogDescription>
                Geben Sie die Details für das Kapitel ein.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="chapter-title">Titel</Label>
                <Input
                    id="chapter-title"
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="z.B. Grundlagen der Gabelstapler"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chapter-desc">Beschreibung</Label>
                <Textarea
                    id="chapter-desc"
                    value={chapterForm.description}
                    onChange={(e) => setChapterForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Kurze Beschreibung des Kapitels..."
                    rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsChapterDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={saveChapter}>
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Topic Dialog */}
        <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTopic ? "Thema bearbeiten" : "Neues Thema erstellen"}
              </DialogTitle>
              <DialogDescription>
                Geben Sie die Details für das Thema ein.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic-title">Titel</Label>
                  <Input
                      id="topic-title"
                      value={topicForm.title}
                      onChange={(e) => setTopicForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="z.B. Was ist ein Gabelstapler?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic-duration">Dauer</Label>
                  <Input
                      id="topic-duration"
                      value={topicForm.duration}
                      onChange={(e) => setTopicForm(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="z.B. 15 min"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic-min-duration" className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    Mindestzeit (Sekunden)
                  </Label>
                  <Input
                      id="topic-min-duration"
                      type="number"
                      value={topicForm.minDurationSeconds}
                      onChange={(e) => setTopicForm(prev => ({ ...prev, minDurationSeconds: e.target.value }))}
                      placeholder="z.B. 900 (15 Minuten)"
                  />
                </div>
                <div className="space-y-2 flex items-end">
                  <div className="flex items-center space-x-2 pb-2">
                    <Switch
                        id="require-duration"
                        checked={topicForm.requireMinDuration}
                        onCheckedChange={(checked) => setTopicForm(prev => ({ ...prev, requireMinDuration: checked }))}
                    />
                    <Label htmlFor="require-duration">Weiter blockieren bis Zeit abgelaufen</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic-video" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Video URL (optional)
                </Label>
                <Input
                    id="topic-video"
                    value={topicForm.videoUrl}
                    onChange={(e) => setTopicForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="z.B. https://www.youtube.com/embed/xxxxx oder https://vimeo.com/xxxxx"
                />
                <p className="text-xs text-muted-foreground">
                  Unterstützt YouTube, Vimeo und direkte Video-URLs. Für YouTube verwenden Sie das Embed-Format.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic-content">Inhalt (Markdown)</Label>
                <Textarea
                    id="topic-content"
                    value={topicForm.content}
                    onChange={(e) => setTopicForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="# Überschrift&#10;&#10;Ihr Inhalt hier...&#10;&#10;## Unterüberschrift&#10;&#10;- Punkt 1&#10;- Punkt 2"
                    rows={10}
                    className="font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsTopicDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={saveTopic}>
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Location Dialog */}
        <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLocation ? "Standort bearbeiten" : "Neuen Standort erstellen"}</DialogTitle>
              <DialogDescription>Geben Sie die Details für den Standort ein.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="loc-city">Stadt</Label>
                <Input id="loc-city" value={locationForm.city} onChange={(e) => setLocationForm(prev => ({ ...prev, city: e.target.value }))} placeholder="z.B. Berlin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc-address">Adresse</Label>
                <Input id="loc-address" value={locationForm.address} onChange={(e) => setLocationForm(prev => ({ ...prev, address: e.target.value }))} placeholder="z.B. Industriestraße 42, 12345 Berlin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc-price">Preis (€)</Label>
                <Input id="loc-price" type="number" value={locationForm.price} onChange={(e) => setLocationForm(prev => ({ ...prev, price: e.target.value }))} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="loc-active" checked={locationForm.isActive} onCheckedChange={(checked) => setLocationForm(prev => ({ ...prev, isActive: checked }))} />
                <Label htmlFor="loc-active">Standort aktiv</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsLocationDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={() => {
                if (!locationForm.city.trim()) {
                  toast({ title: "Fehler", description: "Bitte geben Sie eine Stadt ein.", variant: "destructive" });
                  return;
                }
                if (editingLocation) {
                  setLocations(prev => prev.map(l => l.id === editingLocation.id ? { ...l, city: locationForm.city, address: locationForm.address, price: parseFloat(locationForm.price) || 299, isActive: locationForm.isActive } : l));
                  toast({ title: "Erfolg", description: "Standort wurde aktualisiert." });
                } else {
                  const newLocation: Location = { id: `loc${Date.now()}`, city: locationForm.city, address: locationForm.address, price: parseFloat(locationForm.price) || 299, isActive: locationForm.isActive, dates: [] };
                  setLocations(prev => [...prev, newLocation]);
                  toast({ title: "Erfolg", description: "Standort wurde erstellt." });
                }
                setIsLocationDialogOpen(false);
              }}><Save className="w-4 h-4 mr-2" />Speichern</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Date Dialog */}
        <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDate ? "Termin bearbeiten" : "Neuen Termin erstellen"}</DialogTitle>
              <DialogDescription>Geben Sie die Details für den Termin ein.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="date-date">Datum</Label>
                <Input id="date-date" type="date" value={dateForm.date} onChange={(e) => setDateForm(prev => ({ ...prev, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-time">Zeit</Label>
                <Input id="date-time" value={dateForm.time} onChange={(e) => setDateForm(prev => ({ ...prev, time: e.target.value }))} placeholder="z.B. 08:00 - 16:00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-spots">Verfügbare Plätze</Label>
                <Input id="date-spots" type="number" value={dateForm.availableSpots} onChange={(e) => setDateForm(prev => ({ ...prev, availableSpots: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDateDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={() => {
                if (!dateForm.date) {
                  toast({ title: "Fehler", description: "Bitte wählen Sie ein Datum.", variant: "destructive" });
                  return;
                }
                if (editingDate) {
                  setLocations(prev => prev.map(l => l.id === selectedLocationId ? { ...l, dates: l.dates.map(d => d.id === editingDate.id ? { ...d, date: dateForm.date, time: dateForm.time, availableSpots: parseInt(dateForm.availableSpots) || 10 } : d) } : l));
                  toast({ title: "Erfolg", description: "Termin wurde aktualisiert." });
                } else {
                  const newDate: CourseDate = { id: `d${Date.now()}`, date: dateForm.date, time: dateForm.time, availableSpots: parseInt(dateForm.availableSpots) || 10 };
                  setLocations(prev => prev.map(l => l.id === selectedLocationId ? { ...l, dates: [...l.dates, newDate] } : l));
                  toast({ title: "Erfolg", description: "Termin wurde hinzugefügt." });
                }
                setIsDateDialogOpen(false);
              }}><Save className="w-4 h-4 mr-2" />Speichern</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Order Detail Dialog */}
        <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bestellungsdetails #{selectedOrder?.id}</DialogTitle>
              <DialogDescription>Vollständige Informationen zur Bestellung</DialogDescription>
            </DialogHeader>
            {selectedOrder && (
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Kundendaten
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">{selectedOrder.customerInfo?.firstName} {selectedOrder.customerInfo?.lastName}</p>
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {selectedOrder.customerInfo?.email}
                        </p>
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {selectedOrder.customerInfo?.phone}
                        </p>
                        {selectedOrder.customerInfo?.address && (
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {selectedOrder.customerInfo.address}, {selectedOrder.customerInfo.postalCode} {selectedOrder.customerInfo.city}
                            </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Bestellinfo
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p>Erstellt: {new Date(selectedOrder.createdAt).toLocaleDateString('de-DE')}</p>
                        {selectedOrder.paidAt && <p>Bezahlt: {new Date(selectedOrder.paidAt).toLocaleDateString('de-DE')}</p>}
                        <p className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(selectedOrder.status)}`}>
                          {getOrderStatusLabel(selectedOrder.status)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" />
                      Artikel
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {item.type === 'online_course' && <BookOpen className="w-4 h-4 text-primary" />}
                              {item.type === 'practical_course' && <MapPin className="w-4 h-4 text-accent" />}
                              {item.type === 'plastic_card' && <Award className="w-4 h-4 text-warning" />}
                              <span>{item.name}</span>
                            </div>
                            <span className="font-semibold">{item.price.toFixed(2)} €</span>
                          </div>
                      ))}
                    </div>
                    <div className="flex justify-end mt-4 pt-4 border-t border-border">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Gesamtbetrag</p>
                        <p className="text-2xl font-bold text-primary">{selectedOrder.total.toFixed(2)} €</p>
                      </div>
                    </div>
                  </div>
                </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default Admin;