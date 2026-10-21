import mongoose, { Schema, Document } from "mongoose";

// ─── Learning courses v2 ──────────────────────────────────────────────────────
// Course → Chapter → Lesson → typed Steps. Every learner-facing text is an LText
// ({ de, en, pl, uk }); German is the source language and the fallback.
// Editors work on `draft`; learners only ever read `published` (a snapshot made on publish).

export const LANGS = ["de", "en", "pl", "uk"] as const;
export type Lang = (typeof LANGS)[number];
export type LText = Partial<Record<Lang, string>>;

export const STEP_TYPES = [
    "intro",     // topic opener: title, text, meta line, optional image
    "learn",     // learning card: lead, key points, Merke, source
    "video",     // own video or placeholder with filming brief
    "question",  // opening question with resolution and quote
    "choice",    // one or more questions with options and explanation
    "sort",      // statements assigned to 2–3 groups one after another
    "gap",       // sentence with blanks filled from word chips
    "cases",     // person cards: may this person drive?
    "sim",       // ready-made simulation from the widget library
    "hotspot",   // own image with check points
    "self",      // self-assessment 1–5 per goal
    "summary",   // key takeaways
] as const;
export type StepType = (typeof STEP_TYPES)[number];

export interface LessonStep {
    id: string;
    type: StepType;
    data: Record<string, unknown>;   // shape depends on type, see frontend src/learning/types.ts
}

export interface Lesson {
    id: string;
    title: LText;
    durationMin?: number;
    steps: LessonStep[];
}

export interface Chapter {
    id: string;
    title: LText;
    description?: LText;
    lessons: Lesson[];
}

export interface CourseContent {
    title: LText;
    description?: LText;
    chapters: Chapter[];
}

export interface PublishedContent extends CourseContent {
    version: number;
    publishedAt: Date;
}

export interface LearningCourseDoc extends Document {
    slug: string;
    languages: Lang[];
    coverUrl?: string;
    draft: CourseContent;
    revision: number;              // bumped on every draft save, used to detect parallel edits
    draftChangedAt: Date;
    published?: PublishedContent;
    createdAt: Date;
    updatedAt: Date;
}

const LearningCourseSchema = new Schema<LearningCourseDoc>(
    {
        slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
        languages: { type: [String], enum: LANGS, default: ["de", "en", "pl", "uk"] },
        coverUrl: String,
        // content trees are validated in utils/learningContent.ts, stored as plain objects
        draft: { type: Schema.Types.Mixed, required: true },
        revision: { type: Number, default: 0 },
        draftChangedAt: { type: Date, default: Date.now },
        published: { type: Schema.Types.Mixed },
    },
    { timestamps: true, minimize: false }
);

export default mongoose.model<LearningCourseDoc>("LearningCourse", LearningCourseSchema);
