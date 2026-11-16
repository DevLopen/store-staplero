import mongoose, { Schema, Document } from "mongoose";

/**
 * Jedno pytanie do Lernhilfe (asystent w lekcji kursu v2) z odpowiedzią.
 * Służy do dziennego limitu na kursanta i do podglądu w panelu admina: które karty kursanci rozumieją najsłabiej.
 */
export interface TutorQuestionDoc extends Document {
    userId: string;
    courseId: string;
    lessonId: string;
    stepId: string;
    lang: string;
    /** zaznaczony fragment karty (może być pusty, gdy kursant pyta o całą kartę) */
    selection?: string;
    /** pytanie wpisane albo wybrane z podpowiedzi (puste przy samym zaznaczeniu) */
    question?: string;
    /** odpowiedź w formie, w jakiej dostał ją kursant (JSON z polami paragraphs, example, check …) */
    answer?: Record<string, unknown>;
    inScope?: boolean;
    /** odpowiedź na pytanie sprawdzające: true = dobrze, false = źle, brak = nie odpowiedział */
    checkOk?: boolean;
    failed?: boolean;
    admin?: boolean;
    createdAt: Date;
}

const TutorQuestionSchema = new Schema<TutorQuestionDoc>(
    {
        userId: { type: String, required: true },
        courseId: { type: String, required: true },
        lessonId: { type: String, required: true },
        stepId: { type: String, required: true },
        lang: { type: String, default: "de" },
        selection: String,
        question: String,
        answer: { type: Schema.Types.Mixed },
        inScope: Boolean,
        checkOk: Boolean,
        failed: Boolean,
        admin: Boolean,
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);
TutorQuestionSchema.index({ userId: 1, createdAt: -1 });
TutorQuestionSchema.index({ courseId: 1, createdAt: -1 });

export default mongoose.model<TutorQuestionDoc>("TutorQuestion", TutorQuestionSchema);
