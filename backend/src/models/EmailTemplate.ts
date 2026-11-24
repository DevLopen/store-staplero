import mongoose, { Schema, Document } from "mongoose";

/**
 * Teksty szablonu maila zmienione w panelu (Admin → E-Mail-Vorlagen).
 * Dla szablonów wbudowanych trzymamy tylko zmiany (per język); dla własnych (custom) całą treść.
 */
export interface EmailTemplateDoc extends Document {
    key: string;
    name?: string;
    kind: string;
    custom: boolean;
    baseKey?: string; // szablon, z którego skopiowano (custom)
    content: Record<string, Record<string, any>>; // { de: {...}, en: {...} }
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const EmailTemplateSchema = new Schema<EmailTemplateDoc>(
    {
        key: { type: String, required: true, unique: true, trim: true },
        name: String,
        kind: { type: String, required: true },
        custom: { type: Boolean, default: false },
        baseKey: String,
        content: { type: Schema.Types.Mixed, default: {} },
        updatedBy: String,
    },
    { timestamps: true, minimize: false }
);

export default mongoose.model<EmailTemplateDoc>("EmailTemplate", EmailTemplateSchema);
