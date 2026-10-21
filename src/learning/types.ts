// Kursy v2: Kurs → Rozdział → Temat → Kroki z typem. Każdy tekst dla kursanta to LText,
// niemiecki jest źródłem i wartością zapasową. Kształty `data` muszą pasować do backend/src/models/LearningCourse.ts.

export const LANGS = ["de", "en", "pl", "uk"] as const;
export type Lang = (typeof LANGS)[number];
export type LText = Partial<Record<Lang, string>>;

export interface KeyPoint { k: LText; v: LText }          // Stichwort (pogrubione) + tekst

export interface IntroData { title: LText; text: LText; meta?: LText[]; image?: string }
export interface LearnData {
    title: LText; lead: LText; points: KeyPoint[];
    ordered?: boolean;                                      // numery tylko, gdy kolejność ma znaczenie
    merke?: LText; src?: LText;
    formula?: LText[];                                      // np. Lastmoment = Gewicht × Abstand
    compare?: { label: LText; title: LText; text: LText }[];
}
export interface VideoData { title: LText; url?: string; poster?: string; brief?: LText; length?: LText }
export interface QuestionData {
    title: LText; text?: LText; illustration?: "car-forklift" | "employer-driver";
    layout?: "buttons" | "list";                            // list: długie odpowiedzi jako lista na ekranie
    options: LText[]; correct: number;
    resultTitle?: { right: LText; wrong: LText }; quote?: LText; body: LText; src?: LText; button?: LText;
}
export interface ChoiceItem { q: LText; options: LText[]; correct: number; why: LText }
export interface ChoiceData { title: LText; lead?: LText; items: ChoiceItem[]; allRight: LText; someWrong: LText }
export interface SortItem { t: LText; a: number; why: LText }
export interface SortData { title: LText; lead?: LText; labels: LText[]; items: SortItem[]; allRight: LText; someWrong: LText }
export interface GapData {
    title: LText; lead?: LText;
    sentence: LText;                                        // luki jako {1}..{n}, wypełniane po kolei
    chips: { id: string; text: LText }[];
    answer: string[];                                       // id chipa dla każdej luki
    interchangeable?: number[][];                           // np. [[1,2]]: luki 2 i 3 w dowolnej kolejności
    success: { title: LText; body: LText; src?: LText };
}
export interface CaseCard {
    name: string; look: PersonLook; role: LText; facts: KeyPoint[]; say: LText;
    ok: boolean; why: LText; rule: LText; src?: LText; topic?: string;
}
export interface PersonLook { skin: string; hair: string; top: string; vest?: boolean; beard?: boolean; long?: boolean }
export interface CasesData { title: LText; text: LText; note?: LText; cases: CaseCard[] }
export type SimKind = "turn" | "turn-peds" | "lever" | "capacity" | "position" | "road" | "ramp" | "park" | "check" | "plan" | "exam" | "profile" | "licence";
export interface SimData { sim: SimKind; title: LText; [key: string]: unknown }
export interface HotspotData { title: LText; image: string; points: { x: number; y: number; label: LText; finding: LText; bad?: boolean }[] }
export interface SelfData { title: LText; lead: LText; goals: { code: string; text: LText; short: LText }[] }
export interface SummaryData { title: LText; points: KeyPoint[]; ordered?: boolean }

export interface StepDataByType {
    intro: IntroData; learn: LearnData; video: VideoData; question: QuestionData; choice: ChoiceData;
    sort: SortData; gap: GapData; cases: CasesData; sim: SimData; hotspot: HotspotData; self: SelfData; summary: SummaryData;
}
export type StepType = keyof StepDataByType;
export type Step = { [K in StepType]: { id: string; type: K; data: StepDataByType[K] } }[StepType];

export interface Lesson { id: string; title: LText; durationMin?: number; steps: Step[] }
export interface Chapter { id: string; title: LText; description?: LText; lessons: Lesson[] }
export interface CourseContent { title: LText; description?: LText; chapters: Chapter[] }

/** Tekst w danym języku, z niemieckim jako zapasem. */
export const tx = (t: LText | undefined, lang: Lang) => (t?.[lang]?.trim() ? t[lang]! : t?.de ?? "");
export const fillVars = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
