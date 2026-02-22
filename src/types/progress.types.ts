export interface QuizResultData {
  passed: boolean;
  score: number;
  attempts: number;
}

export interface LastPosition {
  chapterId: string;
  topicId: string;
}

export interface ProgressData {
  topics: Record<string, boolean>;
  quizzes: Record<string, QuizResultData>;
  finalQuizzes: Record<string, QuizResultData>;
  lastPosition: LastPosition | null;
}
