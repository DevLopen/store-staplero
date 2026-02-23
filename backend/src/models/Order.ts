import mongoose, { Schema, Document } from "mongoose";

export interface OrderItem {
    courseId?: string;
    courseName: string;
    price: number;
    type: "online" | "practical" | "practical-addon";
}

export interface PracticalCourseDetails {
    locationId: string;
    locationName: string;
    locationAddress: string;
    startDate: string;
    endDate: string;
    time: string;
    dateId: string;
    availableSpots: number;
    wantsPlasticCard: boolean;
    plasticCardPrice?: number;
}

export interface UserDetails {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
}

export interface OrderDoc extends Document {
    userId: string;
    orderNumber: string;
    type: "online" | "practical";
    items: OrderItem[];
    totalAmount: number;
    status: "pending" | "paid" | "cancelled" | "expired";
    paymentIntentId?: string;
    stripeSessionId?: string;
    userDetails: UserDetails;
    practicalCourseDetails?: PracticalCourseDetails;
    createdAt: Date;
    paidAt?: Date;
    expiresAt?: Date; // Dla kursów online - 30 dni od paidAt
    invoiceId: string,
    invoiceNumber: string,
    invoicePdfUrl?: string,
    invoiceCreatedAt: Date,
}

const OrderItemSchema = new Schema<OrderItem>({
    courseId: String,
    courseName: { type: String, required: true },
    price: { type: Number, required: true },
    type: { type: String, enum: ["online", "practical", "practical-addon"], required: true },
});

const PracticalCourseDetailsSchema = new Schema<PracticalCourseDetails>({
    locationId: { type: String, required: true },
    locationName: { type: String, required: true },
    locationAddress: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    time: { type: String, required: true },
    dateId: { type: String },   // ← POPRAWKA: pole dateId musi być w schemie
    availableSpots: { type: Number, required: true },
    wantsPlasticCard: { type: Boolean, default: false },
    plasticCardPrice: Number,
});

const UserDetailsSchema = new Schema<UserDetails>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    address: String,
    city: String,
    postalCode: String,
});

const OrderSchema = new Schema<OrderDoc>(
    {
        userId: { type: String, required: true },
        orderNumber: { type: String, unique: true },
        type: { type: String, enum: ["online", "practical"], required: true },
        items: [OrderItemSchema],
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ["pending", "paid", "cancelled", "expired"],
            default: "pending",
        },
        paymentIntentId: String,
        stripeSessionId: String,
        userDetails: { type: UserDetailsSchema, required: true },
        practicalCourseDetails: PracticalCourseDetailsSchema,
        paidAt: Date,
        expiresAt: Date,
    },
    { timestamps: true }
);

// Generate unique order number
OrderSchema.pre("validate", async function (next) {
    if (!this.orderNumber) {
        const count = await mongoose.model("Order").countDocuments();
        this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
    }
    next();
});

export default mongoose.model<OrderDoc>("Order", OrderSchema);