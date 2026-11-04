import mongoose, { Schema, Document } from "mongoose";

/** Postęp kursanta w katalogu pytań: ostatnia odpowiedź na każde pytanie (dobrze/źle) i liczba prób. */
export interface BankAnswer { ok: boolean; n: number; at: Date }
/** Wynik testu zrobionego przez kursanta (losowe pytania z katalogu, ocena dopiero na końcu). */
export interface BankTestResult { at: Date; n: number; right: number; passed: boolean; topic?: string }
export interface BankProgressDoc extends Document {
    userId: string;
    bankId: string;
    answers: Record<string, BankAnswer>;
    tests?: BankTestResult[];
    updatedAt: Date;
}

const BankProgressSchema = new Schema<BankProgressDoc>({
    userId: { type: String, required: true },
    bankId: { type: String, required: true },
    answers: { type: Schema.Types.Mixed, default: {} },
    tests: { type: [Schema.Types.Mixed], default: undefined },
}, { timestamps: true, minimize: false });

BankProgressSchema.index({ userId: 1, bankId: 1 }, { unique: true });

export default mongoose.model<BankProgressDoc>("BankProgress", BankProgressSchema);
