import mongoose, { Schema, Document } from "mongoose";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ProductType = "online" | "normal";
export type ProductStatus = "draft" | "active";

export interface LocalizedText {
  de: string;
  en: string;
  uk: string;
  pl: string;
}

export interface LocalizedList {
  de: string[];
  en: string[];
  uk: string[];
  pl: string[];
}

export interface ProductDoc extends Document {
  slug: string;
  type: ProductType;

  title: LocalizedText;
  shortDescription: LocalizedText;
  description: LocalizedText;
  benefits: LocalizedList;

  thumbnailUrl?: string;
  gallery: string[];

  price: number;            // cena regularna, netto
  promoPrice?: number;       // cena promocyjna, netto
  isPromoActive: boolean;
  priceUnit: "person" | "monthly";

  status: ProductStatus;
  featured: boolean;
  order: number;

  // online (type === "online")
  courseId?: string;

  // normal (type === "normal") — praktyczny lub pakiet teoria+praktyka
  locationIds: string[];
  includesOnlineAccess: boolean;
  linkedCourseId?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Schemas ────────────────────────────────────────────────────────────────────

const LocalizedTextSchema = new Schema<LocalizedText>(
  {
    de: { type: String, default: "" },
    en: { type: String, default: "" },
    uk: { type: String, default: "" },
    pl: { type: String, default: "" },
  },
  { _id: false }
);

const LocalizedListSchema = new Schema<LocalizedList>(
  {
    de: { type: [String], default: [] },
    en: { type: [String], default: [] },
    uk: { type: [String], default: [] },
    pl: { type: [String], default: [] },
  },
  { _id: false }
);

const ProductSchema = new Schema<ProductDoc>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    type: { type: String, enum: ["online", "normal"], required: true },

    title: { type: LocalizedTextSchema, required: true },
    shortDescription: { type: LocalizedTextSchema, default: () => ({}) },
    description: { type: LocalizedTextSchema, default: () => ({}) },
    benefits: { type: LocalizedListSchema, default: () => ({}) },

    thumbnailUrl: String,
    gallery: { type: [String], default: [] },

    price: { type: Number, required: true, min: 0 },
    promoPrice: { type: Number, min: 0 },
    isPromoActive: { type: Boolean, default: false },
    priceUnit: { type: String, enum: ["person", "monthly"], default: "person" },

    status: { type: String, enum: ["draft", "active"], default: "draft" },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },

    courseId: String,

    locationIds: { type: [String], default: [] },
    includesOnlineAccess: { type: Boolean, default: false },
    linkedCourseId: String,
  },
  { timestamps: true }
);

ProductSchema.index({ status: 1 });
ProductSchema.index({ featured: 1 });

// ✅ Walidacja spójności promocji
ProductSchema.pre("validate", function (this: ProductDoc, next) {
  if (this.isPromoActive) {
    if (this.promoPrice == null) {
      return next(new Error("Cena promocyjna jest wymagana, gdy promocja jest aktywna"));
    }
    if (this.promoPrice >= this.price) {
      return next(new Error("Cena promocyjna musi być niższa niż cena regularna"));
    }
  }
  next();
});

export default mongoose.model<ProductDoc>("Product", ProductSchema);
