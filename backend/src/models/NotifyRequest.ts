import mongoose, { Schema, Document } from "mongoose";

export interface NotifyRequestDoc extends Document {
  email: string;
  productId: string;
  productTitle: string;
  locationId?: string;
  locationCity?: string;
  notified: boolean;
  createdAt: Date;
}

const NotifyRequestSchema = new Schema<NotifyRequestDoc>(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    productId: { type: String, required: true },
    productTitle: { type: String, default: "" },
    locationId: String,
    locationCity: String,
    notified: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotifyRequestSchema.index({ productId: 1, email: 1, locationId: 1 });

export default mongoose.model<NotifyRequestDoc>("NotifyRequest", NotifyRequestSchema);
