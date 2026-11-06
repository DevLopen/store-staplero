/**
 * Skrzynka w panelu: przyjmowanie maili (formularz + IMAP przez n8n), łączenie w wątki,
 * zlecanie szkicu odpowiedzi do n8n i wysyłka odpowiedzi.
 *
 * Przepływ (domyślnie wszystko w backendzie, bez n8n):
 *   formularz /api/contact ──► createFromForm ─┐
 *   cron IMAP (inboxImap.service) ─────────────┼► wątek w Mongo ──► requestDraft ──► OpenAI ──► kategoria, streszczenie, szkic
 *   n8n (opcjonalnie) ──► /api/inbox/hook/* ───┘                     (albo webhook n8n, gdy ustawione N8N_INBOX_WEBHOOK_URL)
 *   panel ──► POST /api/inbox/:id/send ──► SMTP skrzynki info@ (albo Resend, gdy SMTP nie ustawione)
 */
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { nanoid } from "nanoid";
import InboxThread, { InboxThreadDoc, InboxMessage, InboxAttachment, INBOX_CATEGORIES, InboxCategory } from "../models/InboxThread";
import Order from "../models/Order";
import Location from "../models/Location";
import InboxSetting from "../models/InboxSetting";
import { STAPLERO_KNOWLEDGE } from "./staplero.knowledge";
import OpenAI from "openai";
import { buildOpenAiBody } from "./inboxPrompt";

// ─── Konfiguracja ─────────────────────────────────────────────────────────────

export const INBOX_FILES_DIR = process.env.INBOX_FILES_DIR || path.join(process.cwd(), "inbox-files");
const INBOX_FROM = process.env.INBOX_FROM || "STAPLERO <info@staplero.com>";
const MESSAGE_ID_DOMAIN = (INBOX_FROM.match(/@([^>\s]+)/)?.[1] || "staplero.com").toLowerCase();
const N8N_WEBHOOK = process.env.N8N_INBOX_WEBHOOK_URL || "";
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

/** Adresy, z których maile nie są rozmową z klientem (powiadomienia sklepu, nasza własna skrzynka). */
const ownAddresses = (): string[] => {
    const list = [
        process.env.FROM_EMAIL || "noreply@staplero.com",
        INBOX_FROM,
        ...(process.env.INBOX_IGNORE_FROM || "").split(","),
    ];
    return list.map(a => (a.match(/<([^>]+)>/)?.[1] || a).trim().toLowerCase()).filter(Boolean);
};

const resend = new Resend(process.env.RESEND_API_KEY);
const smtp = process.env.INBOX_SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.INBOX_SMTP_HOST,
        port: Number(process.env.INBOX_SMTP_PORT || 465),
        secure: Number(process.env.INBOX_SMTP_PORT || 465) === 465,
        ...(process.env.INBOX_SMTP_USER ? { auth: { user: process.env.INBOX_SMTP_USER, pass: process.env.INBOX_SMTP_PASS } } : {}),
    })
    : null;

// ─── Pomocnicze ───────────────────────────────────────────────────────────────

const normId = (id?: string | null): string | undefined => {
    const v = (id || "").trim();
    if (!v) return undefined;
    return v.startsWith("<") ? v : `<${v}>`;
};
const parseRefs = (refs?: string | string[] | null): string[] =>
    (Array.isArray(refs) ? refs.join(" ") : refs || "").match(/<[^>]+>/g) || [];
const newMessageId = (prefix: string) => `<${prefix}-${nanoid(16)}@${MESSAGE_ID_DOMAIN}>`;

/** „AW: Re: Fwd: Termin” → „termin”, do łączenia wątków po temacie, gdy klient nie ma nagłówków. */
const baseSubject = (s: string) =>
    s.replace(/^\s*((re|aw|wg|fw|fwd|odp|antw)\s*(\[\d+\])?\s*:\s*)+/i, "").trim().toLowerCase();

const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Usuwa cytowaną historię i typowe stopki, żeby AI i podgląd widziały tylko nową treść. */
export const stripQuoted = (text: string): string => {
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    const out: string[] = [];
    for (const line of lines) {
        const t = line.trim();
        if (/^(am|on|dnia|w dniu)\b.*(schrieb|wrote|napisał|napisała|пише|написал)/i.test(t)) break;
        if (/^-{2,}\s*(original|ursprüngliche|oryginalna|weitergeleitete)/i.test(t)) break;
        if (/^(von|from|od):\s.+/i.test(t) && out.length > 0) break;
        if (t.startsWith(">")) continue;
        out.push(line);
    }
    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

export const htmlToText = (html: string) =>
    html
        .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, "\n\n")
        .trim();

const saveAttachments = async (list: IngestAttachment[] = []): Promise<InboxAttachment[]> => {
    if (!list.length) return [];
    await fs.mkdir(INBOX_FILES_DIR, { recursive: true });
    const saved: InboxAttachment[] = [];
    for (const a of list) {
        if (!a?.contentBase64) continue;
        const buf = Buffer.from(a.contentBase64, "base64");
        if (!buf.length || buf.length > MAX_ATTACHMENT_BYTES) continue;
        const filename = (a.filename || "anhang").replace(/[\\/\0]/g, "_").slice(0, 180);
        const ext = path.extname(filename).replace(/[^.\w]/g, "").slice(0, 10);
        const storedName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
        await fs.writeFile(path.join(INBOX_FILES_DIR, storedName), buf);
        saved.push({ filename, storedName, mimeType: a.mimeType || "application/octet-stream", size: buf.length });
    }
    return saved;
};

// ─── Przyjmowanie wiadomości ──────────────────────────────────────────────────

export interface IngestAttachment { filename?: string; mimeType?: string; contentBase64?: string }
export interface IngestEmail {
    messageId?: string;
    inReplyTo?: string;
    references?: string | string[];
    fromName?: string;
    fromEmail: string;
    to?: string;
    subject?: string;
    text?: string;
    html?: string;
    date?: string;
    attachments?: IngestAttachment[];
}

export type IngestResult =
    | { status: "skipped"; reason: string }
    | { status: "duplicate"; threadId: string }
    | { status: "created" | "appended"; threadId: string };

export const ingestEmail = async (m: IngestEmail): Promise<IngestResult> => {
    const fromEmail = (m.fromEmail || "").trim().toLowerCase();
    if (!fromEmail || !fromEmail.includes("@")) return { status: "skipped", reason: "no sender" };
    // powiadomienie z formularza (noreply@) jest już w bazie jako wątek z formularza; nasze własne maile też pomijamy
    if (ownAddresses().includes(fromEmail)) return { status: "skipped", reason: "own address" };

    const messageId = normId(m.messageId) || newMessageId("in");
    const dup = await InboxThread.findOne({ "messages.messageId": messageId }).select("_id");
    if (dup) return { status: "duplicate", threadId: String(dup._id) };

    const inReplyTo = normId(m.inReplyTo);
    const references = parseRefs(m.references);
    const subject = (m.subject || "").trim() || "(ohne Betreff)";
    const rawText = m.text?.trim() ? m.text : m.html ? htmlToText(m.html) : "";

    const message: InboxMessage = {
        direction: "in",
        source: "email",
        messageId,
        inReplyTo,
        references: references.length ? references : undefined,
        fromName: m.fromName?.trim() || undefined,
        fromEmail,
        to: m.to,
        subject,
        text: stripQuoted(rawText) || rawText.trim(),
        html: m.html,
        attachments: await saveAttachments(m.attachments),
        date: m.date && !isNaN(Date.parse(m.date)) ? new Date(m.date) : new Date(),
    };

    // 1) po nagłówkach (klient odpowiedział na naszą odpowiedź), 2) ten sam klient + ten sam temat w ostatnich 60 dniach
    const ids = [inReplyTo, ...references].filter(Boolean) as string[];
    let thread: InboxThreadDoc | null = ids.length
        ? await InboxThread.findOne({ "messages.messageId": { $in: ids } })
        : null;
    if (!thread) {
        const since = new Date(Date.now() - 60 * 24 * 3600 * 1000);
        const candidates = await InboxThread.find({ "customer.email": fromEmail, lastMessageAt: { $gte: since } })
            .sort({ lastMessageAt: -1 }).limit(10);
        thread = candidates.find(t => baseSubject(t.subject) === baseSubject(subject) && baseSubject(subject) !== "") || null;
    }

    if (thread) {
        thread.messages.push(message);
        thread.lastMessageAt = message.date > thread.lastMessageAt ? message.date : thread.lastMessageAt;
        thread.lastInboundAt = message.date;
        thread.unread = true;
        thread.status = "new";
        if (!thread.customer.name && message.fromName) thread.customer.name = message.fromName;
        await thread.save();
        void requestDraft(thread);
        return { status: "appended", threadId: String(thread._id) };
    }

    const created = await InboxThread.create({
        subject,
        customer: { name: message.fromName, email: fromEmail },
        source: "email",
        status: "new",
        unread: true,
        messages: [message],
        lastMessageAt: message.date,
        lastInboundAt: message.date,
    });
    void requestDraft(created);
    return { status: "created", threadId: String(created._id) };
};

export const createFromForm = async (f: { name: string; email: string; phone?: string; company?: string; message: string }) => {
    const now = new Date();
    const thread = await InboxThread.create({
        subject: `Kontaktanfrage von ${f.name}`,
        customer: { name: f.name, email: f.email.trim().toLowerCase(), phone: f.phone || undefined, company: f.company || undefined },
        source: "form",
        status: "new",
        unread: true,
        messages: [{
            direction: "in",
            source: "form",
            messageId: newMessageId("form"),
            fromName: f.name,
            fromEmail: f.email.trim().toLowerCase(),
            subject: "Kontaktformular",
            text: f.message,
            attachments: [],
            date: now,
        }],
        lastMessageAt: now,
        lastInboundAt: now,
    });
    void requestDraft(thread);
    return thread;
};

// ─── Szkic odpowiedzi (n8n) ───────────────────────────────────────────────────

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

/**
 * Zleca kategorię i szkic: wbudowane OpenAI albo webhook n8n (gdy ustawione N8N_INBOX_WEBHOOK_URL).
 * Nie czeka na wynik i nie rzuca: brak AI nie może blokować formularza ani panelu.
 */
export const requestDraft = async (thread: InboxThreadDoc, instruction?: string): Promise<boolean> => {
    const id = String(thread._id);
    await InboxThread.updateOne({ _id: thread._id }, {
        $set: { "ai.status": "pending", "ai.requestedAt": new Date(), "ai.instruction": instruction || undefined, "ai.error": undefined },
    });
    if (!N8N_WEBHOOK) {
        if (!process.env.OPENAI_API_KEY) {
            await InboxThread.updateOne({ _id: thread._id }, { $set: { "ai.status": "failed", "ai.error": "OPENAI_API_KEY nicht gesetzt" } });
            return false;
        }
        void generateDraft(id);
        return true;
    }
    try {
        const res = await fetch(N8N_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-inbox-secret": process.env.INBOX_HOOK_SECRET || "" },
            body: JSON.stringify({ threadId: id, instruction: instruction || "" }),
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error(`n8n antwortete ${res.status}`);
        return true;
    } catch (err: any) {
        console.error("[inbox] KI-Entwurf konnte nicht angefordert werden:", err.message);
        await InboxThread.updateOne({ _id: thread._id }, { $set: { "ai.status": "failed", "ai.error": err.message } });
        return false;
    }
};

/** Szkic przez OpenAI bezpośrednio z backendu (ten sam prompt co w n8n, inboxPrompt.ts). */
const generateDraft = async (id: string) => {
    try {
        const ctx = await threadForAi(id);
        if (!ctx) return;
        const completion: any = await openai.chat.completions.create(buildOpenAiBody(ctx) as any, { timeout: 90000, maxRetries: 2 });
        const raw = completion.choices?.[0]?.message?.content || "";
        let result: AiResult;
        try { result = JSON.parse(raw); } catch { result = { error: "KI-Antwort war kein JSON" }; }
        await applyAiResult(id, result);
    } catch (err: any) {
        console.error("[inbox] OpenAI:", err.message);
        await applyAiResult(id, { error: `OpenAI: ${err.message}` });
    }
};

/** Kurs trwa 2 dni od startu (2 x 8 h). W terminach data końca bywa równa dacie startu, więc drugi dzień liczymy sami. */
const courseSpan = (start: string, end: string | undefined, time: string) => {
    const s = new Date(`${start}T12:00:00Z`);
    if (isNaN(s.getTime())) return `${start} ${time}`;
    const e = end && end > start ? new Date(`${end}T12:00:00Z`) : new Date(s.getTime() + 86400000);
    const f = (d: Date, y = false) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", ...(y ? { year: "numeric" } : {}), timeZone: "UTC" });
    return `Kursstart ${f(s, true)} (2 Tage: ${f(s)} und ${f(e, true)}, jeweils ${time})`;
};

/**
 * Wcześniejsze odpowiedzi wysłane z panelu jako wzór stylu: najpierw ta sama kategoria, potem najnowsze.
 * Każda odpowiedź z panelu od razu staje się przykładem dla kolejnych szkiców.
 */
const pastReplies = async (excludeId: string, category?: string, limit = 4): Promise<string> => {
    const base = { _id: { $ne: excludeId }, "messages.direction": "out" };
    const pick = async (filter: any, n: number) =>
        n > 0 ? InboxThread.find(filter).sort({ lastMessageAt: -1 }).limit(n).select("category messages").lean() : [];
    const same = category ? await pick({ ...base, category }, limit) : [];
    const rest = await pick({ ...base, _id: { $nin: [excludeId, ...same.map(x => x._id)] } }, limit - same.length);
    return [...same, ...rest].map(th => {
        const msgs = th.messages;
        const outIdx = msgs.map(m => m.direction).lastIndexOf("out");
        const q = msgs.slice(0, outIdx).reverse().find(m => m.direction === "in");
        return `[Kategorie ${th.category || "?"}]\nKUNDE: ${(q?.text || "").slice(0, 700)}\nUNSERE ANTWORT: ${msgs[outIdx].text.slice(0, 1200)}`;
    }).join("\n\n---\n\n");
};

/** Dane wątku dla n8n: rozmowa, zamówienia klienta i wiedza o ofercie, gotowe do wklejenia w prompt. */
export const threadForAi = async (id: string) => {
    const t = await InboxThread.findById(id).lean();
    if (!t) return null;

    const orders = await Order.find({ "userDetails.email": t.customer.email })
        .sort({ createdAt: -1 }).limit(5).lean();
    const ordersText = orders.map((o: any) => {
        const pc = o.practicalCourseDetails;
        const course = pc ? `${pc.locationName}, ${courseSpan(pc.startDate, pc.endDate, pc.time)}` : "";
        return `- ${o.orderNumber} (${new Date(o.createdAt).toLocaleDateString("de-DE")}): ${(o.items || []).map((i: any) => i.courseName).join(", ")}, Status ${o.status}, ${Number(o.totalAmount || 0).toFixed(2)} €${course ? `, Termin: ${course}` : ""}`;
    }).join("\n");

    const today = new Date().toISOString().slice(0, 10);
    const locations = await Location.find({ isActive: true }).lean();
    const datesText = locations.map((l: any) => {
        const next = (l.dates || [])
            .filter((d: any) => d.startDate >= today && d.availableSpots > 0)
            .sort((a: any, b: any) => a.startDate.localeCompare(b.startDate))
            .slice(0, 4)
            .map((d: any) => `${courseSpan(d.startDate, d.endDate, d.time)}${d.languages?.length ? `, Sprache ${d.languages.join("/")}` : ""}, ${d.availableSpots} Plätze frei`);
        return `- ${l.city}:${next.length ? next.map((x: string) => `\n  · ${x}`).join("") : " derzeit keine freien Termine"}`;
    }).join("\n");

    const conversation = t.messages.slice(-10).map(m =>
        `[${m.direction === "in" ? "KUNDE" : "STAPLERO"} ${new Date(m.date).toLocaleString("de-DE")}${m.source === "form" ? ", Kontaktformular" : ""}]\n` +
        `${m.text.slice(0, 4000)}` +
        (m.attachments?.length ? `\n(Anhänge: ${m.attachments.map(a => a.filename).join(", ")})` : "")
    ).join("\n\n");

    const [style, examples] = await Promise.all([
        InboxSetting.findOne({ key: "style" }).lean(),
        pastReplies(String(t._id), t.category),
    ]);

    return {
        threadId: String(t._id),
        subject: t.subject,
        source: t.source,
        customer: t.customer,
        instruction: t.ai?.instruction || "",
        currentDraft: t.draft?.text || "",
        conversation,
        orders: ordersText || "keine Bestellungen mit dieser E-Mail-Adresse",
        upcomingDates: datesText
            ? `Jeder Kurs dauert 2 Tage (2 x 8 Stunden), gezählt ab dem Kursstart.\n${datesText}`
            : "keine",
        knowledge: STAPLERO_KNOWLEDGE,
        styleGuide: style?.text?.trim() || "",
        examples,
        categories: INBOX_CATEGORIES,
        today,
    };
};

export interface AiResult {
    summary_de?: string;
    category?: string;
    priority?: string;
    language?: string;
    summary?: string;
    draft?: string;
    confidence?: number;
    error?: string;
}

export const applyAiResult = async (id: string, r: AiResult) => {
    const t = await InboxThread.findById(id);
    if (!t) return null;
    if (r.error) {
        t.ai.status = "failed";
        t.ai.error = String(r.error).slice(0, 500);
        await t.save();
        return t;
    }
    if (r.summary_de && !r.summary) r.summary = r.summary_de;
    // bez pauz w tekstach do klientów
    if (r.draft) r.draft = r.draft.replace(/\s[–—]\s/g, ", ").replace(/[–—]/g, "-");
    if (!t.setByHand?.category && r.category && (INBOX_CATEGORIES as readonly string[]).includes(r.category)) t.category = r.category as InboxCategory;
    if (!t.setByHand?.priority && (r.priority === "high" || r.priority === "normal")) t.priority = r.priority;
    if (r.language) t.language = String(r.language).slice(0, 5).toLowerCase();
    if (r.summary) t.summary = String(r.summary).slice(0, 600);
    if (typeof r.confidence === "number") t.ai.confidence = Math.max(0, Math.min(1, r.confidence));

    const draft = (r.draft || "").trim();
    if (draft) {
        t.ai.suggestion = draft;
        // ręcznych poprawek nie nadpisujemy; panel pokaże wtedy „KI-Vorschlag übernehmen”
        const editedByHand = t.draft.editedAt && (!t.ai.requestedAt || t.draft.editedAt > t.ai.requestedAt);
        if (!editedByHand || !t.draft.text.trim()) {
            t.draft.text = draft;
            t.draft.fromAi = true;
            t.draft.editedAt = undefined;
        }
        if (t.status === "new") t.status = "draft";
    }
    if (t.category === "spam" && t.status !== "sent") t.status = "archived";
    t.ai.status = "ready";
    t.ai.error = undefined;
    t.ai.generatedAt = new Date();
    await t.save();
    return t;
};

// ─── Wysyłka odpowiedzi ───────────────────────────────────────────────────────

const SIGNATURE_TEXT = `--
STAPLERO
+49 160 92490070 · +49 176 22067783
info@staplero.com · https://staplero.de`;

const textToHtml = (text: string) =>
    text.trim().split(/\n{2,}/).map(par => `<p style="margin:0 0 14px">${escapeHtml(par).replace(/\n/g, "<br>")}</p>`).join("");

const buildBodies = (reply: string, quoted?: InboxMessage) => {
    const quoteHeader = quoted
        ? `Am ${new Date(quoted.date).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" })} schrieb ${quoted.fromName ? `${quoted.fromName} <${quoted.fromEmail}>` : quoted.fromEmail}:`
        : "";
    const text = `${reply.trim()}\n\n${SIGNATURE_TEXT}` +
        (quoted ? `\n\n${quoteHeader}\n${quoted.text.split("\n").map(l => `> ${l}`).join("\n")}` : "");
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#111">` +
        textToHtml(reply) +
        `<p style="margin:22px 0 0;font-size:13px;color:#555">STAPLERO<br>+49 160 92490070 · +49 176 22067783<br>` +
        `<a href="mailto:info@staplero.com" style="color:#555">info@staplero.com</a> · <a href="https://staplero.de" style="color:#555">staplero.de</a></p>` +
        (quoted
            ? `<p style="margin:24px 0 6px;font-size:13px;color:#777">${escapeHtml(quoteHeader)}</p>` +
              `<blockquote style="margin:0;padding:0 0 0 12px;border-left:3px solid #ddd;color:#555;font-size:14px">${textToHtml(quoted.text)}</blockquote>`
            : "") +
        `</div>`;
    return { text, html };
};

export const sendReply = async (id: string, replyText: string, sentBy: string) => {
    const t = await InboxThread.findById(id);
    if (!t) throw Object.assign(new Error("Nachricht nicht gefunden"), { status: 404 });
    const body = replyText.trim();
    if (body.length < 2) throw Object.assign(new Error("Die Antwort ist leer"), { status: 400 });

    const lastIn = [...t.messages].reverse().find(m => m.direction === "in");
    const subjectBase = t.source === "form" ? "Ihre Anfrage bei STAPLERO" : t.subject;
    const subject = /^(re|aw):/i.test(subjectBase) ? subjectBase : `Re: ${subjectBase}`;
    const messageId = newMessageId("reply");
    // ID wiadomości z formularza klient nigdy nie widział, więc nie wstawiamy jej do nagłówków
    const parent = lastIn && lastIn.source === "email" ? lastIn : undefined;
    const references = parent ? [...(parent.references || []), parent.messageId].slice(-10) : [];
    const { text, html } = buildBodies(body, lastIn);
    const to = t.customer.name ? `"${t.customer.name.replace(/"/g, "")}" <${t.customer.email}>` : t.customer.email;

    if (smtp) {
        await smtp.sendMail({
            from: INBOX_FROM,
            to,
            subject,
            text,
            html,
            messageId,
            ...(parent ? { inReplyTo: parent.messageId, references } : {}),
        });
    } else {
        const { error } = await resend.emails.send({
            from: INBOX_FROM,
            to: [t.customer.email],
            replyTo: INBOX_FROM,
            subject,
            text,
            html,
            headers: {
                "Message-ID": messageId,
                ...(parent ? { "In-Reply-To": parent.messageId, References: references.join(" ") } : {}),
            },
        });
        if (error) throw new Error(`Senden fehlgeschlagen: ${error.message || error.name}`);
    }

    const now = new Date();
    const aiDraft = t.ai?.suggestion?.trim() || undefined;
    t.messages.push({
        direction: "out",
        source: "panel",
        messageId,
        inReplyTo: parent?.messageId,
        references: references.length ? references : undefined,
        fromName: "STAPLERO",
        fromEmail: (INBOX_FROM.match(/<([^>]+)>/)?.[1] || INBOX_FROM).toLowerCase(),
        to: t.customer.email,
        subject,
        text: body,
        attachments: [],
        date: now,
        sentBy,
        aiDraft,
    });
    t.status = "sent";
    t.unread = false;
    t.lastMessageAt = now;
    t.draft = { text: "", fromAi: false, editedAt: undefined };
    t.ai.suggestion = undefined;
    await t.save();
    return t;
};
