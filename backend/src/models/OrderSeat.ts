import mongoose, { Schema, Document } from "mongoose";

/**
 * Miejsce (seat) w opłaconym zamówieniu: jeden dostęp online albo jedno miejsce na kursie praktycznym.
 *
 * - Kurs online, N dostępów → N miejsc „online”.
 * - Kurs praktyczny → jedno miejsce „practical” na uczestnika; seatIndex = seatIndex rekordu
 *   PracticalCourseParticipant (0 = kupujący, gdy sam uczestniczy).
 * - Pakiet (praktyka + teoria online) → miejsca „practical” z courseId/accessDays części online.
 *
 * Ważność liczy się od PŁATNOŚCI (decyzja właściciela):
 * - onlineExpiresAt = paidAt + accessDays (online i pakiet), także gdy nikt miejsca jeszcze nie zajął;
 * - courseEndsAt = koniec ostatniego dnia kursu (praktyka i pakiet);
 * - expiresAt = do kiedy miejsce w ogóle da się zająć: później z obu dat. Pakiet jest więc do zajęcia,
 *   dopóki nie wygasł dostęp online ALBO nie minął dzień kursu (po wygaśnięciu części online
 *   zajęcie daje już tylko miejsce na kursie).
 *
 * Status: open (wolne) → invited (wysłane zaproszenie) → claimed (zajęte przez konto). Cofnięcie zaproszenia
 * przez kupującego wraca do open. revoked = admin odebrał dostęp z zamówienia („Zugang entziehen”, miejsce martwe).
 * Token zaproszenia trzymamy tylko jako hash (tokenHash), nigdy jawnie.
 */
export type SeatKind = "online" | "practical";
export type SeatStatus = "open" | "invited" | "claimed" | "revoked";
export const SEAT_LANGUAGES = ["de", "en", "uk", "pl"] as const;
export type SeatLanguage = (typeof SEAT_LANGUAGES)[number];

export interface OrderSeatDoc extends Document {
    orderId: string;
    orderNumber: string;
    seatIndex: number;
    kind: SeatKind;
    courseId?: string;
    accessDays?: number;
    expiresAt?: Date;
    onlineExpiresAt?: Date;
    courseEndsAt?: Date;
    practicalParticipantId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    language: SeatLanguage;
    status: SeatStatus;
    tokenHash?: string;
    tokenExpiresAt?: Date;
    invitedAt?: Date;
    lastSentAt?: Date;
    sendCount: number;
    sentTimes?: Date[]; // ostatnie wysyłki zaproszenia (limit na 24 h)
    claimedByUserId?: string;
    claimedAt?: Date;
    claimedTokenHash?: string; // hash użytego linku: ponowne kliknięcie pokazuje „bereits angenommen”, a nie „ungültig”
    reminderSentAt?: Date; // przypomnienie dla zaproszonej osoby (raz na zaproszenie; nowe zaproszenie zeruje)
    bookingMailSentAt?: Date; // potwierdzenie rezerwacji dla osoby, która zajęła miejsce na kursie praktycznym (raz)
    revokedAt?: Date;
    revokedReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSeatSchema = new Schema<OrderSeatDoc>(
    {
        orderId: { type: String, required: true, index: true },
        orderNumber: { type: String, required: true, index: true },
        seatIndex: { type: Number, required: true, min: 0 },
        kind: { type: String, enum: ["online", "practical"], required: true },
        courseId: { type: String },
        accessDays: { type: Number, min: 1 },
        expiresAt: { type: Date },
        onlineExpiresAt: { type: Date },
        courseEndsAt: { type: Date },
        practicalParticipantId: { type: String },
        firstName: { type: String, trim: true, maxlength: 100 },
        lastName: { type: String, trim: true, maxlength: 100 },
        email: { type: String, trim: true, lowercase: true, maxlength: 254 },
        language: { type: String, enum: SEAT_LANGUAGES, default: "de" },
        status: { type: String, enum: ["open", "invited", "claimed", "revoked"], default: "open", index: true },
        tokenHash: { type: String },
        tokenExpiresAt: { type: Date },
        invitedAt: { type: Date },
        lastSentAt: { type: Date },
        sendCount: { type: Number, default: 0, min: 0 },
        sentTimes: { type: [Date], default: undefined },
        claimedByUserId: { type: String, index: true },
        claimedAt: { type: Date },
        claimedTokenHash: { type: String },
        reminderSentAt: { type: Date },
        bookingMailSentAt: { type: Date },
        revokedAt: { type: Date },
        revokedReason: { type: String },
    },
    { timestamps: true }
);

// Jedno miejsce o danym numerze w zamówieniu — chroni przed dublami przy ponownym webhooku
OrderSeatSchema.index({ orderId: 1, seatIndex: 1 }, { unique: true });

// Ta sama osoba (e-mail) nie może mieć dwóch aktywnych miejsc w jednym zamówieniu.
// Wolne i cofnięte miejsca nie blokują adresu.
OrderSeatSchema.index(
    { orderId: 1, email: 1 },
    {
        unique: true,
        partialFilterExpression: { email: { $type: "string" }, status: { $in: ["invited", "claimed"] } },
        name: "orderId_email_active_unique",
    }
);

// Wyszukiwanie zaproszenia po tokenie (hash)
OrderSeatSchema.index({ tokenHash: 1 }, { sparse: true });
OrderSeatSchema.index({ claimedTokenHash: 1 }, { sparse: true });

export const OrderSeat = mongoose.model<OrderSeatDoc>("OrderSeat", OrderSeatSchema);
export default OrderSeat;
