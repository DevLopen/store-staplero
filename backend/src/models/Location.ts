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
    // ✅ Method signatures
    isDateAvailable(dateId: string): boolean;
    bookSpot(dateId: string): boolean;
    cancelSpot(dateId: string): boolean;
}

const CourseDateSchema = new Schema<CourseDate>({
    id: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    time: { type: String, required: true },
    availableSpots: {
        type: Number,
        required: true,
        min: [0, 'Available spots cannot be negative'],
        default: 10,
        validate: {
            validator: Number.isInteger,
            message: 'Available spots must be an integer'
        }
    }
});

const LocationSchema = new Schema<LocationDoc>({
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
        minlength: [2, 'City name must be at least 2 characters']
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
        minlength: [5, 'Address must be at least 5 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    dates: {
        type: [CourseDateSchema],
        validate: {
            validator: function(dates: CourseDate[]) {
                const ids = dates.map((d: CourseDate) => d.id);
                return ids.length === new Set(ids).size;
            },
            message: 'Duplicate date IDs are not allowed'
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ✅ Index for faster queries
LocationSchema.index({ isActive: 1 });
LocationSchema.index({ 'dates.id': 1 });

// ✅ Virtual for active dates
LocationSchema.virtual('activeDates').get(function(this: LocationDoc) {
    return this.dates.filter((date: CourseDate) => date.availableSpots > 0);
});

// ✅ Method to check if a date is available
LocationSchema.methods.isDateAvailable = function(this: LocationDoc, dateId: string): boolean {
    const date = this.dates.find((d: CourseDate) => d.id === dateId);
    return date ? date.availableSpots > 0 : false;
};

// ✅ Method to decrement available spots
LocationSchema.methods.bookSpot = function(this: LocationDoc, dateId: string): boolean {
    const date = this.dates.find((d: CourseDate) => d.id === dateId);
    if (date && date.availableSpots > 0) {
        date.availableSpots--;
        return true;
    }
    return false;
};

// ✅ Method to increment available spots (cancellation)
LocationSchema.methods.cancelSpot = function(this: LocationDoc, dateId: string): boolean {
    const date = this.dates.find((d: CourseDate) => d.id === dateId);
    if (date) {
        date.availableSpots++;
        return true;
    }
    return false;
};

// ✅ Pre-save validation
LocationSchema.pre('save', function(this: LocationDoc, next) {
    // Validate date ranges
    this.dates.forEach((date: CourseDate) => {
        const start = new Date(date.startDate);
        const end = new Date(date.endDate);

        if (end < start) {
            next(new Error('End date must be after start date'));
            return;
        }
    });
    next();
});

export default mongoose.model<LocationDoc>("Location", LocationSchema);