import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import {
    BookOpen,
    Clock,
    CheckCircle,
    Lock,
    ChevronRight,
    Play,
    Award,
    ClipboardCheck,
    User,
    ShoppingBag,
    Library,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Trophy
} from "lucide-react";
import { DashboardCourse, DashboardChapter } from "@/types/dashboard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface DashboardAPIResponse {
    user: { name: string; email: string; isAdmin: boolean };
    courses: DashboardCourse[];
    progress: {
        topics: Record<string, boolean>;
        quizzes: Record<string, { passed: boolean; score: number }>;
        finalQuizzes: Record<string, { passed: boolean; score: number }>;
    };
    expiresAt?: Date;
    purchaseDate?: Date;
    daysRemaining?: number;
    orders: any[];
}

const Dashboard = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");

    const [userCourses, setUserCourses] = useState<DashboardCourse[]>([]);
    const [userOrders, setUserOrders] = useState<any[]>([]);
    const [progress, setProgress] = useState<Record<string, boolean>>({});
    const [quizResults, setQuizResults] = useState<Record<string, { passed: boolean; score: number }>>({});
    const [finalQuizResults, setFinalQuizResults] = useState<Record<string, { passed: boolean; score: number }>>({});

    // Stan dla rozwijanych kursów (courseId -> expanded)
    const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

    const [profileForm, setProfileForm] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        postalCode: ""
    });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchDashboard = async () => {
            try {
                const res = await fetch(`${API_URL}/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: "include"
                });
                if (!res.ok) throw new Error("Fehler beim Laden der Dashboard-Daten");

                const data: DashboardAPIResponse = await res.json();

                setIsLoggedIn(true);
                setIsAdmin(data.user.isAdmin);
                setUserName(data.user.name);
                setUserEmail(data.user.email);

                setProfileForm(prev => ({
                    ...prev,
                    name: data.user.name,
                    email: data.user.email
                }));

                setUserCourses(data.courses || []);
                setUserOrders(data.orders || []);
                setProgress(data.progress.topics || {});
                setQuizResults(data.progress.quizzes || {});
                setFinalQuizResults(data.progress.finalQuizzes || {});

            } catch (err: any) {
                console.error(err);
                toast({ title: "Fehler", description: err.message || "Dashboard konnte nicht geladen werden." });
            }
        };

        fetchDashboard();
    }, [navigate, toast]);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const handleProfileSave = () => {
        localStorage.setItem("userName", profileForm.name);
        localStorage.setItem("userEmail", profileForm.email);
        setUserName(profileForm.name);
        setUserEmail(profileForm.email);
        toast({ title: "Erfolg", description: "Profil wurde gespeichert." });
    };

    const toggleCourseExpanded = (courseId: string) => {
        setExpandedCourses(prev => ({
            ...prev,
            [courseId]: !prev[courseId]
        }));
    };

    // Helpers
    const getChapterProgress = (chapter: DashboardChapter) => {
        const completed = chapter.topics.filter(t => progress[t.id]).length;
        return Math.round((completed / chapter.topics.length) * 100);
    };

    const isChapterComplete = (chapter: DashboardChapter) =>
        chapter.topics.every(t => progress[t.id]);

    const isQuizPassed = (chapter: DashboardChapter) =>
        quizResults[chapter.id]?.passed === true;

    const needsQuiz = (chapter: DashboardChapter) =>
        isChapterComplete(chapter) && chapter.quiz && !isQuizPassed(chapter);

    const getFirstAccessibleTopic = (chapter: DashboardChapter) => {
        if (chapter.status === "blocked") return null;
        for (const topic of chapter.topics) {
            if (!progress[topic.id]) return topic.id;
        }
        return chapter.topics[0]?.id || null;
    };

    const isFinalQuizAvailable = (course: DashboardCourse) => {
        // Test końcowy dostępny tylko gdy wszystkie rozdziały ukończone (wszystkie quizy zdane)
        return course.chapters.every(ch => {
            const allTopicsDone = ch.topics.every(t => progress[t.id]);
            const quizPassed = ch.quiz ? quizResults[ch.id]?.passed : true;
            return allTopicsDone && quizPassed;
        });
    };

    const isFinalQuizPassed = (courseId: string) =>
        finalQuizResults[courseId]?.passed === true;

    // Global stats
    const courseProgress = userCourses.length
        ? Math.round(userCourses.reduce((acc, c) =>
                acc + c.chapters.reduce((a, ch) => a + getChapterProgress(ch), 0), 0)
            / userCourses.reduce((acc, c) => acc + c.chapters.length, 0))
        : 0;

    const completedTopics = Object.values(progress).filter(Boolean).length;
    const totalTopics = userCourses.reduce((acc, c) =>
        acc + c.chapters.reduce((a, ch) => a + ch.topics.length, 0), 0);
    const totalChapters = userCourses.reduce((acc, c) => acc + c.chapters.length, 0);

    if (!isLoggedIn) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar isLoggedIn={isLoggedIn} isAdmin={isAdmin} onLogout={handleLogout} />

            <main className="flex-1 pt-24 pb-12">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                            Willkommen zurück, {userName}!
                        </h1>
                        <p className="text-muted-foreground">Verwalten Sie Ihre Kurse, Daten und Bestellungen.</p>
                    </div>

                    <Tabs defaultValue="courses" className="space-y-6">
                        <TabsList className="grid w-full max-w-md grid-cols-3">
                            <TabsTrigger value="courses" className="flex items-center gap-2">
                                <Library className="w-4 h-4" />
                                <span className="hidden sm:inline">Meine Kurse</span>
                            </TabsTrigger>
                            <TabsTrigger value="profile" className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span className="hidden sm:inline">Meine Daten</span>
                            </TabsTrigger>
                            <TabsTrigger value="orders" className="flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" />
                                <span className="hidden sm:inline">Bestellungen</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="courses" className="space-y-6">
                            {/* Progress Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                            <span className="text-4xl font-bold text-foreground">{completedTopics}/{totalTopics}</span>
                                        </div>
                                        <p className="text-muted-foreground font-medium">Abgeschlossene Themen</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <Clock className="w-10 h-10 text-primary" />
                                            <span className="text-4xl font-bold text-foreground">{totalChapters}</span>
                                        </div>
                                        <p className="text-muted-foreground font-medium">Kapitel insgesamt</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Course List */}
                            {userCourses.map(course => {
                                const isExpanded = expandedCourses[course.id] || false;
                                const chaptersToShow = isExpanded ? course.chapters : course.chapters.slice(0, 3);
                                const hasMoreChapters = course.chapters.length > 3;
                                const finalQuizAvailable = isFinalQuizAvailable(course);
                                const finalQuizPassed = isFinalQuizPassed(course._id);

                                return (
                                    <Card key={course.id} className="mb-6">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <BookOpen className="w-5 h-5 text-primary" />
                                                {course.title}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-4">
                                                {course.description}
                                                {course.expiresAt && (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                        course.daysRemaining && course.daysRemaining <= 7
                                                            ? 'bg-warning/20 text-warning'
                                                            : 'bg-primary/10 text-primary'
                                                    }`}>
      <Clock className="w-3 h-3" />
                                                        {course.daysRemaining} Tage
    </span>
                                                )}
                                            </CardDescription>
                                            <CardDescription>{course.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {chaptersToShow.map(chapter => {
                                                    const chapProg = getChapterProgress(chapter);
                                                    const complete = isChapterComplete(chapter);
                                                    const quizPassed = isQuizPassed(chapter);
                                                    const showQuizBtn = needsQuiz(chapter);
                                                    const firstTopic = getFirstAccessibleTopic(chapter);

                                                    return (
                                                        <div key={chapter.id} className="p-4 rounded-lg border bg-card">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                                    complete && quizPassed ? "bg-success text-success-foreground" :
                                                                        chapter.status === "blocked" ? "bg-muted text-muted-foreground" :
                                                                            "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                                                                }`}>
                                                                    {complete && quizPassed ? <CheckCircle className="w-6 h-6"/> :
                                                                        chapter.status === "blocked" ? <Lock className="w-6 h-6"/> :
                                                                            <span className="text-xl font-bold">{chapter.order}</span>}
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h3 className="font-semibold text-foreground truncate">{chapter.title}</h3>
                                                                        {complete && quizPassed &&
                                                                            <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">Abgeschlossen</span>
                                                                        }
                                                                        {chapter.status === "blocked" &&
                                                                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Gesperrt</span>
                                                                        }
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground mb-2">{chapter.description}</p>

                                                                    {chapter.quiz && !quizPassed && (
                                                                        <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 px-3 py-1.5 rounded-lg w-fit mb-2">
                                                                            <AlertTriangle className="w-4 h-4"/>
                                                                            <span>Test muss bestanden werden, um fortzufahren</span>
                                                                        </div>
                                                                    )}

                                                                    <div className="flex items-center gap-4 mt-2">
                                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                            <BookOpen className="w-4 h-4"/>
                                                                            <span>{chapter.topics.length} Themen</span>
                                                                        </div>
                                                                        {chapter.quiz && (
                                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                                <ClipboardCheck className="w-4 h-4"/>
                                                                                <span className={quizPassed ? "text-success" : ""}>{quizPassed ? "Test bestanden" : "Test vorhanden"}</span>
                                                                            </div>
                                                                        )}
                                                                        <Progress value={chapProg} className="flex-1 max-w-[150px]" />
                                                                        <span className="text-sm font-medium text-foreground">{chapProg}%</span>
                                                                    </div>
                                                                </div>

                                                                <div className="shrink-0">
                                                                    {chapter.status === "blocked" ? (
                                                                        <Button size="sm" disabled className="opacity-50 cursor-not-allowed">
                                                                            Blockiert <Lock className="w-4 h-4 ml-1"/>
                                                                        </Button>
                                                                    ) : showQuizBtn ? (
                                                                        <Link to={`/course/${course._id}/chapter/${chapter.id}/quiz`}>
                                                                            <Button variant="hero" size="sm">
                                                                                <ClipboardCheck className="w-4 h-4 mr-2" /> Test starten
                                                                            </Button>
                                                                        </Link>
                                                                    ) : firstTopic ? (
                                                                        <Link to={`/course/${course._id}/chapter/${chapter.id}/topic/${firstTopic}`}>
                                                                            <Button size="sm">
                                                                                {complete && quizPassed ? (
                                                                                    <>Wiederholen <ChevronRight className="w-4 h-4 ml-1"/></>
                                                                                ) : chapProg > 0 ? (
                                                                                    <>Fortsetzen <Play className="w-4 h-4 ml-1"/></>
                                                                                ) : (
                                                                                    <>Starten <Play className="w-4 h-4 ml-1"/></>
                                                                                )}
                                                                            </Button>
                                                                        </Link>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Show More/Less Button */}
                                                {hasMoreChapters && (
                                                    <Button
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={() => toggleCourseExpanded(course.id)}
                                                    >
                                                        {isExpanded ? (
                                                            <>Weniger anzeigen <ChevronUp className="w-4 h-4 ml-2"/></>
                                                        ) : (
                                                            <>Mehr anzeigen ({course.chapters.length - 3} weitere) <ChevronDown className="w-4 h-4 ml-2"/></>
                                                        )}
                                                    </Button>
                                                )}

                                                {/* Final Quiz Section */}
                                                {course.finalQuiz && (
                                                    <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5 mt-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                                finalQuizPassed ? "bg-success text-success-foreground" :
                                                                    !finalQuizAvailable ? "bg-muted text-muted-foreground" :
                                                                        "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                                                            }`}>
                                                                {finalQuizPassed ? <CheckCircle className="w-6 h-6"/> :
                                                                    !finalQuizAvailable ? <Lock className="w-6 h-6"/> :
                                                                        <Trophy className="w-6 h-6"/>}
                                                            </div>

                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h3 className="font-semibold text-foreground">Abschlusstest</h3>
                                                                    {finalQuizPassed &&
                                                                        <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">Bestanden</span>
                                                                    }
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {finalQuizPassed
                                                                        ? "Sie haben den Kurs erfolgreich abgeschlossen!"
                                                                        : finalQuizAvailable
                                                                            ? "Schließen Sie alle Kapitel ab, um den Abschlusstest zu absolvieren"
                                                                            : "Verfügbar nach Abschluss aller Kapitel"
                                                                    }
                                                                </p>
                                                            </div>

                                                            <div className="shrink-0">
                                                                {finalQuizPassed ? (
                                                                    <Link to={`/course/${course._id}/final-quiz`}>
                                                                        <Button size="sm" variant="outline">
                                                                            Ergebnisse ansehen
                                                                        </Button>
                                                                    </Link>
                                                                ) : finalQuizAvailable ? (
                                                                    <Link to={`/course/${course._id}/final-quiz`}>
                                                                        <Button size="sm" variant="hero">
                                                                            <Trophy className="w-4 h-4 mr-2" />
                                                                            Test starten
                                                                        </Button>
                                                                    </Link>
                                                                ) : (
                                                                    <Button size="sm" disabled className="opacity-50">
                                                                        <Lock className="w-4 h-4 mr-2" />
                                                                        Gesperrt
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </TabsContent>

                        {/* Profile Tab */}
                        <TabsContent value="profile" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5 text-primary"/> Persönliche Daten
                                    </CardTitle>
                                    <CardDescription>Verwalten Sie Ihre Kontodaten</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.keys(profileForm).map(key => (
                                            <div key={key} className="space-y-1">
                                                <Label htmlFor={key}>{key}</Label>
                                                <Input
                                                    id={key}
                                                    value={(profileForm as any)[key]}
                                                    onChange={e => setProfileForm(prev => ({...prev, [key]: e.target.value}))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <Button className="mt-4" onClick={handleProfileSave}>Speichern</Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Orders Tab */}
                        <TabsContent value="orders" className="space-y-4">
                            {userOrders.length === 0 ? (
                                <div className="text-center py-12">
                                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50"/>
                                    <p className="text-muted-foreground">Keine Bestellungen vorhanden</p>
                                </div>
                            ) : (
                                userOrders.map(order => (
                                    <Card key={order.id} className="mb-4">
                                        <CardContent className="flex justify-between items-center pt-6">
                                            <div>
                                                <p className="text-sm font-medium">Bestellung #{order.id}</p>
                                                <p className="text-xs text-muted-foreground">{order.date}</p>
                                                <p className="text-xs text-muted-foreground">Gesamt: {order.total} €</p>
                                                <p className="text-xs text-muted-foreground">Status: {order.status}</p>
                                            </div>
                                            <Button size="sm" asChild>
                                                <Link to={`/orders/${order.id}`}>Details</Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Dashboard;