import mongoose, { Schema, Document, Types } from "mongoose";

/**
 * Skrzynka w panelu admina (/admin#mails).
 * Jeden dokument = jedna rozmowa z klientem: wiadomości przychodzące (formularz, maile z IMAP przez n8n)
 * i nasze odpowiedzi. n8n dopisuje kategorię, streszczenie i szkic odpowiedzi; wysyła zawsze człowiek z panelu.
 */

export const INBOX_CATEGORIES = [
    "kursanfrage",   // terminy, ceny, języki, zapisy na kurs
    "buchung",       // istniejąca rezerwacja: zmiana, storno, przesunięcie terminu
    "zahlung",       // faktura, płatność, zwrot
    "zertifikat",    // Staplerschein, certyfikat, Wallet, duplikat
    "firmen",        // szkolenia dla firm, oferty B2B
    "sonstiges",
    "spam",
] as const;
export type InboxCategory = typeof INBOX_CATEGORIES[number];

export const INBOX_STATUSES = ["new", "draft", "sent", "archived"] as const;
export type InboxStatus = typeof INBOX_STATUSES[number];

export interface InboxAttachment {
    filename: string;
    storedName: string;   // nazwa pliku w INBOX_FILES_DIR (poza publicznym /uploads)
    mimeType: string;
    size: number;
}

export interface InboxMessage {
    _id?: Types.ObjectId;
    direction: "in" | "out";
    source: "form" | "email" | "panel";
    messageId: string;          // nagłówek Message-ID, po nim łączymy odpowiedzi klienta w wątek
    inReplyTo?: string;
    references?: string[];
    fromName?: string;
    fromEmail: string;
    to?: string;
    subject: string;
    text: string;
    html?: string;
    attachments: InboxAttachment[];
    date: Date;
    sentBy?: string;            // e-mail admina, który wysłał odpowiedź
    aiDraft?: string;           // szkic AI w chwili wysyłki: porównanie z wysłanym tekstem pokazuje, jak poprawiamy AI
}

export interface InboxThreadDoc extends Document {
    subject: string;
    customer: { name?: string; email: string; phone?: string; company?: string };
    source: "form" | "email";
    category?: InboxCategory;
    priority: "normal" | "high";
    setByHand: { category?: boolean; priority?: boolean };   // ręczny wybór w panelu ma pierwszeństwo przed AI
    language?: string;
    summary?: string;
    status: InboxStatus;
    unread: boolean;
    ai: {
        status: "idle" | "pending" | "ready" | "failed";
        error?: string;
        confidence?: number;
        requestedAt?: Date;
        generatedAt?: Date;
        instruction?: string;
        suggestion?: string;   // ostatni szkic z AI; trafia do draft tylko, gdy nikt go nie zmienił ręcznie
    };
    draft: { text: string; editedAt?: Date; fromAi: boolean };
    messages: InboxMessage[];
    lastMessageAt: Date;
    lastInboundAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AttachmentSchema = new Schema<InboxAttachment>({
    filename: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, default: "application/octet-stream" },
    size: { type: Number, default: 0 },
}, { _id: true });

const MessageSchema = new Schema<InboxMessage>({
    direction: { type: String, enum: ["in", "out"], required: true },
    source: { type: String, enum: ["form", "email", "panel"], required: true },
    messageId: { type: String, required: true },
    inReplyTo: String,
    references: { type: [String], default: undefined },
    fromName: String,
    fromEmail: { type: String, required: true, lowercase: true, trim: true },
    to: String,
    subject: { type: String, default: "" },
    text: { type: String, default: "" },
    html: String,
    attachments: { type: [AttachmentSchema], default: [] },
    date: { type: Date, default: Date.now },
    sentBy: String,
    aiDraft: String,
});

const InboxThreadSchema = new Schema<InboxThreadDoc>({
    subject: { type: String, default: "(ohne Betreff)" },
    customer: {
        name: String,
        email: { type: String, required: true, lowercase: true, trim: true },
        phone: String,
        company: String,
    },
    source: { type: String, enum: ["form", "email"], required: true },
    category: { type: String, enum: INBOX_CATEGORIES },
    priority: { type: String, enum: ["normal", "high"], default: "normal" },
    setByHand: { category: Boolean, priority: Boolean },
    language: String,
    summary: String,
    status: { type: String, enum: INBOX_STATUSES, default: "new" },
    unread: { type: Boolean, default: true },
    ai: {
        status: { type: String, enum: ["idle", "pending", "ready", "failed"], default: "idle" },
        error: String,
        confidence: Number,
        requestedAt: Date,
        generatedAt: Date,
        instruction: String,
        suggestion: String,
    },
    draft: {
        text: { type: String, default: "" },
        editedAt: Date,
        fromAi: { type: Boolean, default: false },
    },
    messages: { type: [MessageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now },
    lastInboundAt: Date,
}, { timestamps: true });

// Ten sam mail z IMAP nie może wpaść dwa razy (n8n potrafi powtórzyć wywołanie)
InboxThreadSchema.index({ "messages.messageId": 1 }, { unique: true, sparse: true });
InboxThreadSchema.index({ status: 1, lastMessageAt: -1 });
InboxThreadSchema.index({ category: 1, lastMessageAt: -1 });
InboxThreadSchema.index({ "customer.email": 1 });

export default mongoose.model<InboxThreadDoc>("InboxThread", InboxThreadSchema);
