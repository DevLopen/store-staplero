import mongoose, { Schema, Document } from "mongoose";

export interface NotifiedDate {
  locationId: string;
  locationCity: string;
  dateId: string;
  startDate: string;
  endDate: string;
}

export interface NotifyRequestDoc extends Document {
  email: string;
  productId: string;
  productTitle: string;
  locationId?: string;
  locationCity?: string;
  notified: boolean;
  notifiedAt?: Date;
  notifiedDates?: NotifiedDate[]; // terminy, o których klient dostał maila
  notifiedManually?: boolean;     // admin oznaczył ręcznie, bez maila
  lastError?: string;             // ostatni błąd wysyłki (zgłoszenie dalej czeka)
  createdAt: Date;
}

const NotifiedDateSchema = new Schema<NotifiedDate>(
  {
    locationId: String,
    locationCity: String,
    dateId: String,
    startDate: String,
    endDate: String,
  },
  { _id: false }
);

const NotifyRequestSchema = new Schema<NotifyRequestDoc>(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    productId: { type: String, required: true },
    productTitle: { type: String, default: "" },
    locationId: String,
    locationCity: String,
    notified: { type: Boolean, default: false },
    notifiedAt: Date,
    notifiedDates: { type: [NotifiedDateSchema], default: undefined },
    notifiedManually: Boolean,
    lastError: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotifyRequestSchema.index({ productId: 1, email: 1, locationId: 1 });
NotifyRequestSchema.index({ notified: 1, locationId: 1 });

export default mongoose.model<NotifyRequestDoc>("NotifyRequest", NotifyRequestSchema);
