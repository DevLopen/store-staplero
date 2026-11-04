/**
 * Panel admina: katalog pytań. Lista z wyszukiwarką i filtrem modułów (poprawne odpowiedzi zaznaczone, do weryfikacji),
 * edytor pytania (treść w 4 językach, rodzaj odpowiedzi, zdjęcie lub film, widoczność) i dodawanie nowych pytań.
 * Adresy: /admin/fragen (lista), /admin/fragen/:qid (edycja), /admin/fragen/neu (nowe pytanie).
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API, authHeaders } from "@/components/dashboard/panelUtils";
import { AdminBank as Bank, adminBank, adminBanks, adminDeleteQuestion, adminSaveQuestion, BankMedia, BankQuestion } from "@/learning/api";
import { LANGS, Lang, LText } from "@/learning/types";
import AdminShell from "./AdminShell";
import "./admin-bank.css";

type Kind = "single" | "multi" | "num";
type Draft = { topic: string; q: Record<Lang, string>; o: Record<Lang, string>[]; c: number[]; num: string; unit: string; media?: BankMedia; hidden: boolean; wait?: string; kind: Kind };
const emptyL = (): Record<Lang, string> => ({ de: "", en: "", pl: "", uk: "" });
const fullL = (t?: LText): Record<Lang, string> => ({ de: t?.de ?? "", en: t?.en ?? "", pl: t?.pl ?? "", uk: t?.uk ?? "" });
const kindOf = (q: BankQuestion): Kind => (q.num !== undefined && q.num !== null ? "num" : q.c.length > 1 ? "multi" : "single");
const toDraft = (q: BankQuestion): Draft => ({
    topic: q.topic, q: fullL(q.q), o: q.o.map(fullL), c: [...q.c], num: q.num !== undefined && q.num !== null ? String(q.num) : "", unit: q.unit ?? "",
    media: q.media, hidden: !!q.hidden, wait: q.wait, kind: kindOf(q),
});
const IMG_MAX = 5, VID_MAX = 100;

function validate(d: Draft): string[] {
    const e: string[] = [];
    if (!d.q.de.trim()) e.push("Der deutsche Fragetext fehlt.");
    if (d.kind === "num") { if (!/^\d+$/.test(d.num)) e.push("Richtigen Wert als ganze Zahl eingeben."); }
    else {
        if (d.o.filter(o => o.de.trim()).length < 2) e.push("Mindestens 2 Antworten mit deutschem Text.");
        if (d.kind === "single" && d.c.length !== 1) e.push("Genau eine Antwort als richtig markieren.");
        if (d.kind === "multi" && d.c.length < 2) e.push("Mindestens 2 Antworten als richtig markieren.");
        if (d.c.some(j => !d.o[j]?.de.trim())) e.push("Eine als richtig markierte Antwort ist leer.");
    }
    return e;
}
const missing = (d: Draft) => {
    const texts = [d.q, ...(d.kind === "num" ? [] : d.o.filter(o => o.de.trim()))];
    return (["en", "pl", "uk"] as Lang[]).filter(l => texts.some(t => t.de.trim() && !t[l].trim()));
};
const qMissing = (q: BankQuestion) => missing(toDraft(q)).length > 0;

const Check = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const Trash = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>;
const Up = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4" /></svg>;

export default function AdminBank() {
    const nav = useNavigate();
    const { qid } = useParams();
    const [bank, setBank] = useState<Bank | null>(null);
    const [err, setErr] = useState("");
    const [allowed, setAllowed] = useState<boolean | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { nav("/login"); return; }
        fetch(`${API}/auth/me`, { headers: authHeaders() }).then(r => r.json()).then(d => {
            if (!d.user?.isAdmin) { nav("/dashboard"); return; }
            setAllowed(true);
        }).catch(() => nav("/login"));
    }, [nav]);
    const load = () => adminBanks().then(list => list[0] ? adminBank(list[0].id).then(setBank) : setErr("Noch kein Fragenkatalog angelegt.")).catch(e => setErr(e.message));
    useEffect(() => { if (allowed) load(); }, [allowed]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!allowed) return null;
    return <AdminShell active="fragen"><div className="ab">
        {err && <p className="ab-page ab-errline">{err}</p>}
        {!bank && !err && <p className="ab-page ab-muted">Lädt …</p>}
        {bank && (qid
            ? <Editor key={qid} bank={bank} qid={qid === "neu" ? null : qid} onSaved={(q, isNew) => {
                setBank(b => b && { ...b, questions: isNew ? [...b.questions, q] : b.questions.map(x => (x.id === q.id ? q : x)) });
                if (isNew) nav(`/admin/fragen/${encodeURIComponent(q.id)}`, { replace: true });
            }} onDeleted={id => { setBank(b => b && { ...b, questions: b.questions.filter(x => x.id !== id) }); nav("/admin/fragen"); }} />
            : <List bank={bank} />)}
    </div></AdminShell>;
}

function List({ bank }: { bank: Bank }) {
    const [text, setText] = useState(() => sessionStorage.getItem("ab-text") ?? "");
    const [topic, setTopic] = useState(() => sessionStorage.getItem("ab-topic") ?? "");
    const [state, setState] = useState(() => sessionStorage.getItem("ab-state") ?? "");
    useEffect(() => { try { sessionStorage.setItem("ab-text", text); sessionStorage.setItem("ab-topic", topic); sessionStorage.setItem("ab-state", state); } catch { /* ignorujemy */ } }, [text, topic, state]);
    const tTitle = (k: string) => bank.topics.find(t => t.key === k)?.title.de ?? k;
    const rows = useMemo(() => {
        const s = text.trim().toLowerCase();
        return bank.questions.filter(q => (!topic || q.topic === topic)
            && (!state || (state === "hidden" ? q.hidden : state === "wait" ? !!q.wait : state === "media" ? !!q.media : state === "trans" ? qMissing(q) : true))
            && (!s || q.id.toLowerCase().includes(s) || Object.values(q.q).some(v => v?.toLowerCase().includes(s)) || q.o.some(o => Object.values(o).some(v => v?.toLowerCase().includes(s)))));
    }, [bank, text, topic, state]);
    const active = bank.questions.filter(q => !q.hidden && !q.wait).length;
    return <main className="ab-page">
        <div className="ab-head">
            <div><p className="ab-eyebrow">Fragenkatalog</p><h1>{bank.title.de}</h1>
                <p className="ab-muted">{bank.questions.length} Fragen, davon {active} im Katalog sichtbar. Richtige Antworten sind grün markiert.</p></div>
            <Link className="ab-btn p" to="/admin/fragen/neu">+ Neue Frage</Link>
        </div>
        <div className="ab-filters">
            <input type="search" placeholder="Suchen (Text oder Nummer)" value={text} onChange={e => setText(e.target.value)} aria-label="Suchen" />
            <select value={topic} onChange={e => setTopic(e.target.value)} aria-label="Modul">
                <option value="">Alle Module</option>
                {bank.topics.map(t => <option key={t.key} value={t.key}>{t.title.de}</option>)}
            </select>
            <select value={state} onChange={e => setState(e.target.value)} aria-label="Status">
                <option value="">Alle Fragen</option>
                <option value="trans">Übersetzung fehlt</option>
                <option value="media">Mit Bild oder Video</option>
                <option value="wait">Wartet auf Bild</option>
                <option value="hidden">Ausgeblendet</option>
            </select>
            <span className="ab-muted">{rows.length} Fragen</span>
        </div>
        <div className="ab-card">
            {rows.map(q => {
                const k = kindOf(q);
                return <Link key={q.id} to={`/admin/fragen/${encodeURIComponent(q.id)}`} className="ab-li">
                    <div className="h"><span className="id">{q.id}</span><b>{q.q.de}</b></div>
                    <div className="pills">
                        <span className="pill">{tTitle(q.topic)}</span>
                        {k === "multi" && <span className="pill">{q.c.length} richtige</span>}
                        {k === "num" && <span className="pill">Zahl eingeben</span>}
                        {q.media && <span className="pill">{q.media.type === "video" ? "Video" : "Bild"}</span>}
                        {qMissing(q) && <span className="pill w">Übersetzung fehlt</span>}
                        {q.wait && <span className="pill w">Wartet auf Bild</span>}
                        {q.hidden && <span className="pill h">Ausgeblendet</span>}
                    </div>
                    {k === "num"
                        ? <ol><li className="c"><i />{q.num} {q.unit}</li></ol>
                        : <ol>{q.o.map((o, j) => <li key={j} className={q.c.includes(j) ? "c" : ""}><i />{o.de}</li>)}</ol>}
                </Link>;
            })}
            {!rows.length && <p className="ab-empty">Keine Fragen gefunden.</p>}
        </div>
    </main>;
}

function Editor({ bank, qid, onSaved, onDeleted }: { bank: Bank; qid: string | null; onSaved: (q: BankQuestion, isNew: boolean) => void; onDeleted: (id: string) => void }) {
    const src = qid ? bank.questions.find(q => q.id === qid) : undefined;
    const [d, setD] = useState<Draft>(() => src ? toDraft(src) : { topic: bank.topics[0]?.key ?? "", q: emptyL(), o: [emptyL(), emptyL(), emptyL(), emptyL()], c: [0], num: "", unit: "", hidden: false, kind: "single" });
    const [tab, setTab] = useState<Lang>("de");
    const [errs, setErrs] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [upload, setUpload] = useState<{ pct: number } | null>(null);
    const [over, setOver] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const fileRef = useState(() => ({ el: null as HTMLInputElement | null }))[0];

    useEffect(() => {
        if (!dirty) return;
        const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
        addEventListener("beforeunload", h);
        return () => removeEventListener("beforeunload", h);
    }, [dirty]);
    if (qid && !src) return <main className="ab-page"><p className="ab-errline">Frage {qid} nicht gefunden.</p><Link to="/admin/fragen">Zur Liste</Link></main>;

    const set = (fn: (x: Draft) => Draft) => { setD(x => { const n = fn(x); if (errs.length) setErrs(validate(n)); return n; }); setSaved(false); setDirty(true); };
    const miss = missing(d);
    const pickFile = (f?: File) => {
        if (!f) return;
        const isV = /^video\/(mp4|webm|quicktime)$/.test(f.type) || /\.(mp4|webm|mov)$/i.test(f.name), isI = /^image\/(jpeg|png|webp)$/.test(f.type);
        if (!isV && !isI) { setErrs(["Nur JPG, PNG, WebP oder MP4, WebM, MOV."]); return; }
        if (f.size > (isV ? VID_MAX : IMG_MAX) * 1024 * 1024) { setErrs([`Datei zu groß: höchstens ${isV ? VID_MAX : IMG_MAX} MB.`]); return; }
        setErrs([]);
        const fd = new FormData(); fd.append("file", f);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API}/upload`);
        const h = authHeaders() as Record<string, string>;
        Object.entries(h).forEach(([k, v]) => xhr.setRequestHeader(k, v));
        xhr.upload.onprogress = e => { if (e.lengthComputable) setUpload({ pct: Math.round(e.loaded / e.total * 100) }); };
        xhr.onload = () => {
            setUpload(null);
            try {
                const r = JSON.parse(xhr.responseText);
                if (xhr.status >= 300 || !r.url) throw new Error(r.message || "Upload fehlgeschlagen");
                set(x => ({ ...x, media: { type: isV ? "video" : "image", src: r.url, name: f.name }, wait: undefined }));
            } catch (e: any) { setErrs([e.message || "Upload fehlgeschlagen"]); }
        };
        xhr.onerror = () => { setUpload(null); setErrs(["Upload fehlgeschlagen. Bitte erneut versuchen."]); };
        setUpload({ pct: 0 });
        xhr.send(fd);
    };
    const save = async () => {
        const e = validate(d);
        setErrs(e);
        if (e.length) return;
        setSaving(true);
        try {
            const body = {
                kind: d.kind, topic: d.topic, q: d.q, o: d.kind === "num" ? [] : d.o, c: d.kind === "num" ? [] : d.c,
                ...(d.kind === "num" ? { num: Number(d.num), unit: d.unit } : {}), media: d.media, hidden: d.hidden, wait: d.wait,
            };
            const q = await adminSaveQuestion(bank.id, qid, body as any);
            setD(toDraft(q)); setSaved(true); setDirty(false);
            onSaved(q, !qid);
        } catch (e: any) { setErrs(e.body?.errors ?? [e.message]); }
        finally { setSaving(false); }
    };
    const setKind = (k: Kind) => set(x => ({ ...x, kind: k, c: k === "single" ? (x.c.length ? [x.c[0]] : [0]) : x.c, o: k !== "num" && x.o.length < 2 ? [emptyL(), emptyL(), emptyL(), emptyL()] : x.o }));
    const toggleOk = (j: number) => set(x => ({ ...x, c: x.kind === "single" ? [j] : x.c.includes(j) ? x.c.filter(y => y !== j) : [...x.c, j].sort((a, b) => a - b) }));
    const delAns = (j: number) => set(x => { const c = x.c.filter(y => y !== j).map(y => (y > j ? y - 1 : y)); return { ...x, o: x.o.filter((_, i) => i !== j), c: x.kind === "single" && !c.length ? [0] : c }; });
    const prevText = (t: Record<Lang, string>) => t[tab] || t.de;
    const topicTitle = bank.topics.find(t => t.key === d.topic)?.title.de ?? "";

    return <main className="ab-page">
        <div className="ab-bc"><Link to="/admin/fragen">← Fragenkatalog</Link><span className="ab-muted">{qid ?? "Neue Frage"}</span></div>
        <h1>{qid ? `Frage ${qid} bearbeiten` : "Neue Frage"}</h1>
        <div className="ab-ed">
            <section className="ab-card ab-form">
                <div className="ab-row">
                    <label className="fld" style={{ flex: 1, minWidth: 220 }}><span>Modul</span>
                        <select value={d.topic} onChange={e => set(x => ({ ...x, topic: e.target.value }))}>{bank.topics.map(t => <option key={t.key} value={t.key}>{t.title.de}</option>)}</select>
                    </label>
                    <div className="fld"><span>Sichtbarkeit</span><div className="seg" role="group" aria-label="Sichtbarkeit">
                        <button type="button" aria-pressed={!d.hidden} onClick={() => set(x => ({ ...x, hidden: false }))}>Im Katalog</button>
                        <button type="button" aria-pressed={d.hidden} onClick={() => set(x => ({ ...x, hidden: true }))}>Ausgeblendet</button>
                    </div></div>
                </div>
                <div className="fld"><span>Art der Antwort</span><div className="seg" role="group" aria-label="Art der Antwort">
                    {([["single", "Eine richtige"], ["multi", "Mehrere richtige"], ["num", "Zahl eingeben"]] as [Kind, string][]).map(([k, l]) =>
                        <button key={k} type="button" aria-pressed={d.kind === k} onClick={() => setKind(k)}>{l}</button>)}
                </div></div>

                <div className="fld"><span>Bild oder Video zur Frage</span>
                    {d.wait && <p className="ab-warn">Wartet auf Bild: {d.wait}. Sobald Sie eine Datei hinzufügen, kommt die Frage in den Katalog.</p>}
                    {upload ? <div className="ab-drop busy"><span>Wird hochgeladen … {upload.pct} %</span><div className="ab-prog"><i style={{ width: `${upload.pct}%` }} /></div></div>
                        : d.media ? <div className="ab-media">
                            {d.media.type === "video" ? <video src={d.media.src} controls preload="metadata" /> : <img src={d.media.src} alt="" />}
                            <div className="r"><span className="ab-muted">{d.media.name ?? d.media.src.split("/").pop()}</span><span className="btns">
                                <button type="button" className="ab-btn o s" onClick={() => fileRef.el?.click()}>Ersetzen</button>
                                <button type="button" className="ab-btn x s" onClick={() => set(x => ({ ...x, media: undefined }))}>Entfernen</button>
                            </span></div>
                        </div>
                        : <div className={`ab-drop ${over ? "over" : ""}`} role="button" tabIndex={0}
                            onClick={() => fileRef.el?.click()} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.el?.click(); } }}
                            onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); pickFile(e.dataTransfer.files[0]); }}>
                            <Up /><span>Datei hierher ziehen oder <b>auswählen</b></span><span className="ab-muted">JPG, PNG, WebP bis {IMG_MAX} MB · MP4, WebM, MOV bis {VID_MAX} MB</span>
                        </div>}
                    <input ref={el => { fileRef.el = el; }} type="file" hidden accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" onChange={e => { pickFile(e.target.files?.[0]); e.target.value = ""; }} />
                </div>

                <div className="ab-tabs" role="tablist" aria-label="Sprache">
                    {LANGS.map(l => <button key={l} type="button" role="tab" aria-selected={l === tab} onClick={() => setTab(l)}>{l.toUpperCase()}{miss.includes(l) && <span className="miss" title="Übersetzung fehlt">!</span>}</button>)}
                </div>
                <label className="fld"><span>Fragetext</span>
                    {tab !== "de" && d.q.de && <div className="src-de"><b>Deutsch:</b> {d.q.de}</div>}
                    <AutoText value={d.q[tab]} rows={3} onChange={v => set(x => ({ ...x, q: { ...x.q, [tab]: v } }))} />
                </label>
                {d.kind === "num" ? <div className="ab-row">
                    <label className="fld" style={{ width: 180 }}><span>Richtiger Wert</span><input inputMode="numeric" value={d.num} onChange={e => set(x => ({ ...x, num: e.target.value.replace(/\D/g, "").slice(0, 9) }))} /></label>
                    <label className="fld" style={{ width: 120 }}><span>Einheit</span><input value={d.unit} maxLength={20} onChange={e => set(x => ({ ...x, unit: e.target.value }))} /></label>
                </div> : <div className="fld"><span>Antworten</span><p className="ab-muted" style={{ marginTop: -2 }}>Haken = richtige Antwort. Beim Lernen wird die Reihenfolge gemischt.</p>
                    {d.o.map((o, j) => <div key={j} className="arow">
                        <button type="button" className="ok" aria-pressed={d.c.includes(j)} aria-label={`Antwort ${j + 1} als richtig markieren`} title="Als richtig markieren" onClick={() => toggleOk(j)}><Check /></button>
                        <AutoText value={o[tab]} rows={1} onChange={v => set(x => ({ ...x, o: x.o.map((y, i) => (i === j ? { ...y, [tab]: v } : y)) }))} label={`Antwort ${j + 1}`} />
                        <button type="button" className="del" aria-label={`Antwort ${j + 1} löschen`} title="Antwort löschen" disabled={d.o.length <= 2} onClick={() => delAns(j)}><Trash /></button>
                        {tab !== "de" && o.de && <div className="src-de"><b>Deutsch:</b> {o.de}</div>}
                    </div>)}
                    {tab === "de" && d.o.length < 8 && <button type="button" className="ab-btn o s" style={{ justifySelf: "start" }} onClick={() => set(x => ({ ...x, o: [...x.o, emptyL()] }))}>+ Antwort hinzufügen</button>}
                </div>}
                {miss.length > 0 && <p className="ab-warn">Übersetzung fehlt: {miss.map(l => l.toUpperCase()).join(", ")}. Bis dahin sehen Lernende dort den deutschen Text.</p>}
                {errs.length > 0 && <ul className="ab-errs" role="alert">{errs.map(e => <li key={e}>{e}</li>)}</ul>}
                <div className="ab-foot">
                    <div>{qid && (confirm
                        ? <span className="ab-confirm">Frage endgültig löschen? <button type="button" className="ab-btn x s" onClick={async () => { await adminDeleteQuestion(bank.id, qid); onDeleted(qid); }}>Ja, löschen</button><button type="button" className="ab-btn g s" onClick={() => setConfirm(false)}>Abbrechen</button></span>
                        : <button type="button" className="ab-btn g s" onClick={() => setConfirm(true)}>Frage löschen</button>)}</div>
                    <div className="r">
                        {saved && <span className="ab-muted">Gespeichert</span>}
                        <Link className="ab-btn o" to="/admin/fragen">Zur Liste</Link>
                        <button type="button" className="ab-btn p" disabled={saving || !!upload} onClick={save}>{saving ? "Speichert …" : "Speichern"}</button>
                    </div>
                </div>
                {qid && <p className="ab-muted">Tipp: Statt zu löschen können Sie eine Frage ausblenden. Sie bleibt dann erhalten und kann später wieder sichtbar werden.</p>}
            </section>

            <aside className="ab-prev" aria-label="Vorschau">
                <p className="ab-eyebrow">Vorschau · {tab.toUpperCase()}</p>
                <article className="ab-card ab-pq">
                    <span className="id">{qid ?? "neu"} · {topicTitle}</span>
                    <p className="t">{prevText(d.q) || "…"}</p>
                    {d.media && (d.media.type === "video" ? <video src={d.media.src} controls preload="metadata" /> : <img src={d.media.src} alt="" />)}
                    {d.kind === "num" ? <span className="num"><span>…</span><b>{d.unit}</b></span> : <>
                        {d.kind === "multi" && <p className="hint">Wähle {d.c.length} Antworten.</p>}
                        <div className="opts">{d.o.filter(o => o.de.trim()).map((o, j) => <div key={j} className="opt">{d.kind === "multi" && <i className="box" />}<span>{prevText(o)}</span></div>)}</div>
                    </>}
                </article>
            </aside>
        </div>
    </main>;
}

function AutoText({ value, onChange, rows, label }: { value: string; onChange: (v: string) => void; rows: number; label?: string }) {
    return <textarea value={value} rows={rows} aria-label={label}
        ref={el => { if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight + 2}px`; } }}
        onChange={e => { onChange(e.target.value); const el = e.target; el.style.height = "auto"; el.style.height = `${el.scrollHeight + 2}px`; }} />;
}
