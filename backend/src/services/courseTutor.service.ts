/**
 * Lernhilfe: wyjaśnia kursantowi fragment lekcji kursu v2, którego nie rozumie.
 * Model dostaje wyłącznie treść tej lekcji (z bazy, nie z przeglądarki) bez kroków testowych,
 * więc nie zna odpowiedzi z testu modułu ani egzaminu. Wzór: korepetytor notatek w StudyScan.
 */
import OpenAI from "openai";
import { Lang, LANGS, LessonStep } from "../models/LearningCourse";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
export const TUTOR_MODEL = process.env.TUTOR_AI_MODEL || process.env.INBOX_AI_MODEL || "gpt-5.4-mini";
export const TUTOR_DAILY_LIMIT = Math.max(1, Number(process.env.TUTOR_DAILY_LIMIT) || 30);

/** Kroki testu: test modułu (choice z `gate`) i egzamin końcowy (sim `final`). Tu Lernhilfe jest wyłączona. */
export const isTestStep = (st: LessonStep | undefined) =>
    !!st && ((st.type === "choice" && !!(st.data as any)?.gate) || (st.type === "sim" && (st.data as any)?.sim === "final"));

const LANG_NAME: Record<Lang, string> = { de: "Deutsch", en: "Englisch", pl: "Polnisch", uk: "Ukrainisch" };

const isLText = (v: unknown): v is Record<string, string> =>
    !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 0 &&
    Object.entries(v).every(([k, s]) => (LANGS as readonly string[]).includes(k) && typeof s === "string");
const plain = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/** Wszystkie teksty kroku w języku kursanta (DE jako zapas), w kolejności z danych. */
function stepTexts(data: unknown, lang: Lang, out: string[] = []): string[] {
    if (isLText(data)) { const s = plain(data[lang] || data.de || ""); if (s) out.push(s); return out; }
    if (Array.isArray(data)) { for (const v of data) stepTexts(v, lang, out); return out; }
    if (data && typeof data === "object") for (const [k, v] of Object.entries(data)) if (k !== "correct") stepTexts(v, lang, out);
    return out;
}

export const stepTitle = (st: LessonStep, lang: Lang = "de") => {
    const t = (st.data as any)?.title;
    return isLText(t) ? plain(t[lang] || t.de || "") : st.type;
};

/** Treść lekcji dla modelu: karty po kolei, bez kroków testowych, z zaznaczoną aktualną kartą. */
export function lessonContext(steps: LessonStep[], currentId: string, lang: Lang) {
    const cards: string[] = [];
    let current = "";
    steps.forEach((st, i) => {
        if (isTestStep(st)) return;
        const txt = stepTexts(st.data, lang).join("\n").slice(0, 2500);
        if (!txt) return;
        const label = `[Karte ${i + 1}${st.id === currentId ? ", AKTUELLE KARTE" : ""}]`;
        cards.push(`${label}\n${txt}`);
        if (st.id === currentId) current = txt;
    });
    return { lesson: cards.join("\n\n").slice(0, 14000), current };
}

const SYSTEM = `Du bist die Lernhilfe im Online-Theoriekurs für den Staplerschein von STAPLERO (Ausbildung von Gabelstaplerfahrern nach DGUV Vorschrift 68 und DGUV Grundsatz 308-001).
Ein Kursant versteht etwas in der aktuellen Lektion nicht. Du erklärst es ihm so einfach wie möglich.

REGELN
- Grundlage ist nur die LEKTION unten. Nenne keine Zahlen, Grenzwerte, Paragraphen, Normen oder Regeln, die nicht in der Lektion stehen. Alltagsvergleiche zur Veranschaulichung sind erlaubt, neue Vorschriften nicht. Zahlen, Faustregeln und Beispiele, die in der Lektion stehen, sollst du verwenden, wenn sie helfen.
- Kurz: 1 bis 3 kurze Absätze, zusammen höchstens 80 Wörter. Kein Beispiel in den Absätzen, dafür gibt es das Feld example. Kurze Sätze und einfache Wörter, auch für Menschen, die die Sprache als Zweitsprache sprechen.
- Markiere die 1 bis 3 wichtigsten Begriffe mit **fett**. Keine Listen, keine Überschriften, keine Emojis, keine Gedankenstriche (– oder —).
- Verwende dieselben Fachbegriffe wie die Lektion in der Sprache des Kursanten. Sprich ihn mit „du“ an (in anderen Sprachen ebenfalls informell).
- example: ein konkretes Beispiel aus dem Lager- oder Betriebsalltag, 1 bis 2 Sätze, ohne neue Zahlen. Es zeigt genau den erklärten Punkt und vermischt ihn nicht mit anderen Begriffen der Lektion. Leer lassen, wenn es nichts bringt.
- check_question: eine kurze Verständnisfrage zu deiner Erklärung. check_right: die richtige Antwort, folgt direkt aus deiner Erklärung. check_wrong: eine falsche, aber plausible Antwort. Beide kurz (höchstens 8 Wörter) und ähnlich lang. check_why: ein Satz, warum check_right stimmt.
- followups: 2 bis 3 kurze Anschlussfragen aus Sicht des Kursanten (höchstens 8 Wörter), passend zur Lektion.
- Bittet der Kursant um eine einfachere Erklärung: noch kürzer und ohne Fachwörter.
- Fügt der Kursant eine Testfrage mit Antwortmöglichkeiten ein und will die Lösung: sag nicht, welche Antwort richtig ist. Erkläre nur das Wissen dahinter.
- Hat die Frage nichts mit der Lektion zu tun oder steht die Antwort nicht in der Lektion: in_scope = false. Dann ein bis zwei Sätze, dass du nur Inhalte dieser Lektion erklärst. Zu Kursinhalten aus anderen Themen: in der Kursübersicht nachsehen. Zu Preisen, Terminen oder Organisation: über den Kontakt auf staplero.de fragen. Sonst: den Ausbilder beim Praxistag fragen. example, check_* und followups bleiben leer.
- Sicherheit geht immer vor. Erkläre nie, wie man eine Regel umgeht.
- Antworte vollständig in der Sprache, die unter SPRACHE steht.`;

export interface TutorInput {
    lang: Lang;
    courseTitle: string;
    chapterTitle: string;
    lessonTitle: string;
    steps: LessonStep[];
    stepId: string;
    selection?: string;
    question?: string;
    history?: { q: string; a: string }[];
}
export interface TutorAnswer {
    inScope: boolean;
    paragraphs: string[];
    example: string;
    check: { q: string; options: [string, string]; correct: 0 | 1; why: string } | null;
    followups: string[];
}

const noDash = (s: unknown) => String(s ?? "").replace(/\s[–—]\s/g, ", ").replace(/[–—]/g, "-").trim();

export async function explain(input: TutorInput): Promise<TutorAnswer> {
    if (!process.env.OPENAI_API_KEY) throw Object.assign(new Error("OPENAI_API_KEY nicht gesetzt"), { status: 503 });
    const { lesson } = lessonContext(input.steps, input.stepId, input.lang);
    const user = [
        `SPRACHE: ${LANG_NAME[input.lang]}`,
        `KURS: ${input.courseTitle}`,
        `MODUL: ${input.chapterTitle}`,
        `LEKTION: ${input.lessonTitle}`,
        "", "INHALT DER LEKTION (Karten in Reihenfolge)", lesson,
        ...(input.selection ? ["", "VOM KURSANTEN MARKIERTER TEXT", input.selection] : []),
        ...(input.history?.length ? ["", "BISHERIGES GESPRÄCH (älteste zuerst)", ...input.history.map(h => `Kursant: ${h.q}\nLernhilfe: ${h.a}`)] : []),
        "", "FRAGE DES KURSANTEN",
        input.question || (input.selection ? "Ich verstehe den markierten Text nicht. Erkläre ihn mir." : "Erkläre mir die aktuelle Karte einfacher."),
    ].join("\n");
    const reasoning = /^(gpt-5|o\d)/.test(TUTOR_MODEL);
    const completion: any = await openai.chat.completions.create({
        model: TUTOR_MODEL,
        ...(reasoning ? { reasoning_effort: "low" } : { temperature: 0.3 }),
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "lernhilfe",
                strict: true,
                schema: {
                    type: "object",
                    additionalProperties: false,
                    required: ["in_scope", "paragraphs", "example", "check_question", "check_right", "check_wrong", "check_why", "followups"],
                    properties: {
                        in_scope: { type: "boolean" },
                        paragraphs: { type: "array", items: { type: "string" } },
                        example: { type: "string" },
                        check_question: { type: "string" },
                        check_right: { type: "string" },
                        check_wrong: { type: "string" },
                        check_why: { type: "string" },
                        followups: { type: "array", items: { type: "string" } },
                    },
                },
            },
        },
    } as any, { timeout: 45000, maxRetries: 1 });
    const raw = JSON.parse(String(completion.choices?.[0]?.message?.content || "{}"));
    const inScope = raw.in_scope !== false;
    const paragraphs = (Array.isArray(raw.paragraphs) ? raw.paragraphs : []).map(noDash).filter(Boolean).slice(0, 3);
    if (!paragraphs.length) throw Object.assign(new Error("Leere Antwort"), { status: 502 });
    const right = noDash(raw.check_right), wrong = noDash(raw.check_wrong);
    const hasCheck = inScope && noDash(raw.check_question) && right && wrong && right !== wrong;
    // kolejność losuje serwer: model źle podawał indeks poprawnej odpowiedzi
    const correct: 0 | 1 = Math.random() < .5 ? 0 : 1;
    return {
        inScope,
        paragraphs,
        example: inScope ? noDash(raw.example) : "",
        check: hasCheck ? { q: noDash(raw.check_question), options: correct === 0 ? [right, wrong] : [wrong, right], correct, why: noDash(raw.check_why) } : null,
        followups: (Array.isArray(raw.followups) ? raw.followups : []).map(noDash).filter(Boolean).slice(0, 3),
    };
}

/** Początek bieżącego dnia w Berlinie (limit „pytań dziennie” liczy się od północy czasu niemieckiego). */
export function berlinDayStart(now = new Date()) {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
        .formatToParts(now).map(x => [x.type, x.value]));
    const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    const offset = wall - Math.floor(now.getTime() / 1000) * 1000;
    return new Date(Date.UTC(+p.year, +p.month - 1, +p.day) - offset);
}
