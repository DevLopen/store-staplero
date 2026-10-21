import { nanoid } from "nanoid";
import { CourseContent, LANGS, Lang, LText, STEP_TYPES } from "../models/LearningCourse";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isLText = (v: unknown): v is LText =>
    isObj(v) && Object.keys(v).length > 0 && Object.keys(v).every(k => (LANGS as readonly string[]).includes(k) && typeof v[k] === "string");

export const emptyContent = (title: string): CourseContent => ({
    title: { de: title },
    description: { de: "" },
    chapters: [],
});

/** Structural check of a draft before saving: ids present and unique, known step types, titles are LText. */
export function validateContent(c: unknown): string[] {
    const errs: string[] = [];
    if (!isObj(c)) return ["Inhalt fehlt"];
    if (!isLText(c.title)) errs.push("Kurstitel fehlt");
    if (!Array.isArray(c.chapters)) return [...errs, "Kapitel fehlen"];
    const ids = new Set<string>();
    const useId = (id: unknown, where: string) => {
        if (typeof id !== "string" || !id) errs.push(`${where}: id fehlt`);
        else if (ids.has(id)) errs.push(`${where}: id ${id} doppelt`);
        else ids.add(id);
    };
    c.chapters.forEach((ch: any, ci: number) => {
        const w = `Kapitel ${ci + 1}`;
        useId(ch?.id, w);
        if (!isLText(ch?.title)) errs.push(`${w}: Titel fehlt`);
        if (!Array.isArray(ch?.lessons)) { errs.push(`${w}: Themen fehlen`); return; }
        ch.lessons.forEach((l: any, li: number) => {
            const wl = `${w}, Thema ${li + 1}`;
            useId(l?.id, wl);
            if (!isLText(l?.title)) errs.push(`${wl}: Titel fehlt`);
            if (!Array.isArray(l?.steps)) { errs.push(`${wl}: Schritte fehlen`); return; }
            l.steps.forEach((s: any, si: number) => {
                const ws = `${wl}, Schritt ${si + 1}`;
                useId(s?.id, ws);
                if (!(STEP_TYPES as readonly string[]).includes(s?.type)) errs.push(`${ws}: unbekannter Typ ${s?.type}`);
                if (!isObj(s?.data)) errs.push(`${ws}: Daten fehlen`);
            });
        });
    });
    return errs;
}

/** Walk every LText in a subtree. */
function eachText(node: unknown, fn: (t: LText) => void) {
    if (Array.isArray(node)) return node.forEach(n => eachText(n, fn));
    if (!isObj(node)) return;
    if (isLText(node) && "de" in node) return fn(node);
    Object.values(node).forEach(v => eachText(v, fn));
}

/** Share of German texts that have a translation, per language (0–100). */
export function translationStatus(c: CourseContent): Record<Lang, number> {
    let total = 0;
    const done: Record<Lang, number> = { de: 0, en: 0, pl: 0, uk: 0 };
    eachText(c, t => {
        if (!t.de?.trim()) return;
        total++;
        LANGS.forEach(l => { if (t[l]?.trim()) done[l]++; });
    });
    return Object.fromEntries(LANGS.map(l => [l, total ? Math.round(done[l] / total * 100) : 100])) as Record<Lang, number>;
}

/** Course structure without step contents, for overview pages. */
export function outline(c: CourseContent) {
    return {
        title: c.title,
        description: c.description,
        chapters: c.chapters.map(ch => ({
            id: ch.id,
            title: ch.title,
            description: ch.description,
            lessons: ch.lessons.map(l => ({ id: l.id, title: l.title, durationMin: l.durationMin, stepCount: l.steps.length })),
        })),
    };
}

export const findLesson = (c: CourseContent, lessonId: string) => {
    for (const ch of c.chapters) {
        const lesson = ch.lessons.find(l => l.id === lessonId);
        if (lesson) return { chapter: ch, lesson };
    }
    return null;
};

export const newId = (prefix: string) => `${prefix}_${nanoid(10)}`;
