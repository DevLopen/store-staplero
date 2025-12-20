import mongoose, { Schema, Document } from "mongoose";

export interface ITopicProgress extends Document {
    userId: string;
    topicId: string;
    completed: boolean;
    completedAt?: Date;
}

const TopicProgressSchema: Schema = new Schema({
    userId: { type: String, required: true },
    topicId: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
});

export default mongoose.model<ITopicProgress>("TopicProgress", TopicProgressSchema);
