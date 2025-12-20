import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
    title: string;
    description: string;
    chapters: any[]; // Możesz użyć dokładnych typów z courseData.ts
    finalQuiz?: any;
}

const CourseSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    chapters: { type: Array, default: [] },
    finalQuiz: { type: Object, default: null }
});

export default mongoose.model<ICourse>("Course", CourseSchema);
