import mongoose, { Schema, Document } from "mongoose";
import { nanoid } from "nanoid";

export interface ICertificate extends Document {
  verificationCode: string;  // unique short code for QR verification
  userId: string;
  courseId: string;
  userName: string;
  courseName: string;
  score: number;
  issuedAt: Date;
  expiresAt?: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    verificationCode: {
      type: String,
      unique: true,
      default: () => nanoid(12).toUpperCase(),
    },
    userId:     { type: String, required: true },
    courseId:   { type: String, required: true },
    userName:   { type: String, required: true },
    courseName: { type: String, required: true },
    score:      { type: Number, required: true },
    issuedAt:   { type: Date, default: Date.now },
    expiresAt:  Date,
  },
  { timestamps: true }
);

CertificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });
CertificateSchema.index({ verificationCode: 1 }, { unique: true });

export default mongoose.model<ICertificate>("Certificate", CertificateSchema);
