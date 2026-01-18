import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
    userId: string;
    userEmail: string;
    userName: string;
    items: any[];
    total: number;
    status: 'pending' | 'paid' | 'completed' | 'cancelled';
    createdAt: Date;
    paidAt?: Date;
    customerInfo?: any;
}

const OrderSchema: Schema = new Schema({
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    items: { type: Array, required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending','paid','completed','cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
    customerInfo: { type: Object }
});

export default mongoose.model<IOrder>("Order", OrderSchema);
