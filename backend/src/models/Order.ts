import mongoose, { Schema, Document } from "mongoose";

export interface OrderItem {
    courseId?: string;
    courseName: string;
    price: number;      // cena jednostkowa (brutto)
    quantity: number;   // liczba sztuk / uczestników (domyślnie 1)
    type: "online" | "practical" | "practical-addon";
}

export interface AdditionalParticipant {
    firstName?: string;
    lastName?: string;
    name: string; // pełne imię i nazwisko (dla starych rekordów tylko to pole)
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
    // Osoby zapisane na kurs poza główną osobą kupującą (max 5, walidowane w checkoutController)
    additionalParticipants: AdditionalParticipant[];
}

export interface UserDetails {
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
}

// Adres do faktury, jeśli inny niż adres podany przy koncie/zamówieniu
export interface BillingAddress {
    isCompany?: boolean;
    name?: string;          // Privatperson: pełne imię i nazwisko / Firma: osoba kontaktowa (opcjonalnie)
    company?: string;      // wymagane, gdy isCompany === true
    vatId?: string;        // USt-IdNr. — wymagane, gdy isCompany === true
    address: string;
    city: string;
    postalCode: string;
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
    billingAddressDifferent?: boolean;
    billingAddress?: BillingAddress;
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
    quantity: { type: Number, required: true, default: 1, min: 1 },
    type: { type: String, enum: ["online", "practical", "practical-addon"], required: true },
});

const AdditionalParticipantSchema = new Schema<AdditionalParticipant>(
    {
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        name: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const PracticalCourseDetailsSchema = new Schema<PracticalCourseDetails>({
    locationId: { type: String, required: true },
    locationName: { type: String, required: true },
    locationAddress: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    time: { type: String, required: true },
    dateId: { type: String },   // ← POPRAWKA: pole dateId musi być w schemie
    availableSpots: { type: Number, required: true },
    additionalParticipants: { type: [AdditionalParticipantSchema], default: [] },
});

const UserDetailsSchema = new Schema<UserDetails>({
    name: { type: String, required: true },
    firstName: String,
    lastName: String,
    email: { type: String, required: true },
    phone: String,
    address: String,
    city: String,
    postalCode: String,
});

const BillingAddressSchema = new Schema<BillingAddress>(
    {
        isCompany: { type: Boolean, default: false },
        name: { type: String, default: "" },
        company: String,
        vatId: String,
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
    },
    { _id: false }
);

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
        billingAddressDifferent: { type: Boolean, default: false },
        billingAddress: BillingAddressSchema,
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