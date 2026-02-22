import mongoose, { Schema, Document } from "mongoose";

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  userAnswer?: string | number | number[] | string[];
}

export interface IQuizResult extends Document {
  userId: string;
  courseId: string;
  quizId: string;
  chapterId?: string;
  score: number;         // 0-100
  passed: boolean;
  isFinalQuiz: boolean;
  attemptNumber: number;
  questionResults: QuestionResult[];
  completedAt: Date;
}

const QuestionResultSchema = new Schema<QuestionResult>({
  questionId: { type: String, required: true },
  correct:    { type: Boolean, required: true },
  userAnswer: { type: Schema.Types.Mixed },
});

const QuizResultSchema = new Schema<IQuizResult>({
  userId:          { type: String, required: true, index: true },
  courseId:        { type: String, required: true, index: true },
  quizId:          { type: String, required: true },
  chapterId:       String,
  score:           { type: Number, required: true },
  passed:          { type: Boolean, required: true },
  isFinalQuiz:     { type: Boolean, default: false },
  attemptNumber:   { type: Number, default: 1 },
  questionResults: [QuestionResultSchema],
  completedAt:     { type: Date, default: Date.now },
});

QuizResultSchema.index({ userId: 1, quizId: 1 });
QuizResultSchema.index({ userId: 1, courseId: 1 });
QuizResultSchema.index({ userId: 1, chapterId: 1 });

export default mongoose.model<IQuizResult>("QuizResult", QuizResultSchema);
