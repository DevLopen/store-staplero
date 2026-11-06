/**
 * Postfach im Admin-Panel (/admin#mails): Anfragen aus dem Kontaktformular und E-Mails an info@ (über n8n),
 * nach Kategorien sortiert, mit KI-Entwurf, den man bearbeitet und von hier aus sendet.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, RefreshCw, Send, Sparkles, Archive, ArrowLeft, Paperclip, Inbox, Loader2, RotateCcw, Phone, Building2, Mail, User, PenLine } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import "./admin-inbox.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CATEGORIES: { id: string; label: string; color: string }[] = [
    { id: "kursanfrage", label: "Kursanfrage", color: "#0a84ff" },
    { id: "buchung", label: "Buchung & Storno", color: "#5e5ce6" },
    { id: "zahlung", label: "Rechnung & Zahlung", color: "#a2845e" },
    { id: "zertifikat", label: "Zertifikat", color: "#ff9f0a" },
    { id: "firmen", label: "Firmenkunden", color: "#30b0c7" },
    { id: "sonstiges", label: "Sonstiges", color: "#8e8e93" },
    { id: "spam", label: "Spam", color: "#c7c7cc" },
];
const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const STATUS_TABS = [
    { id: "open", label: "Offen" },
    { id: "sent", label: "Beantwortet" },
    { id: "archived", label: "Archiv" },
    { id: "", label: "Alle" },
];
const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
    new: { label: "Neu", tone: "teal" },
    draft: { label: "Entwurf bereit", tone: "teal" },
    sent: { label: "Beantwortet", tone: "green" },
    archived: { label: "Archiv", tone: "grey" },
};

type Attachment = { _id: string; filename: string; mimeType: string; size: number };
type Message = { _id: string; direction: "in" | "out"; source: string; fromName?: string; fromEmail: string; subject: string; text: string; date: string; attachments: Attachment[]; sentBy?: string };
type ThreadListItem = {
    _id: string; subject: string; source: "form" | "email"; category?: string; priority: string; language?: string; summary?: string;
    status: string; unread: boolean; ai?: { status: string }; lastMessageAt: string;
    customer: { name?: string; email: string; phone?: string; company?: string };
};
type Thread = ThreadListItem & {
    messages: Message[];
    draft: { text: string; editedAt?: string; fromAi: boolean };
    ai: { status: string; error?: string; confidence?: number; suggestion?: string; requestedAt?: string; generatedAt?: string };
};

const authH = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` });

const fmtWhen = (s: string) => {
    const d = new Date(s), now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const diff = (now.getTime() - d.getTime()) / 86400000;
    if (diff < 6) return d.toLocaleDateString("de-DE", { weekday: "short" });
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: d.getFullYear() === now.getFullYear() ? undefined : "2-digit" });
};
const fmtFull = (s: string) => new Date(s).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
// KI-Anfrage, die nach 5 Minuten nicht zurückkam, gilt als hängengeblieben
const aiPending = (t?: { ai?: { status: string; requestedAt?: string } }) =>
    t?.ai?.status === "pending" && (!t.ai.requestedAt || Date.now() - new Date(t.ai.requestedAt).getTime() < 5 * 60000);

export default function AdminInbox() {
    const { toast } = useToast();
    const [status, setStatus] = useState("open");
    const [category, setCategory] = useState("");
    const [q, setQ] = useState("");
    const [qDebounced, setQDebounced] = useState("");
    const [list, setList] = useState<ThreadListItem[]>([]);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState<{ openByCategory: Record<string, number>; unread: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [thread, setThread] = useState<Thread | null>(null);
    const [draft, setDraft] = useState("");
    const [dirty, setDirty] = useState(false);
    const [busy, setBusy] = useState<"" | "send" | "regen" | "save">("");
    const [instruction, setInstruction] = useState("");
    const saveTimer = useRef<number>();
    const [styleOpen, setStyleOpen] = useState(false);
    const [styleText, setStyleText] = useState("");
    const [styleMeta, setStyleMeta] = useState<{ updatedAt?: string; updatedBy?: string }>({});
    const [styleBusy, setStyleBusy] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [history, setHistory] = useState<{ imap: boolean; imported: number; state: any } | null>(null);

    const loadHistory = useCallback(async () => {
        const r = await fetch(`${API}/inbox/settings/history`, { headers: authH() }).catch(() => null);
        if (r?.ok) setHistory(await r.json());
    }, []);
    const openStyle = async () => {
        setStyleOpen(true);
        loadHistory();
        const r = await fetch(`${API}/inbox/settings/style`, { headers: authH() }).catch(() => null);
        if (r?.ok) { const d = await r.json(); setStyleText(d.text || ""); setStyleMeta(d); }
    };
    // import historii trwa kilka minut: odświeżamy status, dopóki okno jest otwarte
    useEffect(() => {
        if (!styleOpen || history?.state?.status !== "running") return;
        const t = window.setInterval(loadHistory, 5000);
        return () => clearInterval(t);
    }, [styleOpen, history?.state?.status, loadHistory]);
    const analyze = async () => {
        setAnalyzing(true);
        try {
            const r = await fetch(`${API}/inbox/settings/style/analyze`, { method: "POST", headers: authH() });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            setStyleText(d.text);
            toast({ title: "Vorschlag erstellt", description: `Aus ${d.basedOn} gesendeten Antworten. Prüfen und speichern.` });
        } catch (e: any) {
            toast({ title: "Kein Vorschlag", description: e.message, variant: "destructive" });
        } finally { setAnalyzing(false); }
    };
    const reimport = async () => {
        const r = await fetch(`${API}/inbox/settings/history/import`, { method: "POST", headers: authH(), body: JSON.stringify({ months: 12 }) }).catch(() => null);
        const d = await r?.json().catch(() => ({}));
        if (r?.ok) { toast({ title: "Import gestartet", description: "Dauert je nach Postfach einige Minuten." }); setTimeout(loadHistory, 1500); }
        else toast({ title: "Import nicht möglich", description: d?.error, variant: "destructive" });
    };
    const historyLine = () => {
        const st = history?.state;
        if (!history) return "";
        if (!history.imap) return "Postfach nicht verbunden: Es lernt nur aus Antworten, die hier gesendet werden.";
        if (!st) return "Verlauf wird beim nächsten Abruf importiert.";
        if (st.status === "running") return "Verlauf wird importiert…";
        if (st.status === "failed") return `Import fehlgeschlagen: ${st.error}`;
        return `Gelernt aus ${st.sentMails} gesendeten E-Mails der letzten ${st.months} Monate (Ordner „${st.sentFolder}“), Stand ${fmtFull(st.finishedAt)}. Neue Antworten aus „Gesendet“ kommen automatisch dazu.`;
    };
    const saveStyle = async () => {
        setStyleBusy(true);
        const r = await fetch(`${API}/inbox/settings/style`, { method: "PUT", headers: authH(), body: JSON.stringify({ text: styleText }) }).catch(() => null);
        setStyleBusy(false);
        if (r?.ok) { setStyleOpen(false); toast({ title: "Schreibstil gespeichert", description: "Gilt für alle neuen Entwürfe." }); }
        else toast({ title: "Speichern fehlgeschlagen", variant: "destructive" });
    };

    useEffect(() => { const t = window.setTimeout(() => setQDebounced(q), 300); return () => clearTimeout(t); }, [q]);

    const loadList = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const p = new URLSearchParams({ limit: "50", ...(status && { status }), ...(category && { category }), ...(qDebounced && { q: qDebounced }) });
            const [r1, r2] = await Promise.all([fetch(`${API}/inbox?${p}`, { headers: authH() }), fetch(`${API}/inbox/stats`, { headers: authH() })]);
            if (r1.ok) { const d = await r1.json(); setList(d.threads); setTotal(d.total); }
            if (r2.ok) setStats(await r2.json());
        } catch { /* sieć: zostaje poprzedni stan */ } finally { if (!silent) setLoading(false); }
    }, [status, category, qDebounced]);

    useEffect(() => { loadList(); }, [loadList]);
    useEffect(() => { const t = window.setInterval(() => loadList(true), 60000); return () => clearInterval(t); }, [loadList]);

    const loadThread = useCallback(async (id: string, keepDraft = false) => {
        const r = await fetch(`${API}/inbox/${id}`, { headers: authH() });
        if (!r.ok) { toast({ title: "Nachricht nicht gefunden", variant: "destructive" }); return; }
        const t: Thread = await r.json();
        setThread(t);
        if (!keepDraft) { setDraft(t.draft?.text || ""); setDirty(false); }
        setList(prev => prev.map(x => (x._id === id ? { ...x, unread: false, status: t.status, category: t.category, ai: t.ai, summary: t.summary } : x)));
    }, [toast]);

    useEffect(() => { if (activeId) { setInstruction(""); loadThread(activeId); } else setThread(null); }, [activeId, loadThread]);

    // czekamy na szkic z n8n
    useEffect(() => {
        if (!activeId || !aiPending(thread)) return;
        const t = window.setInterval(() => loadThread(activeId, dirty), 4000);
        return () => clearInterval(t);
    }, [activeId, thread, dirty, loadThread]);

    const patch = async (body: Record<string, unknown>) => {
        if (!thread) return null;
        const r = await fetch(`${API}/inbox/${thread._id}`, { method: "PATCH", headers: authH(), body: JSON.stringify(body) });
        if (!r.ok) { toast({ title: "Speichern fehlgeschlagen", variant: "destructive" }); return null; }
        const t: Thread = await r.json();
        setThread(t);
        setList(prev => prev.map(x => (x._id === t._id ? { ...x, status: t.status, category: t.category, priority: t.priority } : x)));
        return t;
    };

    const saveDraft = async (text = draft) => {
        if (!thread || !dirty) return;
        setBusy("save");
        await patch({ draftText: text });
        setDirty(false);
        setBusy("");
    };

    const onDraftChange = (v: string) => {
        setDraft(v); setDirty(true);
        window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(() => {
            if (!thread) return;
            fetch(`${API}/inbox/${thread._id}`, { method: "PATCH", headers: authH(), body: JSON.stringify({ draftText: v }) })
                .then(r => r.ok && setDirty(false)).catch(() => {});
        }, 1500);
    };

    const send = async () => {
        if (!thread || draft.trim().length < 2) return;
        window.clearTimeout(saveTimer.current);
        setBusy("send");
        try {
            const r = await fetch(`${API}/inbox/${thread._id}/send`, { method: "POST", headers: authH(), body: JSON.stringify({ text: draft }) });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || "Senden fehlgeschlagen");
            setThread(d); setDraft(""); setDirty(false);
            toast({ title: "Antwort gesendet", description: `an ${d.customer.email}` });
            loadList(true);
        } catch (e: any) {
            toast({ title: "Nicht gesendet", description: e.message, variant: "destructive" });
        } finally { setBusy(""); }
    };

    const regenerate = async () => {
        if (!thread) return;
        window.clearTimeout(saveTimer.current);
        setBusy("regen");
        try {
            const r = await fetch(`${API}/inbox/${thread._id}/regenerate`, { method: "POST", headers: authH(), body: JSON.stringify({ instruction }) });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            setDirty(false);
            await loadThread(thread._id);
        } catch (e: any) {
            toast({ title: "Kein neuer Entwurf", description: e.message, variant: "destructive" });
        } finally { setBusy(""); }
    };

    const downloadAttachment = async (a: Attachment) => {
        if (!thread) return;
        const r = await fetch(`${API}/inbox/${thread._id}/attachments/${a._id}`, { headers: authH() });
        if (!r.ok) { toast({ title: "Anhang nicht verfügbar", variant: "destructive" }); return; }
        const url = URL.createObjectURL(await r.blob());
        const el = document.createElement("a");
        el.href = url; el.download = a.filename; el.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    };

    const openCount = useMemo(() => Object.values(stats?.openByCategory || {}).reduce((a, b) => a + b, 0), [stats]);
    const suggestionDiffers = !!thread?.ai?.suggestion && thread.ai.suggestion.trim() !== draft.trim();

    return <div className={`ib ${activeId ? "ib-has" : ""}`}>
        {/* ── lista ── */}
        <section className="ib-list" aria-label="Nachrichten">
            <div className="ib-tools">
                <div className="ib-seg" role="tablist">
                    {STATUS_TABS.map(s => <button key={s.id} role="tab" aria-selected={status === s.id} onClick={() => setStatus(s.id)}>{s.label}</button>)}
                </div>
                <div className="ib-search">
                    <Search className="ib-i" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Name, E-Mail oder Text suchen" />
                    <button type="button" className="ib-icon" aria-label="Aktualisieren" onClick={() => loadList()}><RefreshCw className={`ib-i ${loading ? "ib-spin" : ""}`} /></button>
                </div>
                <button type="button" className="ib-style-btn" onClick={openStyle}><PenLine className="ib-i" />Schreibstil der KI</button>
                <div className="ib-cats">
                    <button className={!category ? "on" : ""} onClick={() => setCategory("")}>Alle{status === "open" && openCount ? <em>{openCount}</em> : null}</button>
                    {CATEGORIES.map(c => {
                        const n = stats?.openByCategory?.[c.id];
                        return <button key={c.id} className={category === c.id ? "on" : ""} onClick={() => setCategory(category === c.id ? "" : c.id)}>
                            <i style={{ background: c.color }} />{c.label}{status === "open" && n ? <em>{n}</em> : null}
                        </button>;
                    })}
                </div>
            </div>

            <div className="ib-rows">
                {!loading && list.length === 0 && <div className="ib-empty"><Inbox className="ib-i-lg" /><b>Keine Nachrichten</b><span>{status === "open" ? "Alles beantwortet." : "Für diesen Filter gibt es nichts."}</span></div>}
                {list.map(t => {
                    const c = t.category ? CAT[t.category] : undefined;
                    return <button key={t._id} className={`ib-row ${activeId === t._id ? "on" : ""} ${t.unread ? "unread" : ""}`} onClick={() => setActiveId(t._id)}>
                        <div className="ib-row-top">
                            <b>{t.customer.name || t.customer.email}</b>
                            <time>{fmtWhen(t.lastMessageAt)}</time>
                        </div>
                        <div className="ib-row-subj">{t.priority === "high" && <span className="ib-urgent">Dringend</span>}{t.subject}</div>
                        <div className="ib-row-sum">{aiPending(t) ? "KI liest die Nachricht…" : t.summary || (t.source === "form" ? "Kontaktformular" : t.customer.email)}</div>
                        <div className="ib-row-meta">
                            {c ? <span className="ib-cat"><i style={{ background: c.color }} />{c.label}</span> : <span className="ib-cat muted">Ohne Kategorie</span>}
                            <span className={`ib-st ${STATUS_LABEL[t.status]?.tone}`}>{STATUS_LABEL[t.status]?.label}</span>
                        </div>
                    </button>;
                })}
                {list.length > 0 && total > list.length && <div className="ib-more">{list.length} von {total} angezeigt. Suche oder Filter grenzen die Liste ein.</div>}
            </div>
        </section>

        {/* ── wątek ── */}
        <section className="ib-detail" aria-label="Nachricht">
            {!thread && <div className="ib-empty big"><Mail className="ib-i-lg" /><b>Nachricht auswählen</b><span>Links eine Anfrage öffnen, Entwurf prüfen und senden.</span></div>}
            {thread && <>
                <header className="ib-head">
                    <button type="button" className="ib-back" onClick={() => setActiveId(null)}><ArrowLeft className="ib-i" />Postfach</button>
                    <h2>{thread.subject}</h2>
                    <div className="ib-cust">
                        <span><User className="ib-i" />{thread.customer.name || "Unbekannt"}</span>
                        <a href={`mailto:${thread.customer.email}`}><Mail className="ib-i" />{thread.customer.email}</a>
                        {thread.customer.phone && <a href={`tel:${thread.customer.phone}`}><Phone className="ib-i" />{thread.customer.phone}</a>}
                        {thread.customer.company && <span><Building2 className="ib-i" />{thread.customer.company}</span>}
                    </div>
                    <div className="ib-ctrl">
                        <label>Kategorie
                            <select value={thread.category || ""} onChange={e => patch({ category: e.target.value })}>
                                {!thread.category && <option value="">Ohne Kategorie</option>}
                                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </label>
                        <label className="ib-check"><input type="checkbox" checked={thread.priority === "high"} onChange={e => patch({ priority: e.target.checked ? "high" : "normal" })} />Dringend</label>
                        <span className="ib-top-sp" />
                        {thread.status === "archived"
                            ? <button type="button" className="ib-btn ghost" onClick={() => patch({ status: thread.messages.some(m => m.direction === "out") ? "sent" : "new" })}><RotateCcw className="ib-i" />Wiederherstellen</button>
                            : <button type="button" className="ib-btn ghost" onClick={async () => { await patch({ status: "archived" }); setActiveId(null); loadList(true); }}><Archive className="ib-i" />Archivieren</button>}
                    </div>
                    {thread.summary && <p className="ib-summary"><Sparkles className="ib-i" />{thread.summary}</p>}
                </header>

                <div className="ib-msgs">
                    {thread.messages.map(m => <article key={m._id} className={`ib-msg ${m.direction}`}>
                        <div className="ib-msg-h">
                            <b>{m.direction === "out" ? "STAPLERO" : m.fromName || m.fromEmail}</b>
                            <span>{m.source === "form" ? "Kontaktformular · " : ""}{fmtFull(m.date)}{m.sentBy ? ` · gesendet von ${m.sentBy}` : ""}</span>
                        </div>
                        <div className="ib-msg-b">{m.text || <i>(kein Text)</i>}</div>
                        {m.attachments?.length > 0 && <div className="ib-atts">
                            {m.attachments.map(a => <button key={a._id} type="button" onClick={() => downloadAttachment(a)}><Paperclip className="ib-i" />{a.filename}<span>{fmtSize(a.size)}</span></button>)}
                        </div>}
                    </article>)}
                </div>

                <div className="ib-compose">
                    <div className="ib-compose-h">
                        <b>Antwort an {thread.customer.email}</b>
                        <span className="ib-ai-state">
                            {aiPending(thread) ? <><Loader2 className="ib-i ib-spin" />KI schreibt einen Entwurf…</>
                                : thread.ai?.status === "failed" ? <span className="ib-err">KI-Entwurf fehlgeschlagen{thread.ai.error ? `: ${thread.ai.error}` : ""}</span>
                                : dirty ? "Änderungen werden gespeichert…"
                                : thread.draft?.fromAi && draft ? <>KI-Entwurf{typeof thread.ai?.confidence === "number" ? `, Sicherheit ${Math.round(thread.ai.confidence * 100)} %` : ""}</>
                                : draft ? "Entwurf gespeichert" : ""}
                        </span>
                    </div>
                    {suggestionDiffers && !aiPending(thread) && thread.draft?.editedAt && <div className="ib-suggest">
                        Es gibt einen neueren KI-Vorschlag.
                        <button type="button" onClick={() => onDraftChange(thread.ai.suggestion || "")}>Übernehmen</button>
                    </div>}
                    <textarea value={draft} onChange={e => onDraftChange(e.target.value)} onBlur={() => saveDraft()}
                        placeholder={aiPending(thread) ? "Der Entwurf erscheint hier in wenigen Sekunden." : "Antwort schreiben"} rows={12} />
                    <p className="ib-hint">Signatur und zitierte Nachricht werden beim Senden automatisch angehängt.</p>
                    <div className="ib-actions">
                        <div className="ib-regen">
                            <input value={instruction} onChange={e => setInstruction(e.target.value)} placeholder="Hinweis für die KI, z. B. kürzer, anderen Termin vorschlagen"
                                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); regenerate(); } }} />
                            <button type="button" className="ib-btn ghost" disabled={busy !== "" || aiPending(thread)} onClick={regenerate}>
                                {busy === "regen" ? <Loader2 className="ib-i ib-spin" /> : <Sparkles className="ib-i" />}Neu schreiben
                            </button>
                        </div>
                        <button type="button" className="ib-btn primary" disabled={busy !== "" || draft.trim().length < 2} onClick={send}>
                            {busy === "send" ? <Loader2 className="ib-i ib-spin" /> : <Send className="ib-i" />}Senden
                        </button>
                    </div>
                </div>
            </>}
        </section>
        <Dialog open={styleOpen} onOpenChange={setStyleOpen}>
            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>Schreibstil der KI</DialogTitle>
                    <DialogDescription>
                        Wie sollen Entwürfe klingen? Die KI liest diesen Text bei jedem Entwurf. Zusätzlich nimmt sie die ähnlichsten früheren Antworten als Vorbild: aus dem Ordner „Gesendet“ und aus diesem Panel.
                    </DialogDescription>
                </DialogHeader>
                <div className="ib-hist">
                    <span>{history?.state?.status === "running" && <Loader2 className="ib-i ib-spin" />}{historyLine()}</span>
                    <div>
                        <button type="button" className="ib-btn ghost" disabled={analyzing} onClick={analyze}>
                            {analyzing ? <Loader2 className="ib-i ib-spin" /> : <Sparkles className="ib-i" />}Aus gesendeten E-Mails erstellen
                        </button>
                        {history?.imap && history?.state?.status !== "running" && <button type="button" className="ib-btn ghost" onClick={reimport}><RefreshCw className="ib-i" />Verlauf neu importieren</button>}
                    </div>
                </div>
                <textarea className="ib-style-ta" value={styleText} onChange={e => setStyleText(e.target.value)} rows={12}
                    placeholder={"Zum Beispiel:\nKurz, höchstens 5 Sätze.\nAnrede \"Hallo <Vorname>,\" statt \"Guten Tag\".\nBei Terminfragen immer auch die Telefonnummer nennen.\nKeine Entschuldigungen, lieber direkt die Lösung."} />
                <div className="ib-style-foot">
                    <span>{styleMeta.updatedAt ? `Zuletzt geändert ${fmtFull(styleMeta.updatedAt)}${styleMeta.updatedBy ? ` von ${styleMeta.updatedBy}` : ""}` : ""}</span>
                    <button type="button" className="ib-btn ghost" onClick={() => setStyleOpen(false)}>Abbrechen</button>
                    <button type="button" className="ib-btn primary" disabled={styleBusy} onClick={saveStyle}>{styleBusy && <Loader2 className="ib-i ib-spin" />}Speichern</button>
                </div>
            </DialogContent>
        </Dialog>
    </div>;
}
