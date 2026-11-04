import { Response } from "express";
import mongoose from "mongoose";
import QuestionBank, { BankQuestion } from "../models/QuestionBank";
import BankProgress from "../models/BankProgress";
import { LANGS } from "../models/LearningCourse";
import { UserCourse } from "../models/UserCourse";
import { AuthRequest } from "../types";

const ADMIN_EMAILS = ["info@staplero.com", "k.lopuch@satisfly.co"];
const isAdmin = (req: AuthRequest) =>
    req.user?.isAdmin === true || ADMIN_EMAILS.includes(String(req.user?.email || "").trim().toLowerCase());
const validId = (id: string) => mongoose.Types.ObjectId.isValid(id);

/** Dostęp jak do kursu: aktywny, niewygasły zakup (UserCourse z courseId = id katalogu). Admin zawsze.
 *  Przy kilku zakupach liczy się ten, który trwa najdłużej; po wygaśnięciu zwraca datę, żeby kursant zobaczył „abgelaufen am”. */
async function accessOf(req: AuthRequest, bankId: string) {
    if (isAdmin(req)) return { ok: true as const, expiresAt: null };
    const uc = await UserCourse.findOne({ userId: String(req.user!._id), courseId: bankId, status: { $in: ["active", "expired"] } }).sort({ expiresAt: -1 }).lean();
    if (!uc) return { ok: false as const };
    if (uc.status !== "active" && uc.status !== "expired") return { ok: false as const };
    if (uc.status === "expired" || new Date(uc.expiresAt) < new Date()) return { ok: false as const, expiredAt: uc.expiresAt };
    return { ok: true as const, expiresAt: uc.expiresAt };
}
const denied = (res: Response, acc: { expiredAt?: Date }) =>
    res.status(403).json({ message: acc.expiredAt ? "Zugang abgelaufen" : "Kein Zugriff auf diesen Fragenkatalog", ...(acc.expiredAt ? { expired: true, expiredAt: acc.expiredAt } : {}) });
/** Próg zaliczenia testu z katalogu (jak egzamin końcowy). */
const BANK_PASS = 80;

const visible = (q: BankQuestion) => !q.hidden && !q.wait;
const maskOf = (ks: number[]) => ks.reduce((m, k) => m | (1 << k), 0);
/** Odpowiedź jak w testach kursu: indeks, maska bitowa (wielokrotny wybór) albo wpisana liczba. */
function isRight(q: BankQuestion, a: number) {
    if (q.num !== undefined && q.num !== null) return a === q.num;
    return q.c.length > 1 ? a === maskOf(q.c) : a === q.c[0];
}

/* ════════════════ kursant ════════════════ */

/** Katalogi, do których kursant ma dostęp (dla panelu „Meine Kurse”). */
export async function myBanks(userId: string, admin: boolean, withExpired = false) {
    const access = admin ? [] : await UserCourse.find({ userId, status: withExpired ? { $in: ["active", "expired"] } : "active" }).lean();
    const now = new Date();
    // najdłużej trwający zakup danego katalogu
    const latest = new Map<string, Date>();
    for (const a of access) if (validId(a.courseId)) { const d = a.status === "expired" ? new Date(Math.min(+new Date(a.expiresAt), +now - 1)) : new Date(a.expiresAt); if (!latest.has(a.courseId) || d > latest.get(a.courseId)!) latest.set(a.courseId, d); }
    const ids = [...latest].filter(([, d]) => withExpired || d >= now).map(([id]) => id);
    const banks = await QuestionBank.find(admin ? {} : { _id: { $in: ids } }).lean();
    const prog = await BankProgress.find({ userId, bankId: { $in: banks.map(b => String(b._id)) } }).lean();
    return banks.map(b => {
        const qs = b.questions.filter(visible);
        const p = prog.find(x => x.bankId === String(b._id));
        const ans = p?.answers ?? {};
        const exp = latest.get(String(b._id)) ?? null;
        const last = p?.tests?.length ? p.tests[p.tests.length - 1] : null;
        return {
            id: String(b._id), slug: b.slug, kind: "bank" as const, title: b.title, coverUrl: undefined,
            lessonCount: qs.length, lessonsDone: qs.filter(q => ans[q.id]).length, lastLessonId: null, lastStep: 0,
            expiresAt: exp, ...(exp && exp < now ? { expired: true } : {}),
            testsDone: p?.tests?.length ?? 0, ...(last ? { lastTest: { at: last.at, n: last.n, right: last.right, passed: last.passed } } : {}),
        };
    });
}

// GET /api/learning/banks/:bankId — pytania do nauki (z poprawnymi odpowiedziami: to tryb nauki) i postęp
export const getBank = async (req: AuthRequest, res: Response) => {
    const { bankId } = req.params;
    if (!validId(bankId)) return res.status(404).json({ message: "Fragenkatalog nicht gefunden" });
    const acc = await accessOf(req, bankId);
    if (!acc.ok) return denied(res, acc);
    const b = await QuestionBank.findById(bankId).lean();
    if (!b) return res.status(404).json({ message: "Fragenkatalog nicht gefunden" });
    const p = await BankProgress.findOne({ userId: String(req.user!._id), bankId }).lean();
    res.json({
        id: String(b._id), title: b.title, description: b.description, topics: b.topics, expiresAt: acc.expiresAt,
        questions: b.questions.filter(visible).map(({ hidden, wait, updatedAt, ...q }) => q),
        answers: p?.answers ?? {}, tests: (p?.tests ?? []).slice(-20).reverse(), passPercent: BANK_PASS,
    });
};

// POST /api/learning/banks/:bankId/tests { answers: { [qid]: a }, topic? } — test kursanta: serwer ocenia całość na końcu,
// zapisuje odpowiedzi (jak w nauce) i wynik w historii testów
export const submitBankTest = async (req: AuthRequest, res: Response) => {
    const { bankId } = req.params;
    if (!validId(bankId)) return res.status(404).json({ message: "Fragenkatalog nicht gefunden" });
    const acc = await accessOf(req, bankId);
    if (!acc.ok) return denied(res, acc);
    const raw = req.body?.answers && typeof req.body.answers === "object" ? req.body.answers as Record<string, unknown> : {};
    const b = await QuestionBank.findById(bankId).lean();
    if (!b) return res.status(404).json({ message: "Fragenkatalog nicht gefunden" });
    const byId = new Map(b.questions.filter(visible).map(q => [q.id, q]));
    const ids = Object.keys(raw).filter(id => byId.has(id)).slice(0, 500);
    if (!ids.length) return res.status(400).json({ message: "Keine Antworten" });
    const userId = String(req.user!._id);
    const prev = await BankProgress.findOne({ userId, bankId }).lean();
    const results: Record<string, boolean> = {};
    const set: Record<string, unknown> = {};
    for (const id of ids) {
        const a = Number(raw[id]);
        // nicht beantwortet (-1 / leer) zählt als falsch
        const ok = Number.isInteger(a) && a >= 0 && isRight(byId.get(id)!, a);
        results[id] = ok;
        set[`answers.${id}`] = { ok, n: (prev?.answers?.[id]?.n ?? 0) + 1, at: new Date() };
    }
    const right = Object.values(results).filter(Boolean).length;
    const passed = right * 100 >= ids.length * BANK_PASS;
    const topic = typeof req.body?.topic === "string" && b.topics.some(t => t.key === req.body.topic) ? req.body.topic : undefined;
    const entry = { at: new Date(), n: ids.length, right, passed, ...(topic ? { topic } : {}) };
    await BankProgress.updateOne({ userId, bankId }, { $set: set, $push: { tests: { $each: [entry], $slice: -50 } } }, { upsert: true });
    res.json({ ...entry, results, passPercent: BANK_PASS });
};

// PUT /api/learning/banks/:bankId/answers/:qid { a } — serwer sprawdza odpowiedź i zapisuje wynik
export const answerBank = async (req: AuthRequest, res: Response) => {
    const { bankId, qid } = req.params;
    if (!validId(bankId)) return res.status(404).json({ message: "Fragenkatalog nicht gefunden" });
    const acc = await accessOf(req, bankId);
    if (!acc.ok) return denied(res, acc);
    const a = Number(req.body?.a);
    if (!Number.isInteger(a) || a < 0) return res.status(400).json({ message: "Ungültige Antwort" });
    const b = await QuestionBank.findById(bankId, { questions: { $elemMatch: { id: qid } } }).lean();
    const q = b?.questions?.[0];
    if (!q || !visible(q)) return res.status(404).json({ message: "Frage nicht gefunden" });
    const ok = isRight(q, a);
    const userId = String(req.user!._id);
    const prev = await BankProgress.findOne({ userId, bankId }).lean();
    const n = (prev?.answers?.[qid]?.n ?? 0) + 1;
    await BankProgress.updateOne({ userId, bankId }, { $set: { [`answers.${qid}`]: { ok, n, at: new Date() } } }, { upsert: true });
    res.json({ ok });
};

// DELETE /api/learning/banks/:bankId/progress — kursant zaczyna od nowa
export const resetBankProgress = async (req: AuthRequest, res: Response) => {
    const { bankId } = req.params;
    if (!validId(bankId)) return res.status(404).json({ message: "Fragenkatalog nicht gefunden" });
    const acc = await accessOf(req, bankId);
    if (!acc.ok) return denied(res, acc);
    await BankProgress.deleteOne({ userId: String(req.user!._id), bankId });
    res.json({ ok: true });
};

/* ════════════════ admin ════════════════ */

const clean = (s: unknown) => String(s ?? "").trim();
const cleanL = (v: any) => Object.fromEntries(LANGS.map(l => [l, clean(v?.[l])]));
/** Czyści i sprawdza pytanie z edytora. Zwraca listę błędów (po niemiecku, jak reszta panelu admina). */
function parseQuestion(body: any, topics: string[]): { q?: Omit<BankQuestion, "id">; errors: string[] } {
    const errors: string[] = [];
    const kind = body?.kind === "num" ? "num" : body?.kind === "multi" ? "multi" : "single";
    const q: Omit<BankQuestion, "id"> = { topic: clean(body?.topic), q: cleanL(body?.q), o: [], c: [], hidden: !!body?.hidden, updatedAt: new Date() };
    if (!topics.includes(q.topic)) errors.push("Unbekanntes Modul.");
    if (!q.q.de) errors.push("Der deutsche Fragetext fehlt.");
    if (kind === "num") {
        const num = Number(body?.num);
        if (body?.num === "" || body?.num === undefined || !Number.isInteger(num) || num < 0) errors.push("Richtigen Wert als ganze Zahl ≥ 0 eingeben.");
        q.num = num; q.unit = clean(body?.unit).slice(0, 20);
    } else {
        const raw: any[] = Array.isArray(body?.o) ? body.o : [];
        const c: number[] = Array.isArray(body?.c) ? body.c.map(Number) : [];
        // leere Antworten fallen weg, Indizes der richtigen werden nachgezogen
        raw.forEach((o, j) => { const t = cleanL(o); if (t.de) { if (c.includes(j)) q.c.push(q.o.length); q.o.push(t); } });
        if (q.o.length < 2) errors.push("Mindestens 2 Antworten mit deutschem Text.");
        if (q.o.length > 8) errors.push("Höchstens 8 Antworten.");
        if (kind === "single" && q.c.length !== 1) errors.push("Genau eine Antwort als richtig markieren.");
        if (kind === "multi" && q.c.length < 2) errors.push("Mindestens 2 Antworten als richtig markieren.");
    }
    const m = body?.media;
    if (m && m.src) {
        if (!["image", "video"].includes(m.type) || !/^(https?:\/\/|\/)/.test(String(m.src))) errors.push("Ungültige Datei.");
        else q.media = { type: m.type, src: String(m.src), ...(m.name ? { name: clean(m.name).slice(0, 200) } : {}) };
    }
    if (body?.wait && !q.media) q.wait = clean(body.wait);
    return { q: errors.length ? undefined : q, errors };
}

// GET /api/learning/admin/banks
export const adminListBanks = async (_req: AuthRequest, res: Response) => {
    const banks = await QuestionBank.find({}, { slug: 1, title: 1, questions: 1, updatedAt: 1 }).lean();
    res.json(banks.map(b => ({ id: String(b._id), slug: b.slug, title: b.title, count: b.questions.length, active: b.questions.filter(visible).length, updatedAt: b.updatedAt })));
};

// GET /api/learning/admin/banks/:bankId
export const adminGetBank = async (req: AuthRequest, res: Response) => {
    const { bankId } = req.params;
    if (!validId(bankId)) return res.status(404).json({ message: "Fragenkatalog nicht gefunden" });
    const b = await QuestionBank.findById(bankId).lean();
    if (!b) return res.status(404).json({ message: "Fragenkatalog nicht gefunden" });
    res.json({ id: String(b._id), slug: b.slug, title: b.title, description: b.description, topics: b.topics, questions: b.questions, updatedAt: b.updatedAt });
};

// POST /api/learning/admin/banks/:bankId/questions — neue Frage, Nummer = nächste freie
export const adminCreateQuestion = async (req: AuthRequest, res: Response) => {
    const { bankId } = req.params;
    if (!validId(bankId)) return res.status(404).json({ message: "Fragenkatalog nicht gefunden" });
    const b = await QuestionBank.findById(bankId);
    if (!b) return res.status(404).json({ message: "Fragenkatalog nicht gefunden" });
    const { q, errors } = parseQuestion(req.body, b.topics.map(t => t.key));
    if (!q) return res.status(400).json({ message: errors.join(" "), errors });
    const prefix = (b.questions[0]?.id.match(/^([A-Za-z]+)-/)?.[1] ?? "F").toUpperCase();
    const max = b.questions.reduce((m, x) => Math.max(m, Number(x.id.match(/(\d+)$/)?.[1] ?? 0)), 0);
    const id = `${prefix}-${String(max + 1).padStart(3, "0")}`;
    b.questions.push({ id, ...q });
    await b.save();
    res.status(201).json({ id, ...q });
};

// PUT /api/learning/admin/banks/:bankId/questions/:qid
export const adminUpdateQuestion = async (req: AuthRequest, res: Response) => {
    const { bankId, qid } = req.params;
    if (!validId(bankId)) return res.status(404).json({ message: "Fragenkatalog nicht gefunden" });
    const b = await QuestionBank.findById(bankId);
    if (!b) return res.status(404).json({ message: "Fragenkatalog nicht gefunden" });
    const i = b.questions.findIndex(x => x.id === qid);
    if (i < 0) return res.status(404).json({ message: "Frage nicht gefunden" });
    const { q, errors } = parseQuestion(req.body, b.topics.map(t => t.key));
    if (!q) return res.status(400).json({ message: errors.join(" "), errors });
    b.questions[i] = { id: qid, ...q };
    b.markModified("questions");
    await b.save();
    res.json({ id: qid, ...q });
};

// DELETE /api/learning/admin/banks/:bankId/questions/:qid
export const adminDeleteQuestion = async (req: AuthRequest, res: Response) => {
    const { bankId, qid } = req.params;
    if (!validId(bankId)) return res.status(404).json({ message: "Fragenkatalog nicht gefunden" });
    const r = await QuestionBank.updateOne({ _id: bankId }, { $pull: { questions: { id: qid } } });
    if (!r.modifiedCount) return res.status(404).json({ message: "Frage nicht gefunden" });
    res.json({ ok: true });
};
