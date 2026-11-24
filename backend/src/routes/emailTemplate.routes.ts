/**
 * /api/admin/email-templates — szablony maili w panelu (JWT + admin).
 *   GET    /                      lista szablonów (+ które produkty ich używają)
 *   GET    /:key                  pola, zmienne i teksty we wszystkich językach
 *   PUT    /:key                  { lang, content } zapis tekstów jednego języka
 *   DELETE /:key/lang/:lang       przywrócenie domyślnych tekstów języka (wbudowane)
 *   POST   /:key/duplicate        { name } kopia szablonu rezerwacji
 *   DELETE /:key                  usunięcie własnego szablonu (nieużywanego)
 *   POST   /:key/preview          { lang, content? } → { subject, html }
 *   POST   /:key/test             { lang, to, content? } wysyłka testowa
 */
import express, { Response } from "express";
import { protect, admin } from "../middleware/authMiddleware";
import { AuthRequest } from "../types";
import EmailTemplate from "../models/EmailTemplate";
import Product from "../models/Product";
import { FIELDS, MAIL_LANGS, MailLang, PLACEHOLDERS } from "../services/mailTemplateCatalog";
import {
    clearTemplateCache, defaultContent, getTemplate, listTemplates, overrideContent, sanitizeContent,
} from "../services/mailTemplates.service";
import { renderTemplatePreview, sendTemplateTest } from "../services/email.service";

const router = express.Router();
router.use(protect, admin);

const isLang = (l: any): l is MailLang => (MAIL_LANGS as string[]).includes(String(l));
const who = (req: AuthRequest) => (req.user as any)?.email || String((req.user as any)?._id || "");

router.get("/", async (_req, res: Response) => {
    const [templates, products, docs] = await Promise.all([
        listTemplates(),
        Product.find().select("title.de slug emailTemplate durationDays status").lean(),
        EmailTemplate.find().select("key content updatedAt updatedBy").lean(),
    ]);
    const byKey = new Map(docs.map((d: any) => [d.key, d]));
    res.json({
        templates: templates.map((t) => {
            const d: any = byKey.get(t.key);
            return {
                ...t,
                editedLangs: d ? Object.keys(d.content || {}).filter((l) => d.content[l] && Object.keys(d.content[l]).length) : [],
                updatedAt: d?.updatedAt ?? null,
                updatedBy: d?.updatedBy ?? null,
                products: t.kind === "booking"
                    ? products.filter((p: any) => p.emailTemplate === t.key).map((p: any) => ({ _id: p._id, title: p.title?.de || p.slug, status: p.status }))
                    : [],
            };
        }),
        productsWithoutTemplate: products.filter((p: any) => !p.emailTemplate && p.status === "active").map((p: any) => ({ _id: p._id, title: p.title?.de || p.slug })),
    });
});

router.get("/:key", async (req, res: Response) => {
    const t = await getTemplate(req.params.key);
    if (!t) return res.status(404).json({ message: "Vorlage nicht gefunden" });
    const content: Record<string, any> = {};
    const defaults: Record<string, any> = {};
    const edited: Record<string, boolean> = {};
    for (const l of t.languages) {
        defaults[l] = defaultContent(t, l);
        const over = await overrideContent(t.key, l);
        content[l] = { ...defaults[l], ...(over || {}) };
        edited[l] = !!over && Object.keys(over).length > 0;
    }
    res.json({ template: t, fields: FIELDS[t.kind], placeholders: PLACEHOLDERS[t.kind], content, defaults, edited });
});

router.put("/:key", async (req: AuthRequest, res: Response) => {
    const t = await getTemplate(req.params.key);
    if (!t) return res.status(404).json({ message: "Vorlage nicht gefunden" });
    const { lang, content } = req.body || {};
    if (!isLang(lang) || !t.languages.includes(lang)) return res.status(400).json({ message: "Sprache nicht verfügbar" });
    const clean = sanitizeContent(t.kind, content);
    // Wbudowane: zapisujemy tylko pola różne od domyślnych (zmiana domyślnych w kodzie dalej działa)
    let toSave = clean;
    if (!t.custom) {
        const def = defaultContent(t, lang);
        toSave = Object.fromEntries(Object.entries(clean).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(def[k])));
    }
    await EmailTemplate.updateOne(
        { key: t.key },
        { $set: { [`content.${lang}`]: toSave, kind: t.kind, updatedBy: who(req) }, $setOnInsert: { custom: false } },
        { upsert: true },
    );
    clearTemplateCache();
    res.json({ ok: true, changedFields: Object.keys(toSave).length });
});

router.delete("/:key/lang/:lang", async (req: AuthRequest, res: Response) => {
    const t = await getTemplate(req.params.key);
    if (!t || t.custom) return res.status(400).json({ message: "Nur für Standardvorlagen" });
    if (!isLang(req.params.lang)) return res.status(400).json({ message: "Sprache unbekannt" });
    await EmailTemplate.updateOne({ key: t.key }, { $unset: { [`content.${req.params.lang}`]: 1 }, $set: { updatedBy: who(req) } });
    clearTemplateCache();
    res.json({ ok: true });
});

router.post("/:key/duplicate", async (req: AuthRequest, res: Response) => {
    const t = await getTemplate(req.params.key);
    if (!t || t.kind !== "booking") return res.status(400).json({ message: "Nur Buchungsvorlagen können kopiert werden" });
    const name = String(req.body?.name || "").trim().slice(0, 120);
    if (!name) return res.status(400).json({ message: "Bitte einen Namen angeben" });
    const baseKey = t.custom ? t.baseKey! : t.key;
    const content: Record<string, any> = {};
    for (const l of t.languages) content[l] = { ...defaultContent(t, l), ...((await overrideContent(t.key, l)) || {}) };
    const key = `booking-custom-${Date.now().toString(36)}`;
    await EmailTemplate.create({ key, name, kind: "booking", custom: true, baseKey, content, updatedBy: who(req) });
    clearTemplateCache();
    res.status(201).json({ key });
});

router.delete("/:key", async (req, res: Response) => {
    const t = await getTemplate(req.params.key);
    if (!t || !t.custom) return res.status(400).json({ message: "Nur eigene Vorlagen können gelöscht werden" });
    const used = await Product.countDocuments({ emailTemplate: t.key });
    if (used) return res.status(409).json({ message: `Die Vorlage wird von ${used} Produkt(en) verwendet` });
    await EmailTemplate.deleteOne({ key: t.key });
    clearTemplateCache();
    res.json({ ok: true });
});

router.post("/:key/preview", async (req, res: Response) => {
    const t = await getTemplate(req.params.key);
    if (!t) return res.status(404).json({ message: "Vorlage nicht gefunden" });
    const lang = isLang(req.body?.lang) ? req.body.lang : "de";
    try {
        const content = req.body?.content ? sanitizeContent(t.kind, req.body.content) : undefined;
        res.json(await renderTemplatePreview(t.key, lang, content));
    } catch (e: any) {
        res.status(500).json({ message: e.message || "Vorschau fehlgeschlagen" });
    }
});

router.post("/:key/test", async (req: AuthRequest, res: Response) => {
    const t = await getTemplate(req.params.key);
    if (!t) return res.status(404).json({ message: "Vorlage nicht gefunden" });
    const lang = isLang(req.body?.lang) ? req.body.lang : "de";
    const to = String(req.body?.to || (req.user as any)?.email || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return res.status(400).json({ message: "Bitte eine gültige E-Mail-Adresse angeben" });
    try {
        const content = req.body?.content ? sanitizeContent(t.kind, req.body.content) : undefined;
        const subject = await sendTemplateTest(t.key, lang, to, content);
        res.json({ ok: true, to, subject });
    } catch (e: any) {
        res.status(500).json({ message: e.message || "Versand fehlgeschlagen" });
    }
});

export default router;
