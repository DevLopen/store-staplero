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
  Calendar,
  Euro,
  MapPin
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCourseProgress, isChapterComplete, isChapterAccessible, isQuizPassed, needsQuiz, getFirstAccessibleTopic } from "../utils/courseUtils";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [quizResults, setQuizResults] = useState<Record<string, QuizResult>>({});

  // User profile form
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: ""
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Pobranie danych użytkownika
    fetch("http://localhost:5000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUserName(data.user.name);
            setUserEmail(data.user.email);
            setIsAdmin(data.user.isAdmin);
            setIsLoggedIn(true);
            setProfileForm(prev => ({ ...prev, name: data.user.name, email: data.user.email }));
            // pobranie kursów i zamówień
            fetchCourses();
            fetchOrders(data.user.email);
          } else {
            navigate("/login");
          }
        })
        .catch(() => navigate("/login"));
  }, [navigate]);

  const fetchCourses = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUserCourses(data || []); // jeśli brak kursów, pusty array
    } catch (err) {
      toast({ title: "Fehler", description: "Kurse konnten nicht geladen werden." });
      setUserCourses([]);
    }
  };

  const fetchOrders = async (email: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders?email=${email}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUserOrders(data || []); // jeśli brak zamówień, pusty array
    } catch (err) {
      toast({ title: "Fehler", description: "Bestellungen konnten nicht geladen werden." });
      setUserOrders([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  const handleProfileSave = () => {
    localStorage.setItem("userName", profileForm.name);
    localStorage.setItem("userEmail", profileForm.email);
    setUserName(profileForm.name);
    setUserEmail(profileForm.email);
    toast({ title: "Erfolg", description: "Profil wurde gespeichert." });
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
              <p className="text-muted-foreground">Verwalten Sie Ihre Kurse, Daten und Bestellungen.</p>
            </div>

            <Tabs defaultValue="courses" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="courses" className="flex items-center gap-2">
                  <Library className="w-4 h-4" /> <span className="hidden sm:inline">Meine Kurse</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" /> <span className="hidden sm:inline">Meine Daten</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> <span className="hidden sm:inline">Bestellungen</span>
                </TabsTrigger>
              </TabsList>

              {/* Kurse */}
              <TabsContent value="courses" className="space-y-6">
                {userCourses.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Keine Kurse vorhanden.
                    </div>
                ) : (
                    userCourses.map(course => (
                        <Card key={course.id} className="mb-6">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-primary" /> {course.title}
                            </CardTitle>
                            <CardDescription>{course.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {course.chapters.map(chapter => {
                              const chapterProgress = getCourseProgress(progress); // można zmienić per chapter
                              const isComplete = isChapterComplete(chapter.id, progress);
                              const quizPassed = isQuizPassed(chapter.id, quizResults);
                              const showQuizButton = needsQuiz(chapter.id, progress, quizResults);
                              const firstAccessibleTopic = getFirstAccessibleTopic(chapter.id, progress, quizResults);
                              const isLocked = !isChapterAccessible(chapter.id, progress, quizResults);

                              return (
                                  <div
                                      key={chapter.id}
                                      className={`p-4 rounded-lg border ${isLocked ? 'opacity-60 bg-muted/30' : 'bg-card'}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h3 className="font-semibold text-foreground">{chapter.title}</h3>
                                        <p className="text-sm text-muted-foreground">{chapter.description}</p>
                                      </div>
                                      <div>
                                        {isLocked ? (
                                            <Lock />
                                        ) : showQuizButton ? (
                                            <Link to={`/quiz/${chapter.id}`}><Button>Test starten</Button></Link>
                                        ) : (
                                            <Link to={`/course/${chapter.id}/${firstAccessibleTopic}`}><Button>Starten</Button></Link>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                    ))
                )}
              </TabsContent>

              {/* Profil */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Persönliche Daten</CardTitle>
                    <CardDescription>Verwalten Sie Ihre Kontodaten</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(profileForm).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                            <Label htmlFor={key}>{key}</Label>
                            <Input
                                id={key}
                                value={value}
                                onChange={e => setProfileForm(prev => ({ ...prev, [key]: e.target.value }))}
                            />
                          </div>
                      ))}
                    </div>
                    <Button className="mt-6" onClick={handleProfileSave}>Speichern</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bestellungen */}
              <TabsContent value="orders" className="space-y-6">
                {userOrders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Keine Bestellungen vorhanden.
                    </div>
                ) : (
                    userOrders.map(order => (
                        <Card key={order.id} className="mb-4 bg-muted/30">
                          <CardContent>
                            <div className="flex justify-between mb-2">
                              <span>Bestellung #{order.id}</span>
                              <span>{order.total.toFixed(2)} €</span>
                            </div>
                            <div className="space-y-1">
                              {order.items.map(item => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                    <span>{item.name}</span>
                                    <span>{item.price.toFixed(2)} €</span>
                                  </div>
                              ))}
                            </div>
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
