import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CourseOverview from "./pages/CourseOverview";
import QuizView from "./pages/QuizView.tsx";
import TopicView from "./pages/TopicView.tsx";
import Admin from "./pages/Admin";
import PracticalCourse from "./pages/PracticalCourse";
import NotFound from "./pages/NotFound";
import FinalQuizView from "@/pages/FinalQuizView";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/course/:courseId" element={<CourseOverview />} />
                <Route path="/course/:courseId/chapter/:chapterId/topic/:topicId" element={<TopicView />} />
                <Route path="/course/:courseId/chapter/:chapterId/quiz" element={<QuizView />} />
                <Route path="/course/:courseId/final-quiz" element={<FinalQuizView />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/practical-course" element={<PracticalCourse />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
);

export default App;
