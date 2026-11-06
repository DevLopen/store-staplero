/**
 * Odbiór maili z info@ przez IMAP (bez n8n). Cron w server.ts woła pollInbox co 2 minuty.
 * Maile zostają w skrzynce nieprzeczytane (czytamy przez BODY.PEEK), panel jest tylko kopią.
 * Pozycję trzymamy w InboxSetting "imap_state" (UIDVALIDITY + ostatni UID), więc nic nie wpada dwa razy.
 */
import { ImapFlow } from "imapflow";
import { simpleParser, AddressObject } from "mailparser";
import InboxSetting from "../models/InboxSetting";
import { ingestEmail, IngestEmail } from "./inbox.service";

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
                const from = firstAddress(p.from);
                const mail: IngestEmail = {
                    messageId: p.messageId,
                    inReplyTo: typeof p.inReplyTo === "string" ? p.inReplyTo : undefined,
                    references: p.references,
                    fromName: from?.name || "",
                    fromEmail: (from?.address || "").toLowerCase(),
                    to: (Array.isArray(p.to) ? p.to.map(t => t.text).join(", ") : p.to?.text) || "",
                    subject: p.subject || "",
                    text: p.text || "",
                    html: typeof p.html === "string" ? p.html : "",
                    date: p.date?.toISOString(),
                    attachments: p.attachments
                        .filter(a => a.size <= 15 * 1024 * 1024 && a.contentDisposition !== "inline")
                        .map(a => ({ filename: a.filename || "anhang", mimeType: a.contentType, contentBase64: a.content.toString("base64") })),
                };
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
        await client.logout();
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
