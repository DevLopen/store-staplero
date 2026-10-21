import { Response } from "express";
import mongoose from "mongoose";
import LearningCourse, { CourseContent, LANGS, Lang } from "../models/LearningCourse";
import LessonProgress from "../models/LessonProgress";
import { UserCourse } from "../models/UserCourse";
import { AuthRequest } from "../types";
import { emptyContent, findLesson, newId, outline, translationStatus, validateContent } from "../utils/learningContent";

const ADMIN_EMAILS = ["info@staplero.com", "k.lopuch@satisfly.co"];
const isAdmin = (req: AuthRequest) =>
    req.user?.isAdmin === true || ADMIN_EMAILS.includes(String(req.user?.email || "").trim().toLowerCase());
const validId = (id: string) => mongoose.Types.ObjectId.isValid(id);

/** Active, not expired purchase of this course. Admins always have access. */
async function accessOf(req: AuthRequest, courseId: string) {
    if (isAdmin(req)) return { ok: true as const, expiresAt: null };
    const uc = await UserCourse.findOne({ userId: String(req.user!._id), courseId, status: "active" }).lean();
    if (!uc || new Date(uc.expiresAt) < new Date()) return { ok: false as const };
    return { ok: true as const, expiresAt: uc.expiresAt };
}

const progressMap = async (userId: string, courseId: string) => {
    const rows = await LessonProgress.find({ userId, courseId }).lean();
    return Object.fromEntries(rows.map(r => [r.lessonId, { step: r.step, completed: r.completed }]));
};

/* ════════════════ learner ════════════════ */

// GET /api/learning/my — published courses the user can open, with progress
export const getMyCourses = async (req: AuthRequest, res: Response) => {
    try {
        const userId = String(req.user!._id);
        const admin = isAdmin(req);
        const access = admin ? [] : await UserCourse.find({ userId, status: "active" }).lean();
        const ids = access.filter(a => new Date(a.expiresAt) >= new Date()).map(a => a.courseId).filter(validId);
        const courses = await LearningCourse.find(admin ? { published: { $exists: true } } : { _id: { $in: ids }, published: { $exists: true } }).lean();
        const progress = await LessonProgress.find({ userId, courseId: { $in: courses.map(c => String(c._id)) } }).lean();
        res.json(courses.map(c => {
            const lessons = c.published!.chapters.flatMap(ch => ch.lessons);
            const done = progress.filter(p => p.courseId === String(c._id) && p.completed).length;
            const last = progress.filter(p => p.courseId === String(c._id)).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0];
            return {
                id: String(c._id), slug: c.slug, coverUrl: c.coverUrl, title: c.published!.title,
                lessonCount: lessons.length, lessonsDone: done,
                lastLessonId: last?.lessonId ?? lessons[0]?.id ?? null, lastStep: last?.step ?? 0,
                expiresAt: access.find(a => a.courseId === String(c._id))?.expiresAt ?? null,
            };
        }));
    } catch (e) {
        console.error("[learning] getMyCourses", e);
        res.status(500).json({ message: "Kurse konnten nicht geladen werden" });
    }
};

// GET /api/learning/courses/:courseId — outline + progress
export const getCourse = async (req: AuthRequest, res: Response) => {
    const { courseId } = req.params;
    if (!validId(courseId)) return res.status(404).json({ message: "Kurs nicht gefunden" });
    const acc = await accessOf(req, courseId);
    if (!acc.ok) return res.status(403).json({ message: "Kein Zugriff auf diesen Kurs" });
    const c = await LearningCourse.findById(courseId).lean();
    const content = req.query.draft === "1" && isAdmin(req) ? c?.draft : c?.published;
    if (!c || !content) return res.status(404).json({ message: "Kurs nicht gefunden" });
    res.json({
        id: String(c._id), slug: c.slug, coverUrl: c.coverUrl, languages: c.languages,
        ...outline(content), expiresAt: acc.expiresAt,
        progress: await progressMap(String(req.user!._id), courseId),
    });
};

// GET /api/learning/courses/:courseId/lessons/:lessonId — full lesson for the player
export const getLesson = async (req: AuthRequest, res: Response) => {
    const { courseId, lessonId } = req.params;
    if (!validId(courseId)) return res.status(404).json({ message: "Thema nicht gefunden" });
    const acc = await accessOf(req, courseId);
    if (!acc.ok) return res.status(403).json({ message: "Kein Zugriff auf diesen Kurs" });
    const c = await LearningCourse.findById(courseId).lean();
    const content = req.query.draft === "1" && isAdmin(req) ? c?.draft : c?.published;
    const hit = content && findLesson(content, lessonId);
    if (!c || !content || !hit) return res.status(404).json({ message: "Thema nicht gefunden" });
    const order = content.chapters.flatMap(ch => ch.lessons.map(l => l.id));
    const i = order.indexOf(lessonId);
    const p = await LessonProgress.findOne({ userId: String(req.user!._id), courseId, lessonId }).lean();
    res.json({
        courseId, courseTitle: content.title, chapter: { id: hit.chapter.id, title: hit.chapter.title },
        lesson: hit.lesson, prevLessonId: order[i - 1] ?? null, nextLessonId: order[i + 1] ?? null,
        progress: p ? { step: p.step, completed: p.completed } : { step: 0, completed: false },
    });
};

// PUT /api/learning/courses/:courseId/lessons/:lessonId/progress { step, completed }
export const saveProgress = async (req: AuthRequest, res: Response) => {
    const { courseId, lessonId } = req.params;
    if (!validId(courseId)) return res.status(404).json({ message: "Kurs nicht gefunden" });
    const acc = await accessOf(req, courseId);
    if (!acc.ok) return res.status(403).json({ message: "Kein Zugriff auf diesen Kurs" });
    const step = Math.max(0, Math.floor(Number(req.body?.step) || 0));
    const completed = req.body?.completed === true;
    const userId = String(req.user!._id);
    const prev = await LessonProgress.findOne({ userId, courseId, lessonId });
    if (!prev) {
        await LessonProgress.create({ userId, courseId, lessonId, step, completed, completedAt: completed ? new Date() : undefined });
    } else {
        // never lose progress: keep the furthest step and a completion once reached
        prev.step = Math.max(prev.step, step);
        if (completed && !prev.completed) { prev.completed = true; prev.completedAt = new Date(); }
        await prev.save();
    }
    res.json({ ok: true });
};

/* ════════════════ admin ════════════════ */

const adminRow = async (c: any) => ({
    id: String(c._id), slug: c.slug, coverUrl: c.coverUrl, languages: c.languages,
    title: c.draft.title,
    chapterCount: c.draft.chapters.length,
    lessonCount: c.draft.chapters.reduce((n: number, ch: any) => n + ch.lessons.length, 0),
    status: !c.published ? "draft" : c.draftChangedAt > c.published.publishedAt ? "changed" : "published",
    publishedAt: c.published?.publishedAt ?? null,
    updatedAt: c.updatedAt,
    translations: translationStatus(c.draft),
    learners: await UserCourse.countDocuments({ courseId: String(c._id), status: "active" }),
});

// GET /api/learning/admin/courses
export const adminListCourses = async (_req: AuthRequest, res: Response) => {
    const list = await LearningCourse.find({}).sort({ updatedAt: -1 }).lean();
    res.json(await Promise.all(list.map(adminRow)));
};

// POST /api/learning/admin/courses { title, slug?, copyStructureFrom? }
export const adminCreateCourse = async (req: AuthRequest, res: Response) => {
    const title = String(req.body?.title || "").trim();
    if (!title) return res.status(400).json({ message: "Titel fehlt", field: "title" });
    const slug = String(req.body?.slug || title).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || newId("kurs");
    if (await LearningCourse.exists({ slug })) return res.status(409).json({ message: "Diese Adresse ist schon vergeben", field: "slug" });
    let draft: CourseContent = emptyContent(title);
    const from = String(req.body?.copyStructureFrom || "");
    if (from && validId(from)) {
        const src = await LearningCourse.findById(from).lean();
        // copy chapters and lesson titles only, without step contents
        if (src) draft.chapters = src.draft.chapters.map(ch => ({ id: newId("ch"), title: ch.title, description: ch.description, lessons: ch.lessons.map(l => ({ id: newId("ls"), title: l.title, durationMin: l.durationMin, steps: [] })) }));
    }
    const langs = Array.isArray(req.body?.languages) ? (req.body.languages as string[]).filter((l): l is Lang => (LANGS as readonly string[]).includes(l)) : [...LANGS];
    const c = await LearningCourse.create({ slug, draft, languages: langs.includes("de") ? langs : ["de", ...langs] });
    res.status(201).json(await adminRow(c.toObject()));
};

// GET /api/learning/admin/courses/:courseId
export const adminGetCourse = async (req: AuthRequest, res: Response) => {
    if (!validId(req.params.courseId)) return res.status(404).json({ message: "Kurs nicht gefunden" });
    const c = await LearningCourse.findById(req.params.courseId).lean();
    if (!c) return res.status(404).json({ message: "Kurs nicht gefunden" });
    res.json({ ...(await adminRow(c)), draft: c.draft, revision: c.revision, publishedVersion: c.published?.version ?? 0 });
};

// PUT /api/learning/admin/courses/:courseId/draft { draft, revision } — autosave of the whole tree
export const adminSaveDraft = async (req: AuthRequest, res: Response) => {
    if (!validId(req.params.courseId)) return res.status(404).json({ message: "Kurs nicht gefunden" });
    const errs = validateContent(req.body?.draft);
    if (errs.length) return res.status(400).json({ message: "Inhalt ungültig", errors: errs.slice(0, 20) });
    const rev = Number(req.body?.revision);
    // optimistic lock: a second open tab must not silently overwrite newer edits
    const c = await LearningCourse.findOneAndUpdate(
        { _id: req.params.courseId, revision: rev },
        { $set: { draft: req.body.draft, draftChangedAt: new Date() }, $inc: { revision: 1 } },
        { new: true }
    ).lean();
    if (!c) {
        const exists = await LearningCourse.exists({ _id: req.params.courseId });
        return exists
            ? res.status(409).json({ message: "Der Kurs wurde inzwischen an anderer Stelle geändert. Bitte neu laden." })
            : res.status(404).json({ message: "Kurs nicht gefunden" });
    }
    res.json({ revision: c.revision, savedAt: c.draftChangedAt, translations: translationStatus(c.draft) });
};

// PATCH /api/learning/admin/courses/:courseId { slug?, languages?, coverUrl? }
export const adminUpdateMeta = async (req: AuthRequest, res: Response) => {
    if (!validId(req.params.courseId)) return res.status(404).json({ message: "Kurs nicht gefunden" });
    const set: Record<string, unknown> = {};
    if (typeof req.body?.slug === "string") {
        const slug = req.body.slug.trim().toLowerCase();
        if (!/^[a-z0-9-]{3,60}$/.test(slug)) return res.status(400).json({ message: "Nur Kleinbuchstaben, Zahlen und Bindestriche, 3 bis 60 Zeichen", field: "slug" });
        if (await LearningCourse.exists({ slug, _id: { $ne: req.params.courseId } })) return res.status(409).json({ message: "Diese Adresse ist schon vergeben", field: "slug" });
        set.slug = slug;
    }
    if (Array.isArray(req.body?.languages)) set.languages = ["de", ...(req.body.languages as string[]).filter(l => l !== "de" && (LANGS as readonly string[]).includes(l))];
    if (typeof req.body?.coverUrl === "string") set.coverUrl = req.body.coverUrl;
    const c = await LearningCourse.findByIdAndUpdate(req.params.courseId, { $set: set }, { new: true }).lean();
    if (!c) return res.status(404).json({ message: "Kurs nicht gefunden" });
    res.json(await adminRow(c));
};

// POST /api/learning/admin/courses/:courseId/publish
export const adminPublish = async (req: AuthRequest, res: Response) => {
    if (!validId(req.params.courseId)) return res.status(404).json({ message: "Kurs nicht gefunden" });
    const c = await LearningCourse.findById(req.params.courseId);
    if (!c) return res.status(404).json({ message: "Kurs nicht gefunden" });
    const errs = validateContent(c.draft);
    if (errs.length) return res.status(400).json({ message: "Inhalt ungültig", errors: errs.slice(0, 20) });
    const version = (c.published?.version ?? 0) + 1;
    c.published = { ...JSON.parse(JSON.stringify(c.draft)), version, publishedAt: new Date() };
    c.markModified("published");
    await c.save();
    res.json(await adminRow(c.toObject()));
};

// DELETE /api/learning/admin/courses/:courseId — refused while learners have access
export const adminDeleteCourse = async (req: AuthRequest, res: Response) => {
    if (!validId(req.params.courseId)) return res.status(404).json({ message: "Kurs nicht gefunden" });
    const learners = await UserCourse.countDocuments({ courseId: req.params.courseId, status: "active" });
    if (learners) return res.status(409).json({ message: `Der Kurs hat ${learners} aktive Teilnehmer und kann nicht gelöscht werden.` });
    await LearningCourse.findByIdAndDelete(req.params.courseId);
    await LessonProgress.deleteMany({ courseId: req.params.courseId });
    res.json({ ok: true });
};
