import mongoose, { Schema, Document } from "mongoose";

/**
 * Model dla uczestników kursów praktycznych
 * Przechowuje informacje o zapisanych uczestnikach na konkretne terminy
 */
export interface PracticalCourseParticipantDoc extends Document {
    // Dane użytkownika
    userId: string;
    userName: string;
    userEmail: string;
    userPhone?: string;

    // Dane zamówienia
    orderId: string;
    orderNumber: string;
    paidAt: Date;

    // Dane kursu i lokalizacji
    locationId: string;
    locationName: string;
    locationAddress: string;

    // Dane terminu
    dateId: string;  // ID z Location.dates[].id
    startDate: string;
    endDate: string;
    time: string;

    // Dodatki
    wantsPlasticCard: boolean;

    // Status
    status: "confirmed" | "cancelled" | "completed";

    // Faktury
    invoiceId?: string;
    invoiceNumber?: string;

    createdAt: Date;
    updatedAt: Date;
}

const PracticalCourseParticipantSchema = new Schema<PracticalCourseParticipantDoc>(
    {
        // Dane użytkownika
        userId: { type: String, required: true, index: true },
        userName: { type: String, required: true },
        userEmail: { type: String, required: true },
        userPhone: { type: String },

        // Dane zamówienia
        orderId: { type: String, required: true, unique: true },
        orderNumber: { type: String, required: true, unique: true },
        paidAt: { type: Date, required: true },

        // Dane kursu i lokalizacji
        locationId: { type: String, required: true, index: true },
        locationName: { type: String, required: true },
        locationAddress: { type: String, required: true },

        // Dane terminu
        dateId: { type: String, required: true, index: true },
        startDate: { type: String, required: true },
        endDate: { type: String, required: true },
        time: { type: String, required: true },

        // Dodatki
        wantsPlasticCard: { type: Boolean, default: false },

        // Status
        status: {
            type: String,
            enum: ["confirmed", "cancelled", "completed"],
            default: "confirmed",
        },

        // Faktury
        invoiceId: { type: String },
        invoiceNumber: { type: String },
    },
    { timestamps: true }
);

// Compound index - jeden użytkownik nie może być zapisany 2x na ten sam termin
PracticalCourseParticipantSchema.index(
    { userId: 1, locationId: 1, dateId: 1 },
    { unique: true }
);

// Index do szybkiego wyszukiwania uczestników danego terminu
PracticalCourseParticipantSchema.index({ locationId: 1, dateId: 1 });

// Index do wyszukiwania po dacie
PracticalCourseParticipantSchema.index({ startDate: 1 });

export const PracticalCourseParticipant = mongoose.model<PracticalCourseParticipantDoc>(
    "PracticalCourseParticipant",
    PracticalCourseParticipantSchema
);

export default PracticalCourseParticipant;