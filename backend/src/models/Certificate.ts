import mongoose, { Schema, Document } from "mongoose";
import { nanoid } from "nanoid";

export type CertificateType = "online" | "practical";

export interface ICertificate extends Document {
    verificationCode: string;
    userId: string;
    courseId?: string;          // for online courses
    participantId?: string;     // for practical courses (PracticalCourseParticipant._id)
    type: CertificateType;
    userName: string;
    userEmail: string;
    courseName: string;
    trainingDate: Date;         // date of exam / practical course
    trainingLocation?: string;  // for practical: city + address
    instructorName?: string;
    score?: number;             // for online: quiz score
    issuedAt: Date;
    revokedAt?: Date;
    revokedReason?: string;
    // wallet
    applePassUrl?: string;
    googlePassUrl?: string;
}

const CertificateSchema = new Schema<ICertificate>(
    {
        verificationCode: {
            type: String,
            unique: true,
            default: () => nanoid(12).toUpperCase(),
        },
        userId:           { type: String, required: true },
        courseId:         { type: String },
        participantId:    { type: String },
        type:             { type: String, enum: ["online", "practical"], required: true },
        userName:         { type: String, required: true },
        userEmail:        { type: String, required: true },
        courseName:       { type: String, required: true },
        trainingDate:     { type: Date, required: true },
        trainingLocation: { type: String },
        instructorName:   { type: String },
        score:            { type: Number },
        issuedAt:         { type: Date, default: Date.now },
        revokedAt:        { type: Date },
        revokedReason:    { type: String },
        applePassUrl:     { type: String },
        googlePassUrl:    { type: String },
    },
    { timestamps: true }
);

CertificateSchema.index({ userId: 1, courseId: 1 });
CertificateSchema.index({ userId: 1, participantId: 1 });
CertificateSchema.index({ verificationCode: 1 }, { unique: true });
CertificateSchema.index({ issuedAt: -1 });

export default mongoose.model<ICertificate>("Certificate", CertificateSchema);