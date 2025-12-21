import mongoose, { Schema, Document } from "mongoose";

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

interface Chapter {
    id: string; // frontend używa tego
    _id?: string; // MongoDB ObjectId
    title: string;
    description: string;
    order: number;
    topics: Topic[];
}

interface CourseDoc extends Document {
    title: string;
    description: string;
    chapters: Chapter[];
    finalQuiz?: any;
}

const TopicSchema = new Schema<Topic>({
    id: String,
    title: String,
    content: String,
    duration: String,
    videoUrl: String,
    minDurationSeconds: Number,
    requireMinDuration: Boolean,
});

const ChapterSchema = new Schema<Chapter>({
    id: String,
    title: String,
    description: String,
    order: Number,
    topics: [TopicSchema],
});

const CourseSchema = new Schema<CourseDoc>({
    title: { type: String, required: true },
    description: String,
    chapters: [ChapterSchema],
    finalQuiz: Object,
});

export default mongoose.model<CourseDoc>("Course", CourseSchema);
