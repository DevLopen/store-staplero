import mongoose, { Schema, Document } from "mongoose";

export interface IQuizResult extends Document {
    userId: string;
    quizId: string;
    chapterId?: string;
    score: number;
    passed: boolean;
    completedAt: Date;
    isFinalQuiz?: boolean;
}

const QuizResultSchema: Schema = new Schema({
    userId: { type: String, required: true },
    quizId: { type: String, required: true },
    chapterId: { type: String },
    score: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    completedAt: { type: Date, default: Date.now },
    isFinalQuiz: { type: Boolean, default: false }
});

export default mongoose.model<IQuizResult>("QuizResult", QuizResultSchema);
