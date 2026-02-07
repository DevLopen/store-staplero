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
import EnhancedTopicDialog from "@/components/EnhancedTopicDialog";
import ParticipantsListDialog from "@/components/ParticipantsListDialog";
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
  Mail,
  List
} from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Locations state
  const [locations, setLocations] = useState<Location[]>([]);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingDate, setEditingDate] = useState<CourseDate | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [locationForm, setLocationForm] = useState({ city: "", address: "", price: "299", isActive: true });
  const [dateForm, setDateForm] = useState({
    startDate: "",
    endDate: "",
    time: "08:00 - 16:00",
    availableSpots: "10"
  });

  const [participantsDialog, setParticipantsDialog] = useState({
    open: false,
    locationId: "",
    dateId: "",
    locationName: "",
    dateInfo: ""
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
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
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/locations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(data => {
          const mappedLocations = data.map(loc => ({ ...loc, id: loc._id }));
          setLocations(mappedLocations);
        })
        .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log(token);
    console.log(token);
    console.log(token);
    console.log(token);
    console.log(token);
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
        .then(res => res.json())
        .then(data => {
          if (!data.user || !data.user.isAdmin) {
            navigate("/dashboard");
          } else {
            setIsAdmin(true);
            setIsLoggedIn(true);
          }
        })
        .catch(err => {
          console.error(err);
          navigate("/login");
        });
  }, [navigate]);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/courses/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    })
        .then(res => res.json())
        .then(data => {
          const fetchedCourses = data?.courses || [];
          setCourses(fetchedCourses);
          if (fetchedCourses.length > 0 && !selectedCourse) {
            setSelectedCourse(fetchedCourses[0]);
          }
        })
        .catch(err => console.error(err));
  }, [isLoggedIn, isAdmin]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${API_URL}/courses/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    })
        .then(res => res.json())
        .then(data => setCourses(data?.courses || []))
        .catch(err => console.error(err));
  }, [navigate]);


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
        .then(res => res.json())
        .then(data => setOrders(data.orders || []))
        .catch(err => console.error(err));
  }, []);

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

  const saveCourse = async () => {
    if (!courseForm.title.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie einen Titel ein.", variant: "destructive" });
      return;
    }

    const token = localStorage.getItem("token");
    const method = editingCourse ? "PUT" : "POST";
    const url = editingCourse
        ? `${API_URL}/${editingCourse._id}` // ✅ _id
        : `${API_URL}/courses/admin`;

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(courseForm),
    });

    if (res.ok) {
      const updatedCourse = await res.json();
      setCourses(prev => editingCourse
          ? prev.map(c => c._id === updatedCourse._id ? updatedCourse : c) // ✅ _id
          : [...prev, updatedCourse]);
      setSelectedCourse(updatedCourse);
      toast({ title: "Erfolg", description: editingCourse ? "Kurs aktualisiert." : "Neuer Kurs erstellt." });
    } else {
      const error = await res.json();
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }

    setIsCourseDialogOpen(false);
  };

  const deleteCourse = async (courseId: string) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/courses/admin/${courseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        toast({ title: "Fehler", description: error.message, variant: "destructive" });
        return;
      }

      setCourses(prev => prev.filter(c => c._id !== courseId)); // ✅ _id

      // ✅ Jeśli usunięty kurs był wybrany, wybierz inny
      if (selectedCourse?._id === courseId) {
        const remainingCourses = courses.filter(c => c._id !== courseId);
        setSelectedCourse(remainingCourses.length > 0 ? remainingCourses[0] : null);
      }

      toast({ title: "Erfolg", description: "Kurs wurde gelöscht." });
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    }
  };

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

  const saveChapter = async () => {
    if (!chapterForm.title.trim()) return;
    if (!selectedCourse) return;

    try {
      const token = localStorage.getItem("token");

      const payload = {
        title: chapterForm.title,
        description: chapterForm.description,
      };

      const url = editingChapter
          ? `${API_URL}/courses/admin/${selectedCourse._id}/chapters/${editingChapter.id}`
          : `${API_URL}/courses/admin/${selectedCourse._id}/chapters`;

      const method = editingChapter ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      const updatedCourse = await res.json();

      setSelectedCourse(updatedCourse);
      setCourses(prev =>
          prev.map(c => c._id === updatedCourse._id ? updatedCourse : c)
      );

      toast({
        title: "Erfolg",
        description: editingChapter
            ? "Kapitel wurde aktualisiert."
            : "Neues Kapitel wurde hinzugefügt.",
      });

      setIsChapterDialogOpen(false);
      setEditingChapter(null);

    } catch (err: any) {
      toast({
        title: "Fehler",
        description: err.message || "Serverfehler",
        variant: "destructive",
      });
    }
  };


  const deleteChapter = async (chapterId: string) => {
    try {
      const token = localStorage.getItem("token");

      // ✅ POPRAWKA: Dodaj /admin do URL
      const url = `${API_URL}/courses/admin/${selectedCourse._id}/chapters/${chapterId}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      const updatedCourse = await res.json();
      setSelectedCourse(updatedCourse);
      setCourses(prev => prev.map(c => c._id === updatedCourse._id ? updatedCourse : c));

      toast({ title: "Erfolg", description: "Kapitel wurde gelöscht." });
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    }
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

  const saveTopic = async () => {
    if (!topicForm.title.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Titel ein.",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const payload = {
        title: topicForm.title,
        content: topicForm.content,
        duration: topicForm.duration,
        videoUrl: topicForm.videoUrl || null,
        minDurationSeconds: topicForm.minDurationSeconds
            ? parseInt(topicForm.minDurationSeconds)
            : null,
        requireMinDuration: topicForm.requireMinDuration,
      };

      const url = editingTopic
          ? `${API_URL}/courses/admin/${selectedCourse._id}/chapters/${selectedChapterId}/topics/${editingTopic._id}`
          : `${API_URL}/courses/admin/${selectedCourse._id}/chapters/${selectedChapterId}/topics`;

      const method = editingTopic ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      const updatedCourse = await res.json();

      // 🔥 BACKEND JEST JEDYNYM ŹRÓDŁEM PRAWDY
      setSelectedCourse(updatedCourse);
      setCourses(prev =>
          prev.map(c => c._id === updatedCourse._id ? updatedCourse : c)
      );

      toast({
        title: "Erfolg",
        description: editingTopic
            ? "Thema wurde aktualisiert."
            : "Neues Thema wurde hinzugefügt.",
      });

      setIsTopicDialogOpen(false);
      setEditingTopic(null);

    } catch (err: any) {
      toast({
        title: "Fehler",
        description: err.message || "Serverfehler",
        variant: "destructive",
      });
    }
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

  const deleteTopic = async (chapterId: string, topicId: string) => {
    if (!selectedCourse) return;
    try {
      const token = localStorage.getItem("token");

      // ✅ POPRAWKA: Dodaj /admin do URL
      const url = `${API_URL}/courses/admin/${selectedCourse._id}/chapters/${chapterId}/topics/${topicId}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      const updatedCourse = await res.json();
      setSelectedCourse(updatedCourse);
      setCourses(prev => prev.map(c => c._id === updatedCourse._id ? updatedCourse : c));

      toast({ title: "Erfolg", description: "Thema wurde gelöscht." });
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    }
  };

  // --- Quiz handlers ---
  const openQuizDialog = (chapterId: string, quiz?: Quiz) => {
    setSelectedQuizChapterId(chapterId);

    if (quiz) {
      setEditingQuiz(quiz);
      setQuizForm({
        title: quiz.title,
        description: quiz.description || "",
        passingScore: quiz.passingScore.toString(),
        chapterId: quiz.chapterId,
      });
    } else {
      setEditingQuiz(null);
      setQuizForm({
        title: "",
        description: "",
        passingScore: "70",
        chapterId,
      });
    }

    setIsQuizDialogOpen(true);
  };

  const refreshSelectedCourse = async (): Promise<Course> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/courses/${selectedCourse._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Kurs konnte nicht geladen werden");
    const data = await res.json();
    setSelectedCourse(data);
    return data;
  };

  const saveQuiz = async () => {
    if (!quizForm.title.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Titel ein.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCourse?._id || !selectedCourse.chapters) {
      toast({ title: "Fehler", description: "Kapitelstruktur des Kurses ist nicht geladen.", variant: "destructive" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const quizPayload: Quiz = {
        id: editingQuiz?.id ?? `quiz-${Date.now()}`,
        chapterId: selectedQuizChapterId !== "final" ? selectedQuizChapterId : undefined,
        title: quizForm.title,
        description: quizForm.description,
        passingScore: Number(quizForm.passingScore),
        isFinalQuiz: selectedQuizChapterId === "final",
        questions: editingQuiz?.questions ?? [],
      };

      const res = await fetch(
          `${API_URL}/courses/admin/${selectedCourse._id}/quizzes/${selectedQuizChapterId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(quizPayload),
          }
      );

      if (!res.ok) throw new Error("Quiz konnte nicht gespeichert werden.");

      const updatedCourse: Course = await res.json();
      setSelectedCourse(updatedCourse);

      if (selectedQuizChapterId === "final") {
        setEditingQuiz(updatedCourse.finalQuiz ?? null);
      } else {
        const chapterQuiz = updatedCourse.chapters.find(ch => ch.id === selectedQuizChapterId)?.quiz ?? null;
        setEditingQuiz(chapterQuiz);
      }

      toast({
        title: "Erfolg",
        description: editingQuiz ? "Test wurde aktualisiert." : "Test wurde erstellt.",
      });

      setEditingQuiz(null);
      setIsQuizDialogOpen(false);

    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Quiz konnte nicht gespeichert werden.", variant: "destructive" });
    }
  };

  const deleteQuiz = async (chapterId: string) => {
    if (!selectedCourse?._id) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
          `${API_URL}/courses/admin${selectedCourse._id}/quizzes/${chapterId}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Quiz konnte nicht gelöscht werden.");

      const updatedCourse = await res.json();
      setSelectedCourse(updatedCourse);

      toast({ title: "Erfolg", description: "Test wurde gelöscht." });
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Quiz konnte nicht gelöscht werden.", variant: "destructive" });
    }
  };

// --- Question handlers ---
  const openQuestionDialog = (chapterId: string, question?: QuizQuestion) => {
    setSelectedQuizChapterId(chapterId);

    // Tworzymy lokalny quiz jeśli jeszcze nie istnieje
    if (!editingQuiz) {
      setEditingQuiz({
        id: `quiz-${Date.now()}`,
        chapterId: chapterId !== "final" ? chapterId : undefined,
        title: quizForm.title || "",
        description: quizForm.description || "",
        passingScore: Number(quizForm.passingScore) || 70,
        questions: [],
        isFinalQuiz: chapterId === "final",
      });
    }

    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        question: question.question,
        option1: question.options[0] || "",
        option2: question.options[1] || "",
        option3: question.options[2] || "",
        option4: question.options[3] || "",
        correctAnswer: question.correctAnswer.toString(),
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({ question: "", option1: "", option2: "", option3: "", option4: "", correctAnswer: "0" });
    }

    setIsQuestionDialogOpen(true);
  };

  const saveQuestion = async () => {
    if (!editingQuiz) return;

    const options = [questionForm.option1, questionForm.option2, questionForm.option3, questionForm.option4].filter(Boolean);

    const newQuestion: QuizQuestion = editingQuestion
        ? { ...editingQuestion, question: questionForm.question, options, correctAnswer: Number(questionForm.correctAnswer) }
        : { id: `q-${Date.now()}`, question: questionForm.question, options, correctAnswer: Number(questionForm.correctAnswer) };

    const updatedQuestions = editingQuestion
        ? editingQuiz.questions.map(q => (q.id === editingQuestion.id ? newQuestion : q))
        : [...editingQuiz.questions, newQuestion];

    const quizPayload: Quiz = { ...editingQuiz, questions: updatedQuestions };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
          `${API_URL}/courses/admin/${selectedCourse._id}/quizzes/${selectedQuizChapterId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(quizPayload),
          }
      );

      if (!res.ok) throw new Error("Frage konnte nicht gespeichert werden.");

      const updatedCourse = await res.json();
      setSelectedCourse(updatedCourse);

      if (selectedQuizChapterId === "final") {
        setEditingQuiz(updatedCourse.finalQuiz ?? null);
      } else {
        const chapterQuiz = updatedCourse.chapters.find(ch => ch.id === selectedQuizChapterId)?.quiz ?? null;
        setEditingQuiz(chapterQuiz);
      }

      toast({ title: "Erfolg", description: editingQuestion ? "Frage aktualisiert" : "Frage hinzugefügt" });
      setEditingQuestion(null);
      setQuestionForm({ question: "", option1: "", option2: "", option3: "", option4: "", correctAnswer: "0" });
      setIsQuestionDialogOpen(false);

    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Frage konnte nicht gespeichert werden.", variant: "destructive" });
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!editingQuiz) return;

    const updatedQuestions = editingQuiz.questions.filter(q => q.id !== questionId);
    setEditingQuiz(prev => prev ? { ...prev, questions: updatedQuestions } : null);

    try {
      const token = localStorage.getItem("token");
      const quizPayload = { ...editingQuiz, questions: updatedQuestions };

      const res = await fetch(
          `${API_URL}/courses/admin/${selectedCourse._id}/quizzes/${selectedQuizChapterId}`,
          { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(quizPayload) }
      );

      if (!res.ok) throw new Error("Frage konnte nicht gelöscht werden.");

      const updatedCourse = await res.json();
      setSelectedCourse(updatedCourse);
      toast({ title: "Erfolg", description: "Frage wurde gelöscht." });

    } catch (err: any) {
      toast({ title: "Fehler", description: err.message || "Frage konnte nicht gelöscht werden.", variant: "destructive" });
    }
  };

  const openParticipantsList = (
      locationId: string,
      locationName: string,
      date: CourseDate
  ) => {
    const dateInfo = date.startDate === date.endDate
        ? new Date(date.startDate).toLocaleDateString('de-DE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        : `${new Date(date.startDate).toLocaleDateString('de-DE', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric'
        })} - ${new Date(date.endDate).toLocaleDateString('de-DE', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric'
        })}`;

    setParticipantsDialog({
      open: true,
      locationId,
      dateId: date.id,
      locationName,
      dateInfo: `${dateInfo} • ${date.time}`
    });
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

                {courses.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground">Keine Kurse vorhanden.</p>
                        <Button className="mt-4" onClick={() => openCourseDialog()}>
                          <Plus className="w-4 h-4 mr-2" />
                          Erstellen
                        </Button>
                      </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {courses.map((course) => (
                          <Card
                              key={course._id} // ✅ _id
                              className={`cursor-pointer transition-all ${
                                  selectedCourse?._id === course._id ? 'ring-2 ring-primary' : '' // ✅ _id
                              }`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div
                                    onClick={() => setSelectedCourse(course)}
                                    className="flex-1 cursor-pointer"
                                >
                                  <CardTitle className="text-lg">{course.title}</CardTitle>
                                  <CardDescription className="mt-1">{course.description}</CardDescription>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation(); // ✅ Zapobiega aktywacji karty
                                        openCourseDialog(course);
                                      }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation(); // ✅ Zapobiega aktywacji karty
                                        deleteCourse(course._id); // ✅ _id
                                      }}
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
                )}
              </TabsContent>


              {/* Course Content Tab */}
              <TabsContent value="content" className="space-y-6">
                {selectedCourse ? (
                        <>
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
                        </>
                        ) : (
                        <Card>
                          <CardContent className="py-12 text-center">
                            <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p className="text-muted-foreground">Bitte wählen Sie zuerst einen Kurs aus.</p>
                          </CardContent>
                        </Card>
                        )}
              </TabsContent>

              {/* Tests Tab */}
              <TabsContent value="tests" className="space-y-6">
                {selectedCourse ? (
                        <>
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
                        </>
                ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-muted-foreground">Bitte wählen Sie zuerst einen Kurs aus.</p>
                      </CardContent>
                    </Card>
                )}
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
                                  onClick={async () => {
                                    try {
                                      const token = localStorage.getItem("token");
                                      await fetch(`${API_URL}/locations/${location.id}`, {
                                        method: 'DELETE',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                      });

                                      setLocations(prev => prev.filter(l => l.id !== location.id));
                                      toast({ title: "Erfolg", description: "Standort wurde gelöscht." });
                                    } catch (err) {
                                      toast({ title: "Fehler", description: "Löschen fehlgeschlagen.", variant: "destructive" });
                                    }
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
                                        {date.startDate === date.endDate
                                            ? new Date(date.startDate).toLocaleDateString('de-DE', {
                                              weekday: 'long',
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric'
                                            })
                                            : `${new Date(date.startDate).toLocaleDateString('de-DE', {
                                              day: 'numeric',
                                              month: 'numeric',
                                              year: 'numeric'
                                            })} - ${new Date(date.endDate).toLocaleDateString('de-DE', {
                                              day: 'numeric',
                                              month: 'numeric',
                                              year: 'numeric'
                                            })}`
                                        }
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {date.time} • {date.availableSpots} Plätze verfügbar
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {/* ✅ NOWY PRZYCISK DO WYŚWIETLANIA LISTY */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openParticipantsList(location.id, location.city, date)}
                                        title="Teilnehmerliste anzeigen"
                                    >
                                      <List className="w-4 h-4" />
                                    </Button>

                                    <Button variant="ghost" size="icon" onClick={() => {
                                      setSelectedLocationId(location.id);
                                      setEditingDate(date);
                                      setDateForm({
                                        startDate: date.startDate,
                                        endDate: date.endDate,
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
                                        onClick={async () => {
                                          try {
                                            const token = localStorage.getItem("token");
                                            const updatedDates = location.dates.filter(d => d.id !== date.id);

                                            await fetch(`${API_URL}/locations/${location.id}`, {
                                              method: 'PUT',
                                              headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                              },
                                              body: JSON.stringify({ ...location, dates: updatedDates })
                                            });

                                            setLocations(prev => prev.map(l =>
                                                l.id === location.id
                                                    ? { ...l, dates: updatedDates }
                                                    : l
                                            ));
                                            toast({ title: "Erfolg", description: "Termin wurde gelöscht." });
                                          } catch (err) {
                                            toast({ title: "Fehler", description: "Löschen fehlgeschlagen.", variant: "destructive" });
                                          }
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
                                  setDateForm({
                                    startDate: "",
                                    endDate: "",
                                    time: "08:00 - 16:00",
                                    availableSpots: "10"
                                  });
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

        <EnhancedTopicDialog
            open={isTopicDialogOpen}
            onOpenChange={setIsTopicDialogOpen}
            topicForm={topicForm}
            setTopicForm={setTopicForm}
            onSave={saveTopic}
            editingTopic={editingTopic}
        />

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
              <Button onClick={async () => {
                if (!locationForm.city.trim()) {
                  toast({ title: "Fehler", description: "Bitte geben Sie eine Stadt ein.", variant: "destructive" });
                  return;
                }

                try {
                  const token = localStorage.getItem("token");
                  const method = editingLocation ? 'PUT' : 'POST';
                  const url = editingLocation
                      ? `${API_URL}/locations/${editingLocation.id}`
                      : `${API_URL}/locations`;

                  const res = await fetch(url, {
                    method,
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      city: locationForm.city,
                      address: locationForm.address,
                      price: parseFloat(locationForm.price) || 299,
                      isActive: locationForm.isActive,
                      dates: editingLocation?.dates || []
                    })
                  });

                  const data = await res.json();

                  if (editingLocation) {
                    setLocations(prev => prev.map(l => l.id === editingLocation.id ? { ...data, id: data._id } : l));
                    toast({ title: "Erfolg", description: "Standort wurde aktualisiert." });
                  } else {
                    setLocations(prev => [...prev, { ...data, id: data._id }]);
                    toast({ title: "Erfolg", description: "Standort wurde erstellt." });
                  }

                  setIsLocationDialogOpen(false);
                } catch (err) {
                  toast({ title: "Fehler", description: "Speichern fehlgeschlagen.", variant: "destructive" });
                }
              }}>
                <Save className="w-4 h-4 mr-2" />Speichern
              </Button>
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
                <Label htmlFor="date-start">Startdatum</Label>
                <Input id="date-start" type="date" value={dateForm.startDate} onChange={(e) => setDateForm(prev => ({ ...prev, startDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-end">Enddatum</Label>
                <Input id="date-end" type="date" value={dateForm.endDate} onChange={(e) => setDateForm(prev => ({ ...prev, endDate: e.target.value }))} />
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
              <Button onClick={async () => {
                if (!dateForm.startDate || !dateForm.endDate) {
                  toast({ title: "Fehler", description: "Bitte wählen Sie Start- und Enddatum.", variant: "destructive" });
                  return;
                }
                if (new Date(dateForm.endDate) < new Date(dateForm.startDate)) {
                  toast({ title: "Fehler", description: "Enddatum muss nach Startdatum liegen.", variant: "destructive" });
                  return;
                }

                try {
                  const token = localStorage.getItem("token");
                  const location = locations.find(l => l.id === selectedLocationId);

                  let updatedDates;
                  if (editingDate) {
                    updatedDates = location.dates.map(d =>
                        d.id === editingDate.id
                            ? { ...d, startDate: dateForm.startDate, endDate: dateForm.endDate, time: dateForm.time, availableSpots: parseInt(dateForm.availableSpots) || 10 }
                            : d
                    );
                  } else {
                    const newDate = { id: `d${Date.now()}`, startDate: dateForm.startDate, endDate: dateForm.endDate, time: dateForm.time, availableSpots: parseInt(dateForm.availableSpots) || 10 };
                    updatedDates = [...location.dates, newDate];
                  }

                  const res = await fetch(`${API_URL}/locations/${selectedLocationId}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ ...location, dates: updatedDates })
                  });

                  const data = await res.json();
                  setLocations(prev => prev.map(l => l.id === selectedLocationId ? { ...data, id: data._id } : l));
                  toast({ title: "Erfolg", description: editingDate ? "Termin wurde aktualisiert." : "Termin wurde hinzugefügt." });
                  setIsDateDialogOpen(false);
                } catch (err) {
                  toast({ title: "Fehler", description: "Speichern fehlgeschlagen.", variant: "destructive" });
                }
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

          <ParticipantsListDialog
              open={participantsDialog.open}
              onClose={() => setParticipantsDialog({ ...participantsDialog, open: false })}
              locationId={participantsDialog.locationId}
              dateId={participantsDialog.dateId}
              locationName={participantsDialog.locationName}
              dateInfo={participantsDialog.dateInfo}
          />
        </Dialog>
      </div>
  );
};

export default Admin;
