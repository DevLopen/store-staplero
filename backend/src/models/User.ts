import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface PurchasedCourse {
    courseId: string;
    purchaseDate: Date;
    expiresAt: Date;
    status: "active" | "expired";
    orderNumber: string;
}

export interface UserDoc extends Document {
    name: string;
    email: string;
    password: string;
    isAdmin: boolean;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    purchasedCourses: PurchasedCourse[];
    createdAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const PurchasedCourseSchema = new Schema<PurchasedCourse>({
    courseId: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ["active", "expired"], default: "active" },
    orderNumber: { type: String, required: true },
});

const UserSchema = new Schema<UserDoc>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isAdmin: { type: Boolean, default: false },
        phone: String,
        address: String,
        city: String,
        postalCode: String,
        purchasedCourses: [PurchasedCourseSchema],
    },
    { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<UserDoc>("User", UserSchema);