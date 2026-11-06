/**
 * /api/inbox: skrzynka w panelu admina.
 *   /api/inbox/hook/*  wywołuje n8n, chronione nagłówkiem x-inbox-secret (INBOX_HOOK_SECRET)
 *   /api/inbox/*       panel admina, JWT + admin
 */
import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { protect, admin } from "../middleware/authMiddleware";
import InboxThread, { INBOX_CATEGORIES, INBOX_STATUSES } from "../models/InboxThread";
import InboxSetting from "../models/InboxSetting";
import {
    ingestEmail, applyAiResult, threadForAi, requestDraft, sendReply, INBOX_FILES_DIR,
} from "../services/inbox.service";

const router = express.Router();

// ─── n8n ──────────────────────────────────────────────────────────────────────

const hookAuth = (req: Request, res: Response, next: NextFunction) => {
    const secret = process.env.INBOX_HOOK_SECRET || "";
    const given = String(req.headers["x-inbox-secret"] || "");
    if (secret.length < 16) return res.status(503).json({ error: "INBOX_HOOK_SECRET nicht gesetzt (min. 16 Zeichen)" });
    const a = Buffer.from(given), b = Buffer.from(secret);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: "unauthorized" });
    next();
};
const validId = (req: Request, res: Response, next: NextFunction) =>
    mongoose.isValidObjectId(req.params.id) ? next() : res.status(404).json({ error: "not found" });

// załączniki przychodzą w base64, więc większy limit niż globalne 10 MB
const bigJson = express.json({ limit: "40mb" });

router.post("/hook/ingest", bigJson, hookAuth, async (req, res) => {
    try {
        const items = Array.isArray(req.body) ? req.body : [req.body];
        const results = [];
        for (const item of items) results.push(await ingestEmail(item));
        res.json({ results });
    } catch (err: any) {
        console.error("[inbox] ingest:", err);
        res.status(500).json({ error: err.message });
    }
});

// router jest podpięty przed globalnym express.json (server.ts), więc pozostałe trasy parsują JSON same
router.use(express.json({ limit: "2mb" }));

router.get("/hook/threads/:id", hookAuth, validId, async (req, res) => {
    const data = await threadForAi(req.params.id);
    if (!data) return res.status(404).json({ error: "not found" });
    res.json(data);
});

router.post("/hook/threads/:id/ai", hookAuth, validId, async (req, res) => {
    const t = await applyAiResult(req.params.id, req.body || {});
    if (!t) return res.status(404).json({ error: "not found" });
    res.json({ ok: true, status: t.status, category: t.category });
});

// ─── Panel ────────────────────────────────────────────────────────────────────

router.use(protect, admin);

const listProjection = "subject customer source category priority language summary status unread ai.status ai.requestedAt lastMessageAt lastInboundAt createdAt";

router.get("/", async (req, res) => {
    const { category, status, q } = req.query as Record<string, string>;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const filter: any = {};
    if (category && (INBOX_CATEGORIES as readonly string[]).includes(category)) filter.category = category;
    if (category === "none") filter.category = { $exists: false };
    if (status === "open") filter.status = { $in: ["new", "draft"] };
    else if (status && (INBOX_STATUSES as readonly string[]).includes(status)) filter.status = status;
    if (q?.trim()) {
        const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [{ subject: rx }, { "customer.email": rx }, { "customer.name": rx }, { "customer.company": rx }, { summary: rx }, { "messages.text": rx }];
    }
    const [threads, total] = await Promise.all([
        InboxThread.find(filter).select(listProjection).sort({ lastMessageAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        InboxThread.countDocuments(filter),
    ]);
    res.json({ threads, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
});

router.get("/stats", async (_req, res) => {
    const [byStatus, byCategory, unread] = await Promise.all([
        InboxThread.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
        InboxThread.aggregate([{ $match: { status: { $in: ["new", "draft"] } } }, { $group: { _id: "$category", n: { $sum: 1 } } }]),
        InboxThread.countDocuments({ unread: true, status: { $ne: "archived" } }),
    ]);
    res.json({
        status: Object.fromEntries(byStatus.map(s => [s._id, s.n])),
        openByCategory: Object.fromEntries(byCategory.map(c => [c._id || "none", c.n])),
        unread,
    });
});

// opis stylu odpowiedzi, który n8n dokleja do promptu (przed "/:id", żeby nie złapało go jako id)
router.get("/settings/style", async (_req, res) => {
    const st = await InboxSetting.findOne({ key: "style" }).lean();
    res.json({ text: st?.text || "", updatedAt: st?.updatedAt, updatedBy: st?.updatedBy });
});
router.put("/settings/style", async (req: any, res) => {
    const text = typeof req.body?.text === "string" ? req.body.text.slice(0, 6000) : "";
    const st = await InboxSetting.findOneAndUpdate({ key: "style" }, { $set: { text, updatedBy: req.user?.email } }, { upsert: true, new: true }).lean();
    res.json({ text: st.text, updatedAt: st.updatedAt, updatedBy: st.updatedBy });
});

router.get("/:id", validId, async (req, res) => {
    const t = await InboxThread.findByIdAndUpdate(req.params.id, { $set: { unread: false } }, { new: true }).select("-messages.html").lean();
    if (!t) return res.status(404).json({ error: "not found" });
    res.json(t);
});

router.patch("/:id", validId, async (req, res) => {
    const { draftText, category, status, priority } = req.body || {};
    const set: any = {};
    if (typeof draftText === "string") { set["draft.text"] = draftText; set["draft.editedAt"] = new Date(); set["draft.fromAi"] = false; }
    if (category && (INBOX_CATEGORIES as readonly string[]).includes(category)) { set.category = category; set["setByHand.category"] = true; }
    if (status && (INBOX_STATUSES as readonly string[]).includes(status)) set.status = status;
    if (priority === "high" || priority === "normal") { set.priority = priority; set["setByHand.priority"] = true; }
    if (req.body?.unread === true || req.body?.unread === false) set.unread = req.body.unread;
    const t = await InboxThread.findByIdAndUpdate(req.params.id, { $set: set }, { new: true }).select("-messages.html").lean();
    if (!t) return res.status(404).json({ error: "not found" });
    res.json(t);
});

router.post("/:id/regenerate", validId, async (req: any, res) => {
    const t = await InboxThread.findById(req.params.id);
    if (!t) return res.status(404).json({ error: "not found" });
    const instruction = typeof req.body?.instruction === "string" ? req.body.instruction.slice(0, 500) : "";
    // nowy szkic na życzenie zastępuje obecny, także poprawiony ręcznie
    t.draft.editedAt = undefined;
    await t.save();
    const ok = await requestDraft(t, instruction);
    if (!ok) return res.status(502).json({ error: "n8n ist nicht erreichbar oder nicht konfiguriert" });
    res.json({ ok: true });
});

router.post("/:id/send", validId, async (req: any, res) => {
    try {
        const t = await sendReply(req.params.id, String(req.body?.text || ""), req.user?.email || "admin");
        res.json(await InboxThread.findById(t._id).select("-messages.html").lean());
    } catch (err: any) {
        console.error("[inbox] send:", err);
        res.status(err.status || 500).json({ error: err.message });
    }
});

router.get("/:id/attachments/:attId", validId, async (req, res) => {
    const t = await InboxThread.findById(req.params.id).select("messages.attachments").lean();
    const att = t?.messages.flatMap(m => m.attachments || []).find((a: any) => String(a._id) === req.params.attId);
    if (!att) return res.status(404).json({ error: "not found" });
    const file = path.join(INBOX_FILES_DIR, path.basename(att.storedName));
    if (!fs.existsSync(file)) return res.status(404).json({ error: "Datei fehlt" });
    res.setHeader("Content-Type", att.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(att.filename)}`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    fs.createReadStream(file).pipe(res);
});

export default router;
