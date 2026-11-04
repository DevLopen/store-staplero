import mongoose, { Schema, Document } from "mongoose";

/** Per-user progress in one lesson of a learning course (v2): last step reached and completion. */
export interface LessonProgressDoc extends Document {
    userId: string;
    courseId: string;
    lessonId: string;
    step: number;
    completed: boolean;
    completedAt?: Date;
    /** Test modułu: najlepszy wynik, liczba pytań, zaliczony (odblokowuje kolejny moduł), liczba podejść. */
    score?: number;
    total?: number;
    passed?: boolean;
    attempts?: number;
    updatedAt: Date;
}

const LessonProgressSchema = new Schema<LessonProgressDoc>(
    {
        userId: { type: String, required: true },
        courseId: { type: String, required: true },
        lessonId: { type: String, required: true },
        step: { type: Number, default: 0, min: 0 },
        completed: { type: Boolean, default: false },
        completedAt: Date,
        score: Number,
        total: Number,
        passed: { type: Boolean, default: false },
        attempts: { type: Number, default: 0 },
    },
    { timestamps: true }
);

LessonProgressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });

export default mongoose.model<LessonProgressDoc>("LessonProgress", LessonProgressSchema);
