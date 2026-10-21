import mongoose, { Schema, Document } from "mongoose";

/** Per-user progress in one lesson of a learning course (v2): last step reached and completion. */
export interface LessonProgressDoc extends Document {
    userId: string;
    courseId: string;
    lessonId: string;
    step: number;
    completed: boolean;
    completedAt?: Date;
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
    },
    { timestamps: true }
);

LessonProgressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });

export default mongoose.model<LessonProgressDoc>("LessonProgress", LessonProgressSchema);
