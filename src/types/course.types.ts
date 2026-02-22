// ─── Content Blocks ───────────────────────────────────────────────────────────

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

export interface ModelAnnotation {
  id: string;
  label: string;
  description: string;
  position: [number, number, number];
}

export interface HotspotPoint {
  id: string;
  x: number;
  y: number;
  label: string;
  isHazard?: boolean; // only in admin
}

export interface DragOrderItem {
  id: string;
  label: string;
}

export interface ContentBlock {
  id: string;
  type: BlockType;
  order: number;
  width?: 'full' | 'half'; // Layout support
  // richtext
  richtextData?: string;
  // video
  videoUrl?: string;
  // image
  imageUrl?: string;
  imageCaption?: string;
  // model3d
  modelUrl?: string;
  modelLabel?: string;
  modelAnnotations?: ModelAnnotation[];
  // embed
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

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export type QuestionType = "single" | "multi" | "truefalse" | "drag-order" | "hotspot";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  imageUrl?: string;
  explanation?: string;
  // single / multi
  options?: string[];
  // drag-order
  items?: DragOrderItem[];
  // hotspot (no isHazard)
  hotspotImageUrl?: string;
  hotspots?: HotspotPoint[];
}

export interface Quiz {
  id: string;
  chapterId?: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimitSeconds?: number;
  isFinalQuiz?: boolean;
  questions: QuizQuestion[];
}

// ─── Topic / Chapter / Course ─────────────────────────────────────────────────

export interface Topic {
  id: string;
  title: string;
  blocks: ContentBlock[];
  duration?: string;
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

export interface Course {
  _id: string;
  id?: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  certificateEnabled: boolean;
  chapters: Chapter[];
  finalQuiz?: Quiz;
  createdAt?: string;
  updatedAt?: string;
}
