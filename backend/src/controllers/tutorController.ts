import { Response } from "express";
import LearningCourse, { Lang, LANGS } from "../models/LearningCourse";
import TutorQuestion from "../models/TutorQuestion";
import User from "../models/User";
import { AuthRequest } from "../types";
import { findLesson } from "../utils/learningContent";
import { accessOf, denied, isAdmin, lockedChapters, progressMap, validId } from "./learningController";
import { berlinDayStart, explain, isTestStep, stepTitle, TUTOR_DAILY_LIMIT } from "../services/courseTutor.service";

/** Ile pytań do Lernhilfe zostało kursantowi dzisiaj. Nieudane odpowiedzi (błąd modelu) się nie liczą. */
export async function tutorLeft(userId: string) {
    const used = await TutorQuestion.countDocuments({ userId, createdAt: { $gte: berlinDayStart() }, failed: { $ne: true } });
    return Math.max(0, TUTOR_DAILY_LIMIT - used);
}

const clip = (v: unknown, n: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

// POST /api/learning/courses/:courseId/lessons/:lessonId/explain { stepId, lang, selection?, question?, history?: {q,a}[] }
export const explainStep = async (req: AuthRequest, res: Response) => {
    const { courseId, lessonId } = req.params;
    if (!validId(courseId)) return res.status(404).json({ message: "Kurs nicht gefunden" });
    const acc = await accessOf(req, courseId);
    if (!acc.ok) return denied(res, acc);
    const admin = isAdmin(req);
    const draft = admin && req.query.draft === "1";
    const c = await LearningCourse.findById(courseId).lean();
    const content = draft ? c?.draft : c?.published;
    const hit = content && findLesson(content, lessonId);
    if (!c || !content || !hit) return res.status(404).json({ message: "Thema nicht gefunden" });
    const userId = String(req.user!._id);
    if (!admin && lockedChapters(content, await progressMap(userId, courseId)).has(hit.chapter.id)) return res.status(423).json({ message: "Modul gesperrt", locked: true });

    const stepId = clip(req.body?.stepId, 80);
    const step = hit.lesson.steps.find(s => s.id === stepId);
    if (!step) return res.status(400).json({ message: "Karte nicht gefunden" });
    // blokada na serwerze, nie tylko ukryty przycisk: w teście modułu i na egzaminie pomocy nie ma
    if (isTestStep(step)) return res.status(403).json({ message: "Während Tests und Prüfung ist die Lernhilfe aus.", testLocked: true });

    const lang: Lang = (LANGS as readonly string[]).includes(req.body?.lang) ? req.body.lang : "de";
    const selection = clip(req.body?.selection, 600);
    const question = clip(req.body?.question, 400);
    const history = (Array.isArray(req.body?.history) ? req.body.history : []).slice(-3)
        .map((h: any) => ({ q: clip(h?.q, 400), a: clip(h?.a, 900) })).filter((h: { q: string; a: string }) => h.q && h.a);

    if (!admin) {
        const left = await tutorLeft(userId);
        if (left <= 0) return res.status(429).json({ message: "Tageslimit erreicht", limit: true, left: 0 });
        // krótka seria: najwyżej 5 pytań na minutę
        const burst = await TutorQuestion.countDocuments({ userId, createdAt: { $gte: new Date(Date.now() - 60_000) } });
        if (burst >= 5) return res.status(429).json({ message: "Zu viele Fragen hintereinander", burst: true });
    }

    const log = await TutorQuestion.create({ userId, courseId, lessonId, stepId, lang, selection: selection || undefined, question: question || undefined, admin: admin || undefined });
    try {
        const tx = (t: any) => (t?.[lang] || t?.de || "") as string;
        const answer = await explain({
            lang, courseTitle: tx(content.title), chapterTitle: tx(hit.chapter.title), lessonTitle: tx(hit.lesson.title),
            steps: hit.lesson.steps, stepId, selection, question, history,
        });
        log.answer = answer as any; log.inScope = answer.inScope;
        await log.save();
        res.json({ id: String(log._id), ...answer, left: admin ? TUTOR_DAILY_LIMIT : await tutorLeft(userId), limit: TUTOR_DAILY_LIMIT });
    } catch (e: any) {
        console.error("[tutor] explain", e?.message || e);
        log.failed = true; await log.save().catch(() => {});
        res.status(502).json({ message: "Die Lernhilfe ist gerade nicht erreichbar. Versuch es gleich noch einmal." });
    }
};

// PUT /api/learning/courses/:courseId/tutor/:id/check { ok } — wynik pytania sprawdzającego, do statystyk w panelu
export const tutorCheck = async (req: AuthRequest, res: Response) => {
    if (!validId(req.params.id)) return res.status(404).json({ message: "Nicht gefunden" });
    await TutorQuestion.updateOne({ _id: req.params.id, userId: String(req.user!._id), courseId: req.params.courseId, checkOk: { $exists: false } }, { $set: { checkOk: req.body?.ok === true } });
    res.json({ ok: true });
};

// GET /api/learning/admin/courses/:courseId/tutor?days=30 — które karty kursanci rozumieją najsłabiej + ostatnie pytania
export const adminTutorStats = async (req: AuthRequest, res: Response) => {
    const { courseId } = req.params;
    if (!validId(courseId)) return res.status(404).json({ message: "Kurs nicht gefunden" });
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * 86400_000);
    const c = await LearningCourse.findById(courseId).lean();
    if (!c) return res.status(404).json({ message: "Kurs nicht gefunden" });
    const content = c.published ?? c.draft;
    const rows = await TutorQuestion.find({ courseId, createdAt: { $gte: since }, failed: { $ne: true }, admin: { $ne: true } }).sort({ createdAt: -1 }).limit(2000).lean();

    const where = new Map<string, { lesson: string; step: string; module: string }>();
    content.chapters.forEach(ch => ch.lessons.forEach(l => l.steps.forEach((st, k) => where.set(`${l.id}/${st.id}`, {
        module: ch.title.de || "", lesson: l.title.de || "", step: `Karte ${k + 1}: ${stepTitle(st)}`,
    }))));
    const by = new Map<string, { lessonId: string; stepId: string; count: number; users: Set<string>; checkWrong: number; checks: number }>();
    for (const r of rows) {
        const k = `${r.lessonId}/${r.stepId}`;
        const b = by.get(k) ?? { lessonId: r.lessonId, stepId: r.stepId, count: 0, users: new Set(), checkWrong: 0, checks: 0 };
        b.count++; b.users.add(r.userId);
        if (typeof r.checkOk === "boolean") { b.checks++; if (!r.checkOk) b.checkWrong++; }
        by.set(k, b);
    }
    const recent = rows.slice(0, 100);
    const users = await User.find({ _id: { $in: [...new Set(recent.map(r => r.userId))].filter(validId) } }).select("name firstName lastName email").lean();
    const uname = new Map(users.map((u: any) => [String(u._id), { name: u.name || [u.firstName, u.lastName].filter(Boolean).join(" "), email: u.email }]));
    res.json({
        days, total: rows.length, learners: new Set(rows.map(r => r.userId)).size, limit: TUTOR_DAILY_LIMIT,
        outOfScope: rows.filter(r => r.inScope === false).length,
        byStep: [...by.values()].sort((a, b) => b.count - a.count).slice(0, 30).map(b => ({
            ...where.get(`${b.lessonId}/${b.stepId}`), lessonId: b.lessonId, stepId: b.stepId, count: b.count, learners: b.users.size, checks: b.checks, checkWrong: b.checkWrong,
        })),
        recent: recent.map(r => ({
            id: String(r._id), at: r.createdAt, lang: r.lang, ...where.get(`${r.lessonId}/${r.stepId}`),
            user: uname.get(r.userId) ?? { name: "", email: "" },
            selection: r.selection ?? "", question: r.question ?? "",
            answer: ((r.answer as any)?.paragraphs ?? []).join(" "), inScope: r.inScope !== false, checkOk: r.checkOk ?? null,
        })),
    });
};
