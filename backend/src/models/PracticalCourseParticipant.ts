import mongoose, { Schema, Document } from "mongoose";

/**
 * Model dla uczestników kursów praktycznych
 * Przechowuje informacje o zapisanych uczestnikach na konkretne terminy
 */
export interface PracticalCourseParticipantDoc extends Document {
    // Dane użytkownika
    userId: string;
    userName: string;       // pełne imię i nazwisko
    firstName?: string;
    lastName?: string;
    userEmail: string;
    userPhone?: string;

    // Dane zamówienia
    // Jedno zamówienie może mieć kilku uczestników — każdy ma własny dokument.
    // seatIndex: 0 = osoba kupująca, 1..n = dodatkowe osoby z tego samego zamówienia.
    seatIndex: number;
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

    // Status
    status: "confirmed" | "cancelled" | "completed";

    // Faktury
    invoiceId?: string;
    invoiceNumber?: string;

    // Wpis dodany ręcznie przez admina (bez zamówienia w sklepie)
    isManual?: boolean;
    notes?: string;

    createdAt: Date;
    updatedAt: Date;
}

const PracticalCourseParticipantSchema = new Schema<PracticalCourseParticipantDoc>(
    {
        // Dane użytkownika
        userId: { type: String, required: true, index: true },
        userName: { type: String, required: true },
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        userEmail: { type: String, required: true },
        userPhone: { type: String },

        // Dane zamówienia (orderId/orderNumber NIE są unikalne — patrz indeks orderId+seatIndex)
        seatIndex: { type: Number, default: 0, min: 0 },
        orderId: { type: String, required: true, index: true },
        orderNumber: { type: String, required: true, index: true },
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

        // Status
        status: {
            type: String,
            enum: ["confirmed", "cancelled", "completed"],
            default: "confirmed",
        },

        // Faktury
        invoiceId: { type: String },
        invoiceNumber: { type: String },

        // Wpisy ręczne
        isManual: { type: Boolean, default: false },
        notes: { type: String },
    },
    { timestamps: true }
);

// Jedno miejsce (seat) w zamówieniu = jeden uczestnik. Chroni przed dublami przy ponownym
// wywołaniu webhooka, a jednocześnie pozwala na wielu uczestników w jednym zamówieniu.
PracticalCourseParticipantSchema.index(
    { orderId: 1, seatIndex: 1 },
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