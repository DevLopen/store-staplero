import mongoose, { Schema, Document } from "mongoose";

/* ---------- TYPES ---------- */

interface Topic {
    id: string;
    title: string;
    content: string;
    duration: string;
    videoUrl?: string | null;
    minDurationSeconds?: number | null;
    requireMinDuration?: boolean;
    order: number;
}

export interface Question {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
}

export interface Quiz {
    id: string;
    chapterId?: string;
    title: string;
    description?: string;
    passingScore: number;
    isFinalQuiz?: boolean;
    questions: Question[];
}

export interface Chapter {
    id: string;
    title: string;
    description: string;
    order: number;
    topics: Topic[];
    quiz?: Quiz;
    status?: "blocked" | "pending" | "complete";
}

export interface CourseDoc extends Document {
    title: string;
    description: string;
    chapters: Chapter[];
    finalQuiz?: Quiz;
}

/* ---------- SCHEMAS ---------- */

const TopicSchema = new Schema<Topic>({
    id: String,
    title: String,
    content: String,
    duration: String,
    videoUrl: String,
    minDurationSeconds: Number,
    requireMinDuration: Boolean,
    order: Number,
});

const QuestionSchema = new Schema<Question>({
    id: String,
    question: String,
    options: [String],
    correctAnswer: Number,
});

const QuizSchema = new Schema<Quiz>({
    id: String,
    chapterId: String,
    title: String,
    description: String,
    passingScore: Number,
    isFinalQuiz: Boolean,
    questions: [QuestionSchema],
});

const ChapterSchema = new Schema<Chapter>({
    id: String,
    title: String,
    description: String,
    order: Number,
    topics: [TopicSchema],
    quiz: QuizSchema,
    status: { type: String, enum: ["blocked","pending","complete"], default: "pending" },
});

const CourseSchema = new Schema<CourseDoc>({
    title: { type: String, required: true },
    description: String,
    chapters: [ChapterSchema],
    finalQuiz: QuizSchema,
});

export default mongoose.model<CourseDoc>("Course", CourseSchema);
