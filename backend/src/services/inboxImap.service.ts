/**
 * Skrzynka info@ przez IMAP (bez n8n).
 *
 * - Synchronizacja przy pierwszym połączeniu (syncMailbox): cała skrzynka z ostatnich miesięcy (INBOX + „Gesendet”)
 *   trafia do panelu, żeby dało się z niego korzystać jak ze zwykłej skrzynki:
 *     rozmowy z naszą odpowiedzią → „Beantwortet”, bez odpowiedzi z ostatnich openDays dni → „Offen” ze szkicem AI,
 *     starsze bez odpowiedzi → „Archiv”. Potem AI tworzy opis stylu z naszych odpowiedzi (gdy jest pusty).
 * - Bieżący odbiór (pollInbox): cron co 2 minuty albo przycisk „Abrufen” w panelu. Nowe maile z INBOX i nowe
 *   odpowiedzi z „Gesendet” (wysłane z Outlooka/telefonu zamykają rozmowę w panelu).
 * - Odpowiedzi z panelu dopisujemy do „Gesendet” (appendToSent), żeby Outlook widział to samo co panel.
 *
 * Maile w skrzynce zostają nieprzeczytane (BODY.PEEK). Pozycję trzymamy w InboxSetting (UIDVALIDITY + ostatni UID).
 */
import { ImapFlow } from "imapflow";
import { simpleParser, AddressObject } from "mailparser";
import MailComposer from "nodemailer/lib/mail-composer";
import type Mail from "nodemailer/lib/mailer";
import InboxSetting from "../models/InboxSetting";
import InboxThread from "../models/InboxThread";
import { ingestEmail, ingestHistory, analyzeStyle, requestDraft, isOwnAddress, IngestEmail } from "./inbox.service";

const cfg = () => ({
    host: process.env.INBOX_IMAP_HOST || process.env.INBOX_SMTP_HOST || "",
    port: Number(process.env.INBOX_IMAP_PORT || 993),
    user: process.env.INBOX_IMAP_USER || process.env.INBOX_SMTP_USER || "",
    pass: process.env.INBOX_IMAP_PASS || process.env.INBOX_SMTP_PASS || "",
    mailbox: process.env.INBOX_IMAP_MAILBOX || "INBOX",
    syncMonths: Number(process.env.INBOX_HISTORY_MONTHS || 12),
    syncMax: Number(process.env.INBOX_HISTORY_MAX || 3000),
    // bez odpowiedzi i młodsze niż tyle dni = „Offen” ze szkicem; starsze = archiwum
    openDays: Number(process.env.INBOX_OPEN_DAYS || 14),
    // załączniki zapisujemy tylko z maili z ostatnich N dni (starsze zostają w skrzynce)
    attachmentDays: Number(process.env.INBOX_ATTACHMENT_DAYS || 60),
});

export const imapEnabled = () => {
    const c = cfg();
    return process.env.INBOX_IMAP_ENABLED !== "false" && !!c.host && !!c.user && !!c.pass;
};

const firstAddress = (a?: AddressObject | AddressObject[]) => (Array.isArray(a) ? a[0] : a)?.value?.[0];
const addrText = (a?: AddressObject | AddressObject[]) => (Array.isArray(a) ? a.map(t => t.text).join(", ") : a?.text) || "";

const toIngest = (p: Awaited<ReturnType<typeof simpleParser>>, withAttachments: boolean): IngestEmail => {
    const from = firstAddress(p.from);
    return {
        messageId: p.messageId,
        inReplyTo: typeof p.inReplyTo === "string" ? p.inReplyTo : undefined,
        references: p.references,
        fromName: from?.name || "",
        fromEmail: (from?.address || "").toLowerCase(),
        to: addrText(p.to),
        subject: p.subject || "",
        text: p.text || "",
        html: typeof p.html === "string" ? p.html : "",
        date: p.date?.toISOString(),
        attachments: withAttachments
            ? p.attachments
                .filter(a => a.size <= 15 * 1024 * 1024 && a.contentDisposition !== "inline")
                .map(a => ({ filename: a.filename || "anhang", mimeType: a.contentType, contentBase64: a.content.toString("base64") }))
            : [],
    };
};

/** Powiadomienie z formularza (jest już w panelu), autoodpowiedzi, zwrotki, newslettery: nie są rozmową z klientem. */
const skipReason = (m: IngestEmail, headers: Map<string, any>): string | null => {
    if (/^neue kontaktanfrage von/i.test(m.subject || "") && m.fromEmail.startsWith("noreply@")) return "form notification";
    if (isOwnAddress(m.fromEmail)) return "own address";
    const auto = String(headers.get("auto-submitted") || headers.get("x-autoreply") || "").toLowerCase();
    if (auto && auto !== "no") return "auto reply";
    if (/^(mailer-daemon|postmaster)@/i.test(m.fromEmail)) return "bounce";
    // mailparser zbiera nagłówki List-* w obiekt "list"
    const list: any = headers.get("list");
    if (/^(bulk|junk|list)$/i.test(String(headers.get("precedence") || "")) || list?.unsubscribe || headers.get("list-unsubscribe")) return "newsletter";
    return null;
};

const newClient = () => {
    const c = cfg();
    return new ImapFlow({ host: c.host, port: c.port, secure: c.port === 993, auth: { user: c.user, pass: c.pass }, logger: false, socketTimeout: 120000 });
};

const readState = async (key: string): Promise<any> => {
    const st = await InboxSetting.findOne({ key }).lean();
    try { return JSON.parse(st?.text || "null"); } catch { return null; }
};
const writeState = (key: string, v: unknown) =>
    InboxSetting.updateOne({ key }, { $set: { text: JSON.stringify(v) } }, { upsert: true });

const findSentFolder = async (client: ImapFlow) => {
    const boxes = await client.list();
    return boxes.find(b => b.specialUse === "\\Sent")
        || boxes.find(b => /^(inbox[./])?(sent|gesendet|gesendete( objekte| elemente)?|sent items|sent messages)$/i.test(b.path)) || null;
};

/** Ostatnie pobranie: pokazujemy w panelu (czas, wynik albo błąd logowania). */
export const lastPoll = () => readState("imap_last");

// ─── Bieżący odbiór ───────────────────────────────────────────────────────────

export type PollResult = { ok: boolean; imported: number; skipped: number; answeredElsewhere: number; error?: string; at: string };
let running: Promise<PollResult> | null = null;

/** Nowe maile z INBOX i nowe odpowiedzi z „Gesendet”. Równoległe wywołania (cron + przycisk) dostają ten sam wynik. */
export const pollInbox = (): Promise<PollResult> => {
    if (!imapEnabled()) return Promise.resolve({ ok: false, imported: 0, skipped: 0, answeredElsewhere: 0, error: "IMAP nicht eingerichtet (INBOX_IMAP_HOST/USER/PASS in backend/.env)", at: new Date().toISOString() });
    if (!running) running = doPoll().finally(() => { running = null; });
    return running;
};

const doPoll = async (): Promise<PollResult> => {
    const c = cfg();
    const client = newClient();
    const res: PollResult = { ok: true, imported: 0, skipped: 0, answeredElsewhere: 0, at: new Date().toISOString() };
    try {
        await client.connect();
        // INBOX
        {
            const lock = await client.getMailboxLock(c.mailbox);
            try {
                const box = client.mailbox as any;
                const uidValidity = String(box.uidValidity);
                let saved = (await readState("imap_state")) || {};
                let uids: number[] = [];
                if (!saved.lastUid || saved.uidValidity !== uidValidity) {
                    // przeszłość zbiera synchronizacja; tu zapamiętujemy tylko pozycję
                    saved = { uidValidity, lastUid: Math.max(0, (box.uidNext || 1) - 1) };
                } else {
                    uids = ((await client.search({ uid: `${saved.lastUid + 1}:*` }, { uid: true })) || []).filter(u => u > saved.lastUid).sort((a, b) => a - b).slice(0, 300);
                }
                for (const uid of uids) {
                    const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
                    if (msg && msg.source) {
                        const p = await simpleParser(msg.source);
                        const mail = toIngest(p, true);
                        if (skipReason(mail, p.headers)) res.skipped++;
                        else {
                            const r = await ingestEmail(mail);
                            if (r.status === "created" || r.status === "appended") res.imported++; else res.skipped++;
                        }
                    }
                    saved.lastUid = Math.max(saved.lastUid || 0, uid);
                    await writeState("imap_state", saved);
                }
                await writeState("imap_state", saved);
            } finally { lock.release(); }
        }
        // Gesendet: odpowiedzi wysłane poza panelem
        const sent = await findSentFolder(client);
        if (sent) {
            const lock = await client.getMailboxLock(sent.path);
            try {
                const box = client.mailbox as any;
                const uidValidity = String(box.uidValidity);
                let saved = (await readState("imap_sent_state")) || {};
                if (!saved.lastUid || saved.uidValidity !== uidValidity) {
                    saved = { uidValidity, lastUid: Math.max(0, (box.uidNext || 1) - 1) };
                } else {
                    const uids = ((await client.search({ uid: `${saved.lastUid + 1}:*` }, { uid: true })) || []).filter(u => u > saved.lastUid).sort((a, b) => a - b).slice(0, 300);
                    if (uids.length) for await (const msg of client.fetch(uids, { source: true }, { uid: true })) {
                        if (msg.source) {
                            const r = await ingestHistory(toIngest(await simpleParser(msg.source), false), "out");
                            if (r === "appended") res.answeredElsewhere++;
                        }
                        saved.lastUid = Math.max(saved.lastUid || 0, msg.uid);
                    }
                }
                await writeState("imap_sent_state", saved);
            } finally { lock.release(); }
        }
        await client.logout();
        if (res.imported || res.answeredElsewhere) console.log(`📬 Postfach: ${res.imported} neue E-Mail(s), ${res.answeredElsewhere} Antwort(en) aus „Gesendet“, ${res.skipped} übersprungen`);
    } catch (err: any) {
        res.ok = false;
        res.error = imapError(err);
        console.error("❌ Postfach IMAP:", res.error);
        try { client.close(); } catch { /* już zamknięte */ }
    }
    await writeState("imap_last", res);
    // pełna synchronizacja raz, po pierwszym udanym połączeniu (i ponownie po błędzie)
    if (res.ok) void maybeSync();
    return res;
};

/** Czytelny błąd zamiast „Command failed” (np. złe hasło). */
const imapError = (err: any) => {
    const raw = [err?.responseText, err?.message].filter(Boolean).join(": ");
    if (err?.authenticationFailed || /auth|login|credentials/i.test(raw)) return `Anmeldung am Postfach fehlgeschlagen, Benutzer oder Passwort prüfen (${raw})`;
    if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|timeout/i.test(raw)) return `Mailserver nicht erreichbar (${raw})`;
    return raw || "unbekannter Fehler";
};

// ─── Synchronizacja całej skrzynki ────────────────────────────────────────────

export const syncState = () => readState("history_import");
let syncing = false;
export const isSyncing = () => syncing;

const maybeSync = async () => {
    if (process.env.INBOX_HISTORY_ENABLED === "false" || syncing) return;
    const st = await syncState();
    if (st && st.status !== "failed" && st.version === 2) return;   // zrobione albo w toku
    void syncMailbox();
};

export const syncMailbox = async (months = cfg().syncMonths) => {
    if (syncing || !imapEnabled()) return null;
    syncing = true;
    const c = cfg();
    const startedAt = new Date().toISOString();
    const since = new Date(Date.now() - months * 30 * 86400000);
    const attachmentsSince = Date.now() - c.attachmentDays * 86400000;
    await writeState("history_import", { status: "running", version: 2, startedAt, months });
    const client = newClient();
    try {
        await client.connect();
        type Item = { mail: IngestEmail; dir: "in" | "out" };
        const items: Item[] = [];
        let skipped = 0;
        const sent = await findSentFolder(client);
        const folders: [string, "in" | "out"][] = [[c.mailbox, "in"], ...(sent ? [[sent.path, "out"] as [string, "out"]] : [])];
        for (const [path, dir] of folders) {
            const lock = await client.getMailboxLock(path);
            try {
                const uids = ((await client.search({ since }, { uid: true })) || []).sort((a, b) => b - a).slice(0, c.syncMax);
                if (uids.length) for await (const msg of client.fetch(uids, { source: true, internalDate: true }, { uid: true })) {
                    if (!msg.source) continue;
                    const p = await simpleParser(msg.source);
                    const when = new Date(p.date || msg.internalDate || Date.now()).getTime();
                    const mail = toIngest(p, dir === "in" && when >= attachmentsSince);
                    if (!mail.messageId) { skipped++; continue; }
                    if (dir === "in" && skipReason(mail, p.headers)) { skipped++; continue; }
                    items.push({ mail, dir });
                }
            } finally { lock.release(); }
        }
        await client.logout();

        // chronologicznie, żeby odpowiedzi trafiały do rozmów założonych przez pytania
        items.sort((a, b) => Date.parse(a.mail.date || "0") - Date.parse(b.mail.date || "0"));
        const count = { created: 0, appended: 0, duplicate: 0, skipped };
        for (const it of items) count[await ingestHistory(it.mail, it.dir)]++;

        // otwarte rozmowy: ostatnia wiadomość od klienta z ostatnich openDays dni → „Offen” ze szkicem AI
        const openSince = new Date(Date.now() - c.openDays * 86400000);
        const candidates = await InboxThread.find({ imported: true, status: "archived", lastInboundAt: { $gte: openSince } });
        let opened = 0;
        for (const t of candidates) {
            if (t.messages[t.messages.length - 1]?.direction !== "in") continue;
            t.status = "new"; t.unread = true;
            await t.save();
            opened++;
            await requestDraft(t);
            await new Promise(r => setTimeout(r, 400));   // spokojnie z limitem OpenAI
        }

        // opis stylu z naszych odpowiedzi, jeśli nikt go jeszcze nie napisał
        let style = "vorhanden, nicht geändert";
        const current = await InboxSetting.findOne({ key: "style" }).lean();
        if (!current?.text?.trim()) {
            try {
                const r = await analyzeStyle();
                await InboxSetting.updateOne({ key: "style" }, { $set: { text: r.text, updatedBy: "KI (aus gesendeten E-Mails)" } }, { upsert: true });
                style = `aus ${r.basedOn} Antworten erstellt`;
            } catch (err: any) { style = `nicht erstellt: ${err.message}`; }
        }

        const result = {
            status: "done", version: 2, startedAt, finishedAt: new Date().toISOString(), months,
            sentFolder: sent?.path || null,
            inboxMails: items.filter(i => i.dir === "in").length, sentMails: items.filter(i => i.dir === "out").length,
            ...count, opened, style,
        };
        await writeState("history_import", result);
        console.log(`📚 Postfach synchronisiert: ${result.inboxMails} eingehende + ${result.sentMails} gesendete E-Mails aus ${months} Monaten, ${opened} offen mit Entwurf, Stil ${style}`);
        return result;
    } catch (err: any) {
        const error = imapError(err);
        console.error("❌ Postfach-Synchronisierung:", error);
        try { client.close(); } catch { /* już zamknięte */ }
        await writeState("history_import", { status: "failed", version: 2, startedAt, months, error });
        return null;
    } finally {
        syncing = false;
    }
};

// ─── Odpowiedzi z panelu w „Gesendet” ─────────────────────────────────────────

/** Dopisuje odpowiedź z panelu do folderu „Gesendet”, żeby Outlook/telefon widziały ją jak każdą inną. Nie rzuca. */
export const appendToSent = async (mail: Mail.Options) => {
    if (!imapEnabled()) return;
    const client = newClient();
    try {
        const raw = await new MailComposer(mail).compile().build();
        await client.connect();
        const sent = await findSentFolder(client);
        if (sent) await client.append(sent.path, raw, ["\\Seen"], new Date());
        await client.logout();
    } catch (err: any) {
        console.error("❌ Postfach: Antwort nicht in „Gesendet“ abgelegt:", imapError(err));
        try { client.close(); } catch { /* już zamknięte */ }
    }
};
