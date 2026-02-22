import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";

// Importy stron
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CourseOverview from "./pages/CourseOverview";
import QuizView from "./pages/QuizView";
import FinalQuizView from "./pages/FinalQuizView";
import TopicView from "./pages/TopicView";
import TopicEditor from "./pages/TopicEditor";
import Admin from "./pages/Admin";
import PracticalCourse from "./pages/PracticalCourse";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import ScrollToTop from "@/components/ScrollToTop";
import ChatWidget from "./components/ChatWidget";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 2 * 60 * 1000 },
  },
});

/**
 * Komponent pomocniczy, który ma dostęp do Routera.
 * Tutaj decydujemy, co pokazać (np. Chat).
 */
const AppContent = () => {
  const location = useLocation();

  // Sprawdzamy, czy aktualna ścieżka powinna UKRYĆ czat.
  // Czat znika na: /admin, /dashboard, /course
  const isPanelArea =
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/dashboard") ||
      location.pathname.startsWith("/course");

  return (
      <>
        <ScrollToTop />
        <Routes>
          {/* --- FRONTEND --- */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/practical-course" element={<PracticalCourse />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<CheckoutCancel />} />

          {/* --- PANEL UŻYTKOWNIKA --- */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/course/:courseId" element={<CourseOverview />} />
          <Route path="/course/:courseId/chapter/:chapterId/topic/:topicId" element={<TopicView />} />
          <Route path="/course/:courseId/chapter/:chapterId/quiz" element={<QuizView />} />
          <Route path="/course/:courseId/final-quiz" element={<FinalQuizView />} />

          {/* --- ADMIN --- */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/topic-editor/:courseId/:chapterId" element={<TopicEditor />} />
          <Route path="/admin/topic-editor/:courseId/:chapterId/:topicId" element={<TopicEditor />} />

          {/* --- 404 --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Renderuj czat tylko jeśli NIE jesteśmy w panelu */}
        {!isPanelArea && <ChatWidget />}
      </>
  );
};

// Główny komponent App (Czysta konfiguracja)
const App = () => (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
);

export default App;