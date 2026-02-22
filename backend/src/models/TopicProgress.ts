import mongoose, { Schema, Document } from "mongoose";

export interface ITopicProgress extends Document {
  userId: string;
  courseId: string;
  topicId: string;
  chapterId: string;
  completed: boolean;
  completedAt?: Date;
  lastAccessedAt: Date;
}

/**
 * Tracks per-user, per-course last position so "Resume" works.
 */
export interface ILastPosition extends Document {
  userId: string;
  courseId: string;
  chapterId: string;
  topicId: string;
  updatedAt: Date;
}

const TopicProgressSchema = new Schema<ITopicProgress>({
  userId:         { type: String, required: true, index: true },
  courseId:       { type: String, required: true, index: true },
  topicId:        { type: String, required: true },
  chapterId:      { type: String, required: true },
  completed:      { type: Boolean, default: false },
  completedAt:    Date,
  lastAccessedAt: { type: Date, default: Date.now },
});

TopicProgressSchema.index({ userId: 1, courseId: 1 });
TopicProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });

const LastPositionSchema = new Schema<ILastPosition>(
  {
    userId:    { type: String, required: true },
    courseId:  { type: String, required: true },
    chapterId: { type: String, required: true },
    topicId:   { type: String, required: true },
  },
  { timestamps: true }
);

LastPositionSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const TopicProgress = mongoose.model<ITopicProgress>("TopicProgress", TopicProgressSchema);
export const LastPosition  = mongoose.model<ILastPosition>("LastPosition",   LastPositionSchema);

export default TopicProgress;
