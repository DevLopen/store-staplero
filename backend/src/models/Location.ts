import mongoose, { Schema, Document } from "mongoose";

export interface CourseDate {
    id: string;
    startDate: string;
    endDate: string;
    time: string;
    availableSpots: number;
}

export interface LocationDoc extends Document {
    city: string;
    address: string;
    isActive: boolean;
    price: number;
    dates: CourseDate[];
}

const CourseDateSchema = new Schema<CourseDate>({
    id: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    time: { type: String, required: true },
    availableSpots: { type: Number, required: true }
});

const LocationSchema = new Schema<LocationDoc>({
    city: { type: String, required: true },
    address: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    price: { type: Number, required: true },
    dates: [CourseDateSchema]
}, { timestamps: true });

export default mongoose.model<LocationDoc>("Location", LocationSchema);