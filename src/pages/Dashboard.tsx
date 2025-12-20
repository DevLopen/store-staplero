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
import { mockCourse, getInitialProgress, getCourseProgress, isTopicAccessible, isChapterAccessible, QuizResult, Course } from "@/data/courseData";
import { mockOrders, Order, getOrderStatusLabel, getOrderStatusColor } from "@/data/orderData";
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
  Mail,
  Phone,
  MapPin,
  Calendar,
  Euro
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [quizResults, setQuizResults] = useState<Record<string, QuizResult>>({});
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userCourses] = useState<Course[]>([mockCourse]);
  const [userOrders] = useState<Order[]>(mockOrders.filter(o => o.userEmail === localStorage.getItem("userEmail") || o.userId === "user1"));

  // User profile form
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: ""
  });

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const admin = localStorage.getItem("isAdmin") === "true";
    const name = localStorage.getItem("userName") || "Benutzer";
    const email = localStorage.getItem("userEmail") || "";

    if (!loggedIn) {
      navigate("/login");
      return;
    }

    setIsLoggedIn(loggedIn);
    setIsAdmin(admin);
    setUserName(name);
    setUserEmail(email);
    setProfileForm(prev => ({ ...prev, name, email }));

    const savedProgress = localStorage.getItem("courseProgress");
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    } else {
      const initial = getInitialProgress();
      setProgress(initial);
      localStorage.setItem("courseProgress", JSON.stringify(initial));
    }

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

  const handleProfileSave = () => {
    localStorage.setItem("userName", profileForm.name);
    localStorage.setItem("userEmail", profileForm.email);
    setUserName(profileForm.name);
    setUserEmail(profileForm.email);
    toast({ title: "Erfolg", description: "Profil wurde gespeichert." });
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
                Verwalten Sie Ihre Kurse, Daten und Bestellungen.
              </p>
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

              {/* My Courses Tab */}
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

                {/* Course List */}
                {userCourses.map((course) => (
                    <Card key={course.id} className="mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-primary" />
                          {course.title}
                        </CardTitle>
                        <CardDescription>{course.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {course.chapters.map((chapter) => {
                            const chapterProgress = getChapterProgress(chapter.id);
                            const isComplete = isChapterComplete(chapter.id);
                            const quizPassed = isQuizPassed(chapter.id);
                            const showQuizButton = needsQuiz(chapter.id);
                            const firstAccessibleTopic = getFirstAccessibleTopic(chapter.id);
                            const isLocked = !isChapterAccessible(chapter.id, progress, quizResults);

                            return (
                                <div
                                    key={chapter.id}
                                    className={`p-4 rounded-lg border ${isLocked ? 'opacity-60 bg-muted/30' : 'bg-card'}`}
                                >
                                  <div className="flex items-center gap-4">
                                    {/* Chapter Number */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                        isComplete && quizPassed
                                            ? 'bg-success text-success-foreground'
                                            : isLocked
                                                ? 'bg-muted text-muted-foreground'
                                                : 'bg-gradient-to-br from-primary to-accent text-primary-foreground'
                                    }`}>
                                      {isComplete && quizPassed ? (
                                          <CheckCircle className="w-6 h-6" />
                                      ) : isLocked ? (
                                          <Lock className="w-6 h-6" />
                                      ) : (
                                          <span className="text-xl font-bold">{chapter.order}</span>
                                      )}
                                    </div>

                                    {/* Chapter Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-foreground truncate">
                                          {chapter.title}
                                        </h3>
                                        {isComplete && quizPassed && (
                                            <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                                      Abgeschlossen
                                    </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {chapter.description}
                                      </p>

                                      {/* Quiz Info */}
                                      {chapter.quiz && !quizPassed && (
                                          <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 px-3 py-1.5 rounded-lg w-fit">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span>Test muss bestanden werden, um fortzufahren</span>
                                          </div>
                                      )}

                                      <div className="flex items-center gap-4 mt-2">
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
                                        <Progress value={chapterProgress} className="flex-1 max-w-[150px]" />
                                        <span className="text-sm font-medium text-foreground">{chapterProgress}%</span>
                                      </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="shrink-0">
                                      {isLocked ? (
                                          <Button variant="secondary" disabled size="sm">
                                            <Lock className="w-4 h-4 mr-2" />
                                            Gesperrt
                                          </Button>
                                      ) : showQuizButton ? (
                                          <Link to={`/quiz/${chapter.id}`}>
                                            <Button variant="hero" size="sm">
                                              <ClipboardCheck className="w-4 h-4 mr-2" />
                                              Test starten
                                            </Button>
                                          </Link>
                                      ) : (
                                          <Link to={`/course/${chapter.id}/${firstAccessibleTopic}`}>
                                            <Button variant={isComplete && quizPassed ? "outline" : "default"} size="sm">
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
                                </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </TabsContent>

              {/* My Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Persönliche Daten
                    </CardTitle>
                    <CardDescription>Verwalten Sie Ihre Kontodaten</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={profileForm.name}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ihr Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-Mail</Label>
                        <Input
                            id="email"
                            type="email"
                            value={profileForm.email}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="ihre@email.de"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input
                            id="phone"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+49 170 1234567"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Adresse</Label>
                        <Input
                            id="address"
                            value={profileForm.address}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Musterstraße 1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Stadt</Label>
                        <Input
                            id="city"
                            value={profileForm.city}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="Berlin"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">PLZ</Label>
                        <Input
                            id="postalCode"
                            value={profileForm.postalCode}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, postalCode: e.target.value }))}
                            placeholder="10115"
                        />
                      </div>
                    </div>
                    <Button onClick={handleProfileSave} className="mt-6">
                      Speichern
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* My Orders Tab */}
              <TabsContent value="orders" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                      Meine Bestellungen
                    </CardTitle>
                    <CardDescription>Übersicht Ihrer Bestellungen</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userOrders.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-muted-foreground">Keine Bestellungen vorhanden.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                          {userOrders.map((order) => (
                              <Card key={order.id} className="bg-muted/30">
                                <CardContent className="pt-4">
                                  <div className="flex items-start justify-between mb-4">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-foreground">Bestellung #{order.id}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getOrderStatusColor(order.status)}`}>
                                    {getOrderStatusLabel(order.status)}
                                  </span>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-4 h-4" />
                                          {new Date(order.createdAt).toLocaleDateString('de-DE')}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Euro className="w-4 h-4" />
                                          {order.total.toFixed(2)} €
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                          <div className="flex items-center gap-2">
                                            {item.type === 'online_course' && <BookOpen className="w-4 h-4 text-primary" />}
                                            {item.type === 'practical_course' && <MapPin className="w-4 h-4 text-accent" />}
                                            {item.type === 'plastic_card' && <Award className="w-4 h-4 text-warning" />}
                                            <span className="text-foreground">{item.name}</span>
                                          </div>
                                          <span className="font-medium">{item.price.toFixed(2)} €</span>
                                        </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                          ))}
                        </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
  );
};

export default Dashboard;
