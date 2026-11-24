import mongoose, { Schema, Document } from "mongoose";

export interface UserCourseDoc extends Document {
    userId: string;
    courseId: string;
    purchaseDate: Date;
    expiresAt: Date;
    status: "active" | "expired";
    orderNumber: string;
    seatId?: string; // miejsce (OrderSeat), z którego pochodzi dostęp; brak = dostęp sprzed modelu miejsc
    revokedAt?: Date; // dostęp odebrany przez admina (Zugang entziehen / Platz freigeben); status = "expired"
    createdAt: Date;
}

const UserCourseSchema = new Schema<UserCourseDoc>(
    {
        userId: { type: String, required: true },
        courseId: { type: String, required: true },
        purchaseDate: { type: Date, required: true },
        expiresAt: { type: Date, required: true },
        status: {
            type: String,
            enum: ["active", "expired"],
            default: "active",
        },
        orderNumber: { type: String, required: true },
        seatId: { type: String },
        revokedAt: { type: Date },
    },
    { timestamps: true }
);

// Compound index to prevent duplicates
UserCourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Auto-update status based on expiresAt
UserCourseSchema.pre("save", function (next) {
    if (new Date() > this.expiresAt) {
        this.status = "expired";
    }
    next();
});

export const UserCourse = mongoose.model<UserCourseDoc>(
    "UserCourse",
    UserCourseSchema
);