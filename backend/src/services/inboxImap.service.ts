/**
 * Odbiór maili z info@ przez IMAP (bez n8n). Cron w server.ts woła pollInbox co 2 minuty.
 * Maile zostają w skrzynce nieprzeczytane (czytamy przez BODY.PEEK), panel jest tylko kopią.
 * Pozycję trzymamy w InboxSetting "imap_state" (UIDVALIDITY + ostatni UID), więc nic nie wpada dwa razy.
 */
import { ImapFlow } from "imapflow";
import { simpleParser, AddressObject } from "mailparser";
import InboxSetting from "../models/InboxSetting";
import { ingestEmail, ingestHistory, analyzeStyle, IngestEmail } from "./inbox.service";

const cfg = () => ({
    host: process.env.INBOX_IMAP_HOST || process.env.INBOX_SMTP_HOST || "",
    port: Number(process.env.INBOX_IMAP_PORT || 993),
    user: process.env.INBOX_IMAP_USER || process.env.INBOX_SMTP_USER || "",
    pass: process.env.INBOX_IMAP_PASS || process.env.INBOX_SMTP_PASS || "",
    mailbox: process.env.INBOX_IMAP_MAILBOX || "INBOX",
    // przy pierwszym uruchomieniu pobieramy maile z ostatnich N dni (0 = tylko nowe)
    firstRunDays: Number(process.env.INBOX_IMAP_FIRST_RUN_DAYS ?? 3),
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

/** To samo, co filtr w workflow n8n: powiadomienie z formularza, autoodpowiedzi i zwrotki pomijamy. */
const skipReason = (m: IngestEmail, headers: Map<string, any>): string | null => {
    if (/^neue kontaktanfrage von/i.test(m.subject || "") && m.fromEmail.startsWith("noreply@")) return "form notification";
    const auto = String(headers.get("auto-submitted") || headers.get("x-autoreply") || "").toLowerCase();
    if (auto && auto !== "no") return "auto reply";
    if (/^(mailer-daemon|postmaster)@/i.test(m.fromEmail)) return "bounce";
    if (String(headers.get("precedence") || "").toLowerCase() === "bulk" && headers.get("list-unsubscribe")) return "newsletter";
    return null;
};

let running = false;

export const pollInbox = async (): Promise<{ imported: number; skipped: number } | null> => {
    if (running || !imapEnabled()) return null;
    running = true;
    const c = cfg();
    const client = new ImapFlow({
        host: c.host, port: c.port, secure: c.port === 993,
        auth: { user: c.user, pass: c.pass },
        logger: false,
        socketTimeout: 60000,
    });
    let imported = 0, skipped = 0;
    try {
        await client.connect();
        const lock = await client.getMailboxLock(c.mailbox);
        try {
            const box = client.mailbox as any;
            const uidValidity = String(box.uidValidity);
            const state = await InboxSetting.findOne({ key: "imap_state" }).lean();
            let saved: { uidValidity?: string; lastUid?: number } = {};
            try { saved = JSON.parse(state?.text || "{}"); } catch { /* pusty stan */ }

            let uids: number[];
            if (!saved.lastUid || saved.uidValidity !== uidValidity) {
                // pierwszy raz (albo serwer przenumerował skrzynkę): tylko ostatnie dni, nie całe archiwum
                uids = c.firstRunDays > 0
                    ? ((await client.search({ since: new Date(Date.now() - c.firstRunDays * 86400000) }, { uid: true })) || [])
                    : [];
                saved = { uidValidity, lastUid: Math.max(0, (box.uidNext || 1) - 1) };
            } else {
                uids = ((await client.search({ uid: `${saved.lastUid + 1}:*` }, { uid: true })) || []).filter(u => u > saved.lastUid!);
            }

            for (const uid of uids.sort((a, b) => a - b).slice(0, 200)) {
                const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
                if (!msg || !msg.source) continue;
                const p = await simpleParser(msg.source);
                const mail = toIngest(p, true);
                const reason = skipReason(mail, p.headers);
                if (reason) skipped++;
                else {
                    const r = await ingestEmail(mail);
                    if (r.status === "created" || r.status === "appended") imported++; else skipped++;
                }
                // pozycję zapisujemy po każdym mailu: przerwany import nie zdubluje ani nie zgubi wiadomości
                saved.lastUid = Math.max(saved.lastUid || 0, uid);
                await InboxSetting.updateOne({ key: "imap_state" }, { $set: { text: JSON.stringify(saved) } }, { upsert: true });
            }
            await InboxSetting.updateOne({ key: "imap_state" }, { $set: { text: JSON.stringify(saved) } }, { upsert: true });
        } finally {
            lock.release();
        }
        await pollSent(client);
        await client.logout();
        // historia rozmów (Gesendet + pytania klientów) raz, po pierwszym udanym połączeniu
        void maybeImportHistory();
        if (imported) console.log(`📬 Postfach: ${imported} neue E-Mail(s) importiert, ${skipped} übersprungen`);
        return { imported, skipped };
    } catch (err: any) {
        console.error("❌ Postfach IMAP:", err.message);
        try { client.close(); } catch { /* już zamknięte */ }
        return null;
    } finally {
        running = false;
    }
};

let sentPath: string | null | undefined;

/** Odpowiedzi wysłane poza panelem (folder „Gesendet”): zamykają rozmowę w panelu i są wzorem dla AI. */
const pollSent = async (client: ImapFlow) => {
    if (process.env.INBOX_HISTORY_ENABLED === "false") return;
    try {
        if (sentPath === undefined) sentPath = (await findSentFolder(client))?.path || null;
        if (!sentPath) return;
        const lock = await client.getMailboxLock(sentPath);
        try {
            const box = client.mailbox as any;
            const uidValidity = String(box.uidValidity);
            const st = await InboxSetting.findOne({ key: "imap_sent_state" }).lean();
            let saved: { uidValidity?: string; lastUid?: number } = {};
            try { saved = JSON.parse(st?.text || "{}"); } catch { /* pusty stan */ }
            if (!saved.lastUid || saved.uidValidity !== uidValidity) {
                // przeszłość zbiera import historii, tu tylko nowe
                saved = { uidValidity, lastUid: Math.max(0, (box.uidNext || 1) - 1) };
            } else {
                const uids = ((await client.search({ uid: `${saved.lastUid + 1}:*` }, { uid: true })) || []).filter(u => u > saved.lastUid!).sort((a, b) => a - b).slice(0, 200);
                if (uids.length) for await (const msg of client.fetch(uids, { source: true }, { uid: true })) {
                    if (msg.source) await ingestHistory(toIngest(await simpleParser(msg.source), false), "out");
                    saved.lastUid = Math.max(saved.lastUid || 0, msg.uid);
                }
            }
            await InboxSetting.updateOne({ key: "imap_sent_state" }, { $set: { text: JSON.stringify(saved) } }, { upsert: true });
        } finally { lock.release(); }
    } catch (err: any) {
        console.error("❌ Postfach Gesendet:", err.message);
    }
};

const findSentFolder = async (client: ImapFlow) => {
    const boxes = await client.list();
    return boxes.find(b => b.specialUse === "\\Sent")
        || boxes.find(b => /^(inbox[./])?(sent|gesendet|gesendete( objekte| elemente)?|sent items|sent messages)$/i.test(b.path)) || null;
};

const newClient = () => {
    const c = cfg();
    return new ImapFlow({ host: c.host, port: c.port, secure: c.port === 993, auth: { user: c.user, pass: c.pass }, logger: false, socketTimeout: 120000 });
};

const saveHistoryState = (st: Record<string, unknown>) =>
    InboxSetting.updateOne({ key: "history_import" }, { $set: { text: JSON.stringify(st) } }, { upsert: true });

export const historyState = async () => {
    const st = await InboxSetting.findOne({ key: "history_import" }).lean();
    try { return JSON.parse(st?.text || "null"); } catch { return null; }
};

let historyRunning = false;

const maybeImportHistory = async () => {
    if (process.env.INBOX_HISTORY_ENABLED === "false" || historyRunning) return;
    const st = await historyState();
    if (st && st.status !== "failed") return;   // już zrobione albo w toku; po błędzie ponawiamy
    void importHistory();
};

/**
 * Import historii przy podłączeniu skrzynki: nasze odpowiedzi z folderu „Gesendet” z ostatnich miesięcy
 * i pytania klientów, na które odpowiadały (z INBOX). Maile bez naszej odpowiedzi (spam, newslettery) pomijamy.
 * Potem, gdy opis stylu jest pusty, AI tworzy go z tych odpowiedzi.
 */
export const importHistory = async (months = Number(process.env.INBOX_HISTORY_MONTHS || 12)) => {
    if (historyRunning || !imapEnabled()) return null;
    historyRunning = true;
    const startedAt = new Date().toISOString();
    const since = new Date(Date.now() - months * 30 * 86400000);
    const MAX = Number(process.env.INBOX_HISTORY_MAX || 1500);
    await saveHistoryState({ status: "running", startedAt, months });
    const client = newClient();
    try {
        await client.connect();
        const sent = await findSentFolder(client);
        if (!sent) throw new Error(`Kein Ordner für gesendete E-Mails gefunden (Ordner: ${(await client.list()).map(b => b.path).join(", ")})`);

        // 1) nasze odpowiedzi
        type Item = { mail: IngestEmail; dir: "in" | "out" };
        const items: Item[] = [];
        const repliedTo = new Set<string>(), sentIds = new Set<string>();
        {
            const lock = await client.getMailboxLock(sent.path);
            try {
                const uids = ((await client.search({ since }, { uid: true })) || []).sort((a, b) => b - a).slice(0, MAX);
                if (uids.length) for await (const msg of client.fetch(uids, { source: true }, { uid: true })) {
                    if (!msg.source) continue;
                    const mail = toIngest(await simpleParser(msg.source), false);
                    if (!mail.messageId) continue;
                    items.push({ mail, dir: "out" });
                    sentIds.add(mail.messageId);
                    if (mail.inReplyTo) repliedTo.add(mail.inReplyTo);
                    for (const r of (Array.isArray(mail.references) ? mail.references : String(mail.references || "").split(/\s+/))) if (r) repliedTo.add(r);
                }
            } finally { lock.release(); }
        }

        // 2) pytania klientów, na które odpowiedzieliśmy (albo odpowiedzi klientów na nasze maile)
        {
            const lock = await client.getMailboxLock("INBOX");
            try {
                const uids = ((await client.search({ since }, { uid: true })) || []).sort((a, b) => b - a).slice(0, MAX * 3);
                const wanted: number[] = [];
                if (uids.length) for await (const msg of client.fetch(uids, { envelope: true, headers: ["references"] }, { uid: true })) {
                    const id = msg.envelope?.messageId;
                    const refs = String(msg.headers?.toString() || "").match(/<[^>]+>/g) || [];
                    const parent = msg.envelope?.inReplyTo;
                    if ((id && repliedTo.has(id)) || (parent && sentIds.has(parent)) || refs.some(r => sentIds.has(r))) wanted.push(msg.uid);
                }
                if (wanted.length) for await (const msg of client.fetch(wanted, { source: true }, { uid: true })) {
                    if (!msg.source) continue;
                    const mail = toIngest(await simpleParser(msg.source), false);
                    if (mail.fromEmail) items.push({ mail, dir: "in" });
                }
            } finally { lock.release(); }
        }
        await client.logout();

        // 3) chronologicznie, żeby odpowiedzi trafiały do rozmów założonych przez pytania
        items.sort((a, b) => Date.parse(a.mail.date || "0") - Date.parse(b.mail.date || "0"));
        const count = { created: 0, appended: 0, duplicate: 0, skipped: 0 };
        for (const it of items) count[await ingestHistory(it.mail, it.dir)]++;

        // 4) opis stylu, jeśli nikt go jeszcze nie napisał
        let style = "";
        const current = await InboxSetting.findOne({ key: "style" }).lean();
        if (!current?.text?.trim()) {
            try {
                const r = await analyzeStyle();
                await InboxSetting.updateOne({ key: "style" }, { $set: { text: r.text, updatedBy: "KI (aus gesendeten E-Mails)" } }, { upsert: true });
                style = `aus ${r.basedOn} Antworten erstellt`;
            } catch (err: any) { style = `nicht erstellt: ${err.message}`; }
        } else style = "vorhanden, nicht geändert";

        const result = {
            status: "done", startedAt, finishedAt: new Date().toISOString(), months, sentFolder: sent.path,
            sentMails: items.filter(i => i.dir === "out").length, customerMails: items.filter(i => i.dir === "in").length,
            conversations: count.created, ...count, style,
        };
        await saveHistoryState(result);
        console.log(`📚 Postfach-Verlauf: ${result.sentMails} gesendete + ${result.customerMails} Kunden-E-Mails aus ${months} Monaten, ${count.created} Gespräche, Stil ${style}`);
        return result;
    } catch (err: any) {
        console.error("❌ Postfach-Verlauf:", err.message);
        try { client.close(); } catch { /* już zamknięte */ }
        await saveHistoryState({ status: "failed", startedAt, months, error: err.message });
        return null;
    } finally {
        historyRunning = false;
    }
};
