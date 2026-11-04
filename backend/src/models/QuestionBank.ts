import mongoose, { Schema, Document } from "mongoose";
import { LText } from "./LearningCourse";

/**
 * Katalog pytań do nauki z odpowiedziami (np. pytania klienta FFZ-001…092), sprzedawany jako osobny produkt online.
 * Dostęp jak do kursu: UserCourse z courseId = _id katalogu. Pytania są edytowane w panelu admina pojedynczo.
 */
export interface BankMedia { type: "image" | "video"; src: string; name?: string }
export interface BankQuestion {
    id: string;              // np. "FFZ-014", stały, nadawany przy tworzeniu
    topic: string;           // klucz tematu (moduł kursu), np. "ch_stand"
    q: LText;
    o: LText[];              // odpowiedzi (puste przy odpowiedzi liczbowej)
    c: number[];             // indeksy poprawnych odpowiedzi; więcej niż jeden = wielokrotny wybór
    num?: number;            // odpowiedź liczbowa do wpisania
    unit?: string;
    media?: BankMedia;
    hidden?: boolean;        // ukryte: nie trafia do nauki
    wait?: string;           // czeka na brakujący materiał (np. zdjęcie), nie trafia do nauki
    updatedAt?: Date;
}
export interface BankTopic { key: string; title: LText }

export interface QuestionBankDoc extends Document {
    slug: string;
    title: LText;
    description?: LText;
    topics: BankTopic[];
    questions: BankQuestion[];
    createdAt: Date;
    updatedAt: Date;
}

const LTextSchema = { type: Schema.Types.Mixed, default: {} };
const QuestionSchema = new Schema<BankQuestion>({
    id: { type: String, required: true },
    topic: { type: String, required: true },
    q: LTextSchema,
    o: { type: [Schema.Types.Mixed] as any, default: [] },
    c: { type: [Number], default: [] },
    num: Number,
    unit: String,
    media: { type: { type: String, enum: ["image", "video"] }, src: String, name: String },
    hidden: { type: Boolean, default: false },
    wait: String,
    updatedAt: Date,
}, { _id: false });

const QuestionBankSchema = new Schema<QuestionBankDoc>({
    slug: { type: String, required: true, unique: true },
    title: LTextSchema,
    description: LTextSchema,
    topics: { type: [{ key: String, title: Schema.Types.Mixed, _id: false }], default: [] },
    questions: { type: [QuestionSchema], default: [] },
}, { timestamps: true, minimize: false });

export default mongoose.model<QuestionBankDoc>("QuestionBank", QuestionBankSchema);
