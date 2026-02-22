import { Chapter, Quiz } from "./course.types";

export interface DashboardCertificate {
  verificationCode: string;
  issuedAt: string;
  score: number;
}

export interface DashboardCourse {
  _id: string;
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  certificateEnabled: boolean;
  chapters: Chapter[];
  finalQuiz?: Quiz;
  progressPercent: number;
  completedTopics: number;
  totalTopics: number;
  expiresAt?: string;
  purchaseDate?: string;
  daysRemaining: number | null;
  lastPosition: { chapterId: string; topicId: string } | null;
  certificate: DashboardCertificate | null;
  finalQuizResult: { passed: boolean; score: number; attempts: number } | null;
}

export interface DashboardData {
  user: { name: string; email: string; isAdmin: boolean };
  courses: DashboardCourse[];
  progress: {
    topics: Record<string, boolean>;
    quizzes: Record<string, { passed: boolean; score: number; attempts: number }>;
    finalQuizzes: Record<string, { passed: boolean; score: number; attempts: number }>;
  };
  orders: any[];
}
