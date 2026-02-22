import mongoose, { Schema, Document } from "mongoose";

// ─── Content Block Types ──────────────────────────────────────────────────────

export type BlockType =
  | "richtext"
  | "video"
  | "image"
  | "model3d"
  | "embed"
  | "callout"
  | "divider"
  | "interactive";

export type CalloutStyle = "info" | "warning" | "danger" | "success";
export type InteractiveSubtype = "stability-sim" | "drag-order" | "hotspot" | "360-tour";

export interface ContentBlock {
  id: string;
  type: BlockType;
  order: number;
  // richtext
  richtextData?: string; // TipTap JSON string
  // video
  videoUrl?: string;
  // image
  imageUrl?: string;
  imageCaption?: string;
  // model3d
  modelUrl?: string;
  modelLabel?: string;
  modelAnnotations?: { id: string; label: string; description: string; position: [number, number, number] }[];
  // embed (Sketchfab, H5P, iframes)
  embedUrl?: string;
  embedHeight?: number;
  // callout
  calloutStyle?: CalloutStyle;
  calloutText?: string;
  calloutTitle?: string;
  // interactive
  interactiveSubtype?: InteractiveSubtype;
  interactiveData?: Record<string, unknown>;
}

// ─── Quiz Question Types ──────────────────────────────────────────────────────

export type QuestionType = "single" | "multi" | "truefalse" | "drag-order" | "hotspot";

export interface HotspotPoint {
  id: string;
  x: number; // percent 0-100
  y: number; // percent 0-100
  label: string;
  isHazard: boolean;
}

export interface DragOrderItem {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  imageUrl?: string;
  explanation?: string;
  // single / multi
  options?: string[];
  correctAnswer?: number;      // single: index
  correctAnswers?: number[];   // multi: array of indices
  // truefalse
  correctBool?: boolean;
  // drag-order
  items?: DragOrderItem[];
  correctOrder?: string[];     // array of DragOrderItem ids in correct order
  // hotspot
  hotspotImageUrl?: string;
  hotspots?: HotspotPoint[];
}

export interface Quiz {
  id: string;
  chapterId?: string;
  title: string;
  description?: string;
  passingScore: number;        // 0-100
  timeLimitSeconds?: number;   // optional timer
  isFinalQuiz?: boolean;
  questions: Question[];
}

// ─── Topic / Chapter / Course ─────────────────────────────────────────────────

export interface Topic {
  id: string;
  title: string;
  blocks: ContentBlock[];
  duration?: string;           // estimated read/watch time e.g. "10 min"
  order: number;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  order: number;
  topics: Topic[];
  quiz?: Quiz;
  status?: "blocked" | "pending" | "complete";
}

export interface CourseDoc extends Document {
  title: string;
  description: string;
  thumbnailUrl?: string;
  certificateEnabled: boolean;
  chapters: Chapter[];
  finalQuiz?: Quiz;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ContentBlockSchema = new Schema<ContentBlock>({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ["richtext", "video", "image", "model3d", "embed", "callout", "divider", "interactive"],
    required: true,
  },
  order: { type: Number, required: true },
  richtextData: String,
  videoUrl: String,
  imageUrl: String,
  imageCaption: String,
  modelUrl: String,
  modelLabel: String,
  modelAnnotations: [
    {
      id: String,
      label: String,
      description: String,
      position: [Number],
    },
  ],
  embedUrl: String,
  embedHeight: Number,
  calloutStyle: { type: String, enum: ["info", "warning", "danger", "success"] },
  calloutText: String,
  calloutTitle: String,
  interactiveSubtype: {
    type: String,
    enum: ["stability-sim", "drag-order", "hotspot", "360-tour"],
  },
  interactiveData: { type: Schema.Types.Mixed },
});

const HotspotPointSchema = new Schema<HotspotPoint>({
  id: String,
  x: Number,
  y: Number,
  label: String,
  isHazard: Boolean,
});

const DragOrderItemSchema = new Schema<DragOrderItem>({
  id: String,
  label: String,
});

const QuestionSchema = new Schema<Question>({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ["single", "multi", "truefalse", "drag-order", "hotspot"],
    default: "single",
  },
  question: { type: String, required: true },
  imageUrl: String,
  explanation: String,
  options: [String],
  correctAnswer: Number,
  correctAnswers: [Number],
  correctBool: Boolean,
  items: [DragOrderItemSchema],
  correctOrder: [String],
  hotspotImageUrl: String,
  hotspots: [HotspotPointSchema],
});

const QuizSchema = new Schema<Quiz>({
  id: { type: String, required: true },
  chapterId: String,
  title: { type: String, required: true },
  description: String,
  passingScore: { type: Number, required: true, min: 0, max: 100 },
  timeLimitSeconds: Number,
  isFinalQuiz: { type: Boolean, default: false },
  questions: [QuestionSchema],
});

const TopicSchema = new Schema<Topic>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  blocks: [ContentBlockSchema],
  duration: String,
  order: { type: Number, required: true },
});

const ChapterSchema = new Schema<Chapter>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  order: { type: Number, required: true },
  topics: [TopicSchema],
  quiz: QuizSchema,
  status: {
    type: String,
    enum: ["blocked", "pending", "complete"],
    default: "pending",
  },
});

const CourseSchema = new Schema<CourseDoc>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    thumbnailUrl: String,
    certificateEnabled: { type: Boolean, default: true },
    chapters: [ChapterSchema],
    finalQuiz: QuizSchema,
  },
  { timestamps: true }
);

// Indexes
CourseSchema.index({ title: "text" });

export default mongoose.model<CourseDoc>("Course", CourseSchema);
