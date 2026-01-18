import mongoose, { Schema, Document } from "mongoose";

export interface IUserCourse extends Document {
    userId: mongoose.Types.ObjectId;
    courseId: mongoose.Types.ObjectId;
    purchasedAt: Date;
}

const UserCourseSchema = new Schema<IUserCourse>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
        purchasedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

export const UserCourse = mongoose.model<IUserCourse>(
    "UserCourse",
    UserCourseSchema
);
