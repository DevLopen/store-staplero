import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDashboard, downloadCertificateUrl } from "@/api/dashboard.api";
import { DashboardCourse, DashboardData } from "@/types/dashboard";
import {
  BookOpen, CheckCircle, Lock, Clock, Award, Play, ChevronRight,
  Trophy, ShoppingBag, LogOut, Download, GraduationCap,
  TrendingUp, Settings, LayoutDashboard, User, Bell, ChevronDown,
  Zap, Target, Star, BarChart3, ArrowRight, Calendar, Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
  );
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ percent, size = 56 }: { percent: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  return (
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f59e0b" strokeWidth={6}
                strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course, quizResults, isAdmin }: {
  course: DashboardCourse;
  quizResults: Record<string, { passed: boolean }>;
  isAdmin: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  // Validate lastPosition still exists in course (chapter/topic may have been deleted)
  const lastPosValid = course.lastPosition
      ? course.chapters.some(ch =>
          ch.id === course.lastPosition!.chapterId &&
          ch.topics.some((t: any) => t.id === course.lastPosition!.topicId)
      )
      : false;

  const firstAvailable = course.chapters[0]?.topics[0]
      ? `/course/${course._id}/chapter/${course.chapters[0].id}/topic/${course.chapters[0].topics[0].id}`
      : `/course/${course._id}`;

  const resumeLink = lastPosValid
      ? `/course/${course._id}/chapter/${course.lastPosition!.chapterId}/topic/${course.lastPosition!.topicId}`
      : firstAvailable;

  const isDone = course.finalQuizResult?.passed === true;
  const canFinalQuiz = course.chapters.every(ch => ch.status === "complete");
  const isExpired = !isAdmin && course.daysRemaining !== null && course.daysRemaining <= 0;
  const daysLow = !isAdmin && course.daysRemaining !== null && course.daysRemaining > 0 && course.daysRemaining <= 7;

  return (
      <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group ${
          isExpired ? "border-red-200 opacity-70" : isDone ? "border-amber-200" : "border-gray-100 hover:border-amber-300"
      }`}>
        {/* Thumbnail */}
        <div className="relative h-40 overflow-hidden">
          {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-400 via-orange-400 to-amber-600 flex items-center justify-center">
                <GraduationCap className="h-14 w-14 text-white/40" />
              </div>
          )}

          {/* Overlay badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            {isAdmin && course.daysRemaining === null && (
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Shield className="h-3 w-3" /> Admin
            </span>
            )}
            {isDone && (
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Trophy className="h-3 w-3" /> Ukończony
            </span>
            )}
          </div>

          {/* Progress ring */}
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur rounded-full p-0.5">
            <ProgressRing percent={course.progressPercent} size={44} />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
            {course.progressPercent}%
          </span>
          </div>
        </div>

        <div className="p-4">
          {/* Title */}
          <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">{course.title}</h3>

          {/* Expiry */}
          {!isAdmin && course.daysRemaining !== null && (
              <div className={`flex items-center gap-1 text-xs mb-3 ${
                  isExpired ? "text-red-500" : daysLow ? "text-amber-600" : "text-gray-400"
              }`}>
                <Clock className="h-3 w-3" />
                {isExpired ? "Dostęp wygasł" : `${course.daysRemaining} dni dostępu`}
              </div>
          )}

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{course.completedTopics} / {course.totalTopics} tematów</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                   style={{ width: `${course.progressPercent}%` }} />
            </div>
          </div>

          {/* Chapters toggle */}
          <button
              onClick={() => setExpanded(e => !e)}
              className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-amber-600 transition-colors mb-3 py-1"
          >
            <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> {course.chapters.length} rozdziałów</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>

          {expanded && (
              <div className="border-t border-gray-100 pt-2 mb-3 space-y-1">
                {course.chapters.map((ch, idx) => (
                    <div key={ch.id} className="flex items-center gap-2 py-1">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                          ch.status === "complete" ? "bg-green-100 text-green-600" :
                              ch.status === "blocked" ? "bg-gray-100 text-gray-300" :
                                  "bg-amber-100 text-amber-600"
                      }`}>
                        {ch.status === "complete" ? <CheckCircle className="h-3 w-3" /> :
                            ch.status === "blocked" ? <Lock className="h-2.5 w-2.5" /> :
                                idx + 1}
                      </div>
                      <span className={`text-xs truncate ${ch.status === "blocked" ? "text-gray-300" : "text-gray-600"}`}>
                  {ch.title}
                </span>
                    </div>
                ))}
              </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {!isExpired && (
                <Link to={resumeLink}>
                  <button className="w-full bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" />
                    {lastPosValid ? "Kontynuuj naukę" : "Rozpocznij kurs"}
                  </button>
                </Link>
            )}

            {canFinalQuiz && !isDone && !isExpired && (
                <Link to={`/course/${course._id}/final-quiz`}>
                  <button className="w-full border border-amber-300 text-amber-700 hover:bg-amber-50 text-sm font-medium py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Award className="h-4 w-4" /> Egzamin końcowy
                  </button>
                </Link>
            )}

            {isDone && course.certificateEnabled && (
                <a href={downloadCertificateUrl(course._id)} target="_blank" rel="noreferrer">
                  <button className="w-full border border-green-300 text-green-700 hover:bg-green-50 text-sm font-medium py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" /> Certyfikat
                  </button>
                </a>
            )}
          </div>
        </div>
      </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

type Tab = "courses" | "orders" | "profile";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("courses");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    getDashboard()
        .then((result) => {
          console.log("[Dashboard] API result:", result);
          console.log("[Dashboard] courses:", result.courses?.length, "isAdmin:", result.user?.isAdmin);
          setData(result);
        })
        .catch((err) => {
          console.error("[Dashboard] FETCH ERROR:", err);
          toast({ title: "Błąd", description: "Nie można załadować dashboardu.", variant: "destructive" });
        })
        .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 text-sm mt-4">Ładowanie panelu…</p>
          </div>
        </div>
    );
  }

  if (!data) return null;

  const { user, courses, orders } = data;
  const quizResults = data.progress.quizzes;
  const isAdmin = user.isAdmin;
  const completedCourses = courses.filter(c => c.finalQuizResult?.passed).length;
  const avgProgress = courses.length
      ? Math.round(courses.reduce((s, c) => s + c.progressPercent, 0) / courses.length)
      : 0;

  const navItems: { id: Tab; label: string; icon: any }[] = [
    { id: "courses", label: "Moje kursy", icon: BookOpen },
    { id: "orders", label: "Zamówienia", icon: ShoppingBag },
    { id: "profile", label: "Profil", icon: User },
  ];

  return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* ── Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed top-0 left-0 bottom-0 z-40">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-base">S</span>
              </div>
              <span className="font-black text-lg tracking-tight text-gray-900">STAPLER<span className="text-amber-500">O</span></span>
            </Link>
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {initials(user.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            activeTab === item.id
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }`}>
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </button>
            ))}

            <div className="pt-3 mt-3 border-t border-gray-100">
              <Link to="/">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all">
                  <LayoutDashboard className="h-4 w-4" /> Strona główna
                </button>
              </Link>
              {isAdmin && (
                  <Link to="/admin">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50 transition-all mt-1">
                      <Settings className="h-4 w-4" /> Panel admina
                    </button>
                  </Link>
              )}
            </div>
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-gray-100">
            <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
              <LogOut className="h-4 w-4" /> Wyloguj się
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 lg:ml-64 min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile logo */}
              <Link to="/" className="flex items-center gap-2 lg:hidden">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <span className="text-white font-black text-sm">S</span>
                </div>
                <span className="font-black text-base tracking-tight text-gray-900">STAPLER<span className="text-amber-500">O</span></span>
              </Link>

              {/* Page title - desktop */}
              <div className="hidden lg:block">
                <h1 className="text-xl font-bold text-gray-900">
                  {activeTab === "courses" ? "Moje kursy" :
                      activeTab === "orders" ? "Zamówienia" : "Profil"}
                </h1>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-3">
                {isAdmin && (
                    <Link to="/admin" className="hidden sm:flex">
                      <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                        <Settings className="h-4 w-4" />
                        Panel admina
                      </button>
                    </Link>
                )}
                {/* Mobile user avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold lg:hidden flex-shrink-0">
                  {initials(user.name)}
                </div>
              </div>
            </div>

            {/* Mobile tab bar */}
            <div className="flex gap-1 mt-3 lg:hidden">
              {navItems.map(item => (
                  <button key={item.id} onClick={() => setActiveTab(item.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                              activeTab === item.id ? "bg-amber-50 text-amber-700" : "text-gray-400 hover:text-gray-700"
                          }`}>
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
              ))}
            </div>
          </header>

          <main className="px-4 sm:px-6 lg:px-8 py-8">

            {/* ── COURSES TAB ── */}
            {activeTab === "courses" && (
                <div className="space-y-8">
                  {/* Welcome + stats */}
                  <div>
                    <div className="mb-6">
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Witaj, {user.name.split(" ")[0]}! 👋
                      </h2>
                      <p className="text-gray-500 mt-1">
                        {courses.length === 0
                            ? "Nie masz jeszcze żadnych kursów."
                            : `Masz dostęp do ${courses.length} ${courses.length === 1 ? "kursu" : "kursów"}`}
                      </p>
                    </div>

                    {courses.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                          <StatCard icon={BookOpen} label="Kursy" value={courses.length} color="bg-blue-50 text-blue-600" />
                          <StatCard icon={Trophy} label="Ukończone" value={completedCourses} color="bg-amber-50 text-amber-600" />
                          <StatCard icon={TrendingUp} label="Śr. postęp" value={`${avgProgress}%`} color="bg-green-50 text-green-600" />
                          <StatCard icon={ShoppingBag} label="Zamówienia" value={orders.length} color="bg-purple-50 text-purple-600" />
                        </div>
                    )}
                  </div>

                  {/* Courses grid */}
                  {courses.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                        <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <GraduationCap className="h-10 w-10 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Brak kursów</h3>
                        <p className="text-gray-400 mb-6">
                          {isAdmin
                              ? "Nie ma jeszcze żadnych kursów w systemie. Dodaj pierwszy kurs w panelu admina."
                              : "Kup kurs aby rozpocząć naukę."}
                        </p>
                        <div className="flex gap-3 justify-center flex-wrap">
                          {isAdmin ? (
                              <Link to="/admin">
                                <button className="bg-amber-500 hover:bg-amber-400 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors">
                                  <Settings className="h-4 w-4" /> Panel admina
                                </button>
                              </Link>
                          ) : (
                              <Link to="/">
                                <button className="bg-amber-500 hover:bg-amber-400 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition-colors">
                                  Zobacz kursy <ArrowRight className="h-4 w-4" />
                                </button>
                              </Link>
                          )}
                        </div>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {courses.map(course => (
                            <CourseCard key={course._id} course={course} quizResults={quizResults} isAdmin={isAdmin} />
                        ))}
                      </div>
                  )}
                </div>
            )}

            {/* ── ORDERS TAB ── */}
            {activeTab === "orders" && (
                <div className="max-w-3xl space-y-4">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Zamówienia</h2>
                    <p className="text-gray-500 mt-1">Historia Twoich zakupów</p>
                  </div>

                  {orders.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Brak zamówień</p>
                        <p className="text-gray-400 text-sm mt-1">Twoje przyszłe zakupy pojawią się tutaj.</p>
                      </div>
                  ) : (
                      <div className="space-y-3">
                        {orders.map((order: any) => (
                            <div key={order._id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                                  <ShoppingBag className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-gray-900 font-semibold text-sm">{order.orderNumber}</p>
                                  <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(order.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-gray-900 font-bold">{order.totalAmount?.toFixed(2)} €</p>
                                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                                    order.status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                                }`}>
                          {order.status === "paid" ? "Opłacone" : order.status}
                        </span>
                              </div>
                            </div>
                        ))}
                      </div>
                  )}
                </div>
            )}

            {/* ── PROFILE TAB ── */}
            {activeTab === "profile" && (
                <div className="max-w-xl space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Profil</h2>
                    <p className="text-gray-500 mt-1">Twoje informacje konta</p>
                  </div>

                  {/* Profile card */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Header banner */}
                    <div className="h-20 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />
                    <div className="px-6 pb-6 -mt-10">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-black border-4 border-white shadow-md mb-4">
                        {initials(user.name)}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                      <p className="text-gray-500 text-sm">{user.email}</p>
                      {isAdmin && (
                          <span className="inline-flex items-center gap-1 mt-2 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <Shield className="h-3 w-3" /> Administrator
                    </span>
                      )}

                      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Kursy</p>
                        </div>
                        <div className="text-center border-x border-gray-100">
                          <p className="text-2xl font-bold text-green-600">{completedCourses}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Ukończone</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-amber-600">{avgProgress}%</p>
                          <p className="text-xs text-gray-400 mt-0.5">Śr. postęp</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin quick access */}
                  {isAdmin && (
                      <Link to="/admin">
                        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-5 text-white flex items-center justify-between hover:shadow-lg transition-shadow cursor-pointer">
                          <div>
                            <p className="font-bold">Panel Administratora</p>
                            <p className="text-white/80 text-sm mt-0.5">Zarządzaj kursami i użytkownikami</p>
                          </div>
                          <ArrowRight className="h-6 w-6 text-white/80" />
                        </div>
                      </Link>
                  )}

                  {/* Logout */}
                  <button onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 font-medium py-3 rounded-xl transition-colors">
                    <LogOut className="h-4 w-4" /> Wyloguj się
                  </button>
                </div>
            )}
          </main>
        </div>
      </div>
  );
};

export default Dashboard;