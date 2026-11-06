import mongoose, { Schema, Document } from "mongoose";

/** Ustawienia skrzynki w panelu, np. opis stylu odpowiedzi (key "style"), który n8n dokleja do promptu. */
export interface InboxSettingDoc extends Document {
    key: string;
    text: string;
    updatedBy?: string;
    updatedAt: Date;
}

const InboxSettingSchema = new Schema<InboxSettingDoc>({
    key: { type: String, required: true, unique: true },
    text: { type: String, default: "" },
    updatedBy: String,
}, { timestamps: true });

export default mongoose.model<InboxSettingDoc>("InboxSetting", InboxSettingSchema);
