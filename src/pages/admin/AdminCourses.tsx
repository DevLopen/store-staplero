/**
 * Kurse (panel admina): lista kursów → kurs (moduły z tematami i testem) → edycja w szerokich panelach.
 * Zmiany trafiają do szkicu (PUT draft z numerem rewizji); kursanci widzą je dopiero po „Veröffentlichen”.
 * Edytor kroku jest uniwersalny: znajduje wszystkie teksty (LText) w danych kroku i pokazuje je jako pola w 4 językach.
 * Adresy: /admin/kurse, /admin/kurse/:courseId
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AdminShell, { Ico } from "./AdminShell";
import "./admin-courses.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const auth = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` });
async function req<T>(path: string, init?: RequestInit): Promise<T> {
    const r = await fetch(`${API}/learning${path}`, { ...init, headers: { ...auth(), ...(init?.headers ?? {}) } });
    const b = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(b.errors?.join(" · ") || b.message || `HTTP ${r.status}`), { status: r.status });
    return b as T;
}

type Lang = "de" | "en" | "pl" | "uk";
const LANGS: Lang[] = ["de", "en", "pl", "uk"];
type LT = Partial<Record<Lang, string>>;
interface Step { id: string; type: string; data: any }
interface Lesson { id: string; title: LT; durationMin?: number; steps: Step[] }
interface Chapter { id: string; title: LT; description?: LT; lessons: Lesson[] }
interface Content { title: LT; description?: LT; chapters: Chapter[] }
interface Row { id: string; slug: string; title: LT; chapterCount: number; lessonCount: number; status: "draft" | "changed" | "published"; publishedAt: string | null; learners: number; languages: string[] }
interface Full extends Row { draft: Content; revision: number; publishedVersion: number }

const P = {
    book: "M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5zM12 6v13.5",
    quiz: "M8 4H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M9 3h6v3H9zM8.5 13l2.5 2.5 4.5-5",
    chev: "m9 6 6 6-6 6", x: "M6 6l12 12M18 6 6 18", plus: "M12 5v14M5 12h14", up: "M12 19V5M6 11l6-6 6 6", down: "M12 5v14M6 13l6 6 6-6",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6", check: "M5 12.5l4.5 4.5L19 7.5", upl: "M12 16V4M7 9l5-5 5 5M4 16v4h16v-4",
};
const TYPE: Record<string, [string, string]> = {
    intro: ["Start", "In"], learn: ["Wissenskarte", "Wi"], video: ["Video", "Vi"], question: ["Einstiegsfrage", "Fr"], choice: ["Kurztest", "Kt"], sort: ["Zuordnen", "Zu"],
    gap: ["Lückentext", "Lü"], sim: ["Simulation", "Si"], summary: ["Das nimmst du mit", "Zs"], self: ["Selbsteinschätzung", "Se"], cases: ["Fälle", "Fä"], hotspot: ["Bild mit Punkten", "Bi"],
};
const LABEL: Record<string, string> = {
    title: "Titel", lead: "Einleitung", text: "Text", points: "Kernpunkte", k: "Stichwort", v: "Erklärung", merke: "Merke", src: "Quelle", formula: "Formel",
    brief: "Drehbuch (nur intern, für den Dreh)", length: "Länge", options: "Antworten", q: "Frage", why: "Erklärung", body: "Erklärung nach der Antwort", quote: "Zitat",
    resultTitle: "Ergebnis", right: "bei richtig", wrong: "bei falsch", button: "Button", items: "Fragen", allRight: "Text, wenn alles richtig", someWrong: "Text bei Fehlern",
    texts: "Texte in der Simulation", labels: "Gruppen", meta: "Zeilen", done: "Text am Ende", t: "Aussage", sentence: "Satz", chips: "Wörter", success: "Erfolg",
    say: "Aussage", role: "Rolle", facts: "Fakten", rule: "Regel", goals: "Ziele", heading: "Überschrift", note: "Hinweis", hint: "Hinweis", caption: "Bildunterschrift",
};
const isLT = (v: any) => v && typeof v === "object" && !Array.isArray(v) && typeof v.de === "string";
const strip = (s?: string) => String(s ?? "").replace(/<[^>]+>/g, "");
const tx = (t: LT | undefined, l: Lang = "de") => strip(t?.[l] || t?.de || "");
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const emptyLike = (v: any): any => (isLT(v) ? { de: "", en: "", pl: "", uk: "" } : Array.isArray(v) ? [] : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, emptyLike(x)])) : typeof v === "number" ? 0 : v);
const newId = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const stepLabel = (s: Step) => tx(s.data?.title) || tx(s.data?.heading) || tx(s.data?.lead) || tx(s.data?.text) || TYPE[s.type]?.[0] || s.type;
const isGate = (l: Lesson) => l.steps.some(s => s.type === "choice" && s.data?.gate);
const missing = (v: any, l: Lang): boolean => (isLT(v) ? !!strip(v.de) && !strip(v[l]) : Array.isArray(v) ? v.some(x => missing(x, l)) : v && typeof v === "object" ? Object.values(v).some(x => missing(x, l)) : false);
const L4 = (de = "") => ({ de, en: "", pl: "", uk: "" });
const TEMPLATES: Record<string, () => any> = {
    learn: () => ({ title: L4(), lead: L4(), points: [{ k: L4(), v: L4() }], merke: L4(), src: L4() }),
    video: () => ({ title: L4(), brief: L4() }),
    question: () => ({ title: L4(), text: L4(), options: [L4(), L4()], correct: 0, body: L4(), layout: "list" }),
    summary: () => ({ title: L4("Das nimmst du mit"), points: [{ k: L4(), v: L4() }] }),
    intro: () => ({ title: L4(), text: L4() }),
};

/* ═════════════ lista kursów ═════════════ */
export default function AdminCourses() {
    const { courseId } = useParams();
    const nav = useNavigate();
    const [ok, setOk] = useState(false);
    useEffect(() => {
        if (!localStorage.getItem("token")) { nav("/login"); return; }
        fetch(`${API}/auth/me`, { headers: auth() }).then(r => r.json()).then(d => (d.user?.isAdmin ? setOk(true) : nav("/dashboard"))).catch(() => nav("/login"));
    }, [nav]);
    if (!ok) return null;
    return <AdminShell active="kurse">{courseId ? <CourseView id={courseId} /> : <CourseList />}</AdminShell>;
}

function CourseList() {
    const [rows, setRows] = useState<Row[] | null>(null);
    const [err, setErr] = useState("");
    useEffect(() => { req<Row[]>("/admin/courses").then(setRows).catch(e => setErr(e.message)); }, []);
    return <div className="ac">
        <div className="ac-ph"><div><h1>Kurse</h1><p>Wählen Sie einen Kurs, um Module, Themen und Tests zu bearbeiten.</p></div></div>
        {err && <p className="ac-err">{err}</p>}
        <div className="ac-kc-list">
            {rows?.map(r => <Link key={r.id} to={`/admin/kurse/${r.id}`} className="ac-kc">
                <div className="cov"><b>{tx(r.title)}</b><Status s={r.status} /></div>
                <div className="bd"><div className="facts"><span><b>{r.chapterCount}</b> Module</span><span><b>{r.lessonCount}</b> Themen</span><span><b>{r.learners}</b> aktive Kursanten</span><span>{r.languages.map(l => l.toUpperCase()).join(" · ")}</span></div></div>
            </Link>)}
            <Link to="/admin#courses" className="ac-kc arch"><div className="cov"><b>Alter Kurs (Archiv)</b></div><div className="bd"><div className="facts"><span>Frühere Kursversion mit „Inhalte“ und „Tests“. Bleibt erhalten, wird aber nicht mehr genutzt.</span></div></div></Link>
        </div>
        {!rows && !err && <p className="ac-muted">Lädt …</p>}
    </div>;
}
const Status = ({ s }: { s: Row["status"] }) => s === "published" ? <span className="ac-st ok">Veröffentlicht</span> : s === "changed" ? <span className="ac-st warn">Entwurf mit Änderungen</span> : <span className="ac-st none">Noch nicht veröffentlicht</span>;

/* ═════════════ kurs ═════════════ */
function CourseView({ id }: { id: string }) {
    const { toast } = useToast();
    const [c, setC] = useState<Full | null>(null);
    const [err, setErr] = useState("");
    const [tab, setTab] = useState<"mods" | "exam">("mods");
    const [open, setOpen] = useState<string | null>(null);
    const [panel, setPanel] = useState<{ kind: "lesson" | "test"; ch: number; le: number } | null>(null);
    const [confirmPub, setConfirmPub] = useState(false);
    const [busy, setBusy] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);

    const load = useCallback(() => req<Full>(`/admin/courses/${id}`).then(setC).catch(e => setErr(e.message)), [id]);
    useEffect(() => { load(); }, [load]);

    /** Zapis całego szkicu (jak dotychczasowe API): zmiana w kopii → PUT z rewizją → nowa rewizja. */
    const saveDraft = async (fn: (d: Content) => void, msg = "Im Entwurf gespeichert") => {
        if (!c) return false;
        const draft = clone(c.draft); fn(draft);
        try {
            const r = await req<{ revision: number }>(`/admin/courses/${id}/draft`, { method: "PUT", body: JSON.stringify({ draft, revision: c.revision }) });
            setC({ ...c, draft, revision: r.revision, status: c.publishedVersion ? "changed" : "draft" });
            setPreviewKey(k => k + 1);
            toast({ title: msg });
            return true;
        } catch (e: any) {
            toast({ title: e.status === 409 ? "Zwischenzeitlich geändert" : "Speichern fehlgeschlagen", description: e.message, variant: "destructive" });
            if (e.status === 409) load();
            return false;
        }
    };
    const publish = async () => {
        setBusy(true);
        try { await req(`/admin/courses/${id}/publish`, { method: "POST" }); await load(); setConfirmPub(false); toast({ title: "Veröffentlicht", description: "Kursanten sehen jetzt die neue Version. Ihr Fortschritt bleibt erhalten." }); }
        catch (e: any) { toast({ title: "Veröffentlichen fehlgeschlagen", description: e.message, variant: "destructive" }); }
        finally { setBusy(false); }
    };

    if (err) return <p className="ac-err">{err}</p>;
    if (!c) return <p className="ac-muted">Lädt …</p>;
    const chapters = c.draft.chapters;
    const modules = chapters.map((ch, i) => ({ ch, i })).filter(x => x.ch.id !== "ch_exam");
    const exam = chapters.find(ch => ch.id === "ch_exam");
    const nTopics = modules.reduce((n, m) => n + m.ch.lessons.filter(l => !isGate(l)).length, 0);

    return <div className="ac">
        <div><Link to="/admin/kurse" className="ac-back">← Alle Kurse</Link></div>
        <div className="ac-head">
            <div><h1>{tx(c.draft.title)}</h1>
                <div className="sub"><Status s={c.status} /><span>{modules.length} Module · {nTopics} Themen · {c.learners} aktive Kursanten{c.publishedAt ? ` · veröffentlicht am ${new Date(c.publishedAt).toLocaleDateString("de-DE")}` : ""}</span></div></div>
            <div className="acts">
                {confirmPub ? <span className="ac-confirm">Kursanten sehen die Änderungen sofort. <button className="ac-btn p" disabled={busy} onClick={publish}>Jetzt veröffentlichen</button><button className="ac-btn g" onClick={() => setConfirmPub(false)}>Abbrechen</button></span>
                    : <button className="ac-btn p" disabled={c.status === "published"} onClick={() => setConfirmPub(true)}>Veröffentlichen</button>}
            </div>
        </div>
        <div className="ac-seg"><button aria-pressed={tab === "mods"} onClick={() => setTab("mods")}>Module &amp; Themen</button>{exam && <button aria-pressed={tab === "exam"} onClick={() => setTab("exam")}>Abschlussprüfung</button>}</div>

        {tab === "mods" ? <div className="ac-mods">{modules.map(({ ch, i }, n) => {
            const topics = ch.lessons.map((l, j) => ({ l, j })).filter(x => !isGate(x.l));
            const gate = ch.lessons.findIndex(isGate);
            const gd = gate >= 0 ? ch.lessons[gate].steps.find(s => s.data?.gate)?.data : null;
            const active = gd ? gd.items.filter((q: any) => !q.disabled).length : 0;
            const min = ch.lessons.reduce((m, l) => m + (l.durationMin || 0), 0);
            const isOpen = open === ch.id;
            return <section key={ch.id} className={`ac-card ac-mod ${isOpen ? "open" : ""}`}>
                <button className="ac-mod-h" onClick={() => setOpen(isOpen ? null : ch.id)}>
                    <span className="ac-mod-n">{n + 1}</span>
                    <span><b>{tx(ch.title)}</b><span className="m">{topics.length} Themen · {min} Min</span></span>
                    {gd ? <span className="ac-tst">Test: {gd.count} aus {active} Fragen · ab {gd.passPercent ?? 80} %</span> : <span className="ac-tst none">ohne Test</span>}
                    <Ico d={P.chev} className="ic chv" />
                </button>
                {isOpen && <div className="ac-mod-b">
                    {topics.map(({ l, j }) => <button key={l.id} className="ac-trow" onClick={() => setPanel({ kind: "lesson", ch: i, le: j })}>
                        <span className="adm-tile t-indigo"><Ico d={P.book} /></span>
                        <span><b>{tx(l.title)}</b></span>
                        <span className="tp">{l.steps.map(s => <i key={s.id} className={`k-${s.type}`} title={TYPE[s.type]?.[0]} />)}</span>
                        <span className="min">{l.steps.length} Schritte · {l.durationMin ?? "–"} Min</span>
                        <Ico d={P.chev} className="ic chv2" />
                    </button>)}
                    {gate >= 0 && <button className="ac-trow test" onClick={() => setPanel({ kind: "test", ch: i, le: gate })}>
                        <span className="adm-tile t-green"><Ico d={P.quiz} /></span><span><b>Modul-Test</b></span><span />
                        <span className="min">{gd.count} Fragen pro Versuch aus {active} · ab {gd.passPercent ?? 80} %</span><Ico d={P.chev} className="ic chv2" />
                    </button>}
                    <div className="ac-addrow"><button className="ac-btn o s" onClick={async () => {
                        const at = gate >= 0 ? gate : ch.lessons.length, lid = newId("ls");
                        const ok = await saveDraft(d => { d.chapters[i].lessons.splice(at, 0, { id: lid, title: L4("Neues Thema"), durationMin: 5, steps: [{ id: newId("st"), type: "learn", data: TEMPLATES.learn() }] }); }, "Thema angelegt");
                        if (ok) setPanel({ kind: "lesson", ch: i, le: at });
                    }}><Ico d={P.plus} />Thema</button></div>
                </div>}
            </section>;
        })}</div> : exam && <ExamSettings exam={exam} onSave={(data) => saveDraft(d => {
            const st = d.chapters.find(x => x.id === "ch_exam")!.lessons[0].steps.find(s => s.type === "sim")!; Object.assign(st.data, data);
        })} />}

        {panel && <div className="ac-scrim" onClick={() => setPanel(null)} />}
        {panel?.kind === "lesson" && c.draft.chapters[panel.ch]?.lessons[panel.le] && <LessonPanel key={`${panel.ch}|${panel.le}`} courseId={id} chapter={c.draft.chapters[panel.ch]} chIndex={modules.findIndex(m => m.i === panel.ch)}
            lesson={c.draft.chapters[panel.ch].lessons[panel.le]} previewKey={previewKey} onClose={() => setPanel(null)}
            onSave={(lesson) => saveDraft(d => { d.chapters[panel.ch].lessons[panel.le] = lesson; })}
            onDelete={async () => { if (await saveDraft(d => { d.chapters[panel.ch].lessons.splice(panel.le, 1); }, "Thema gelöscht")) setPanel(null); }} />}
        {panel?.kind === "test" && <TestPanel key={`t${panel.ch}`} chapter={c.draft.chapters[panel.ch]} chIndex={modules.findIndex(m => m.i === panel.ch)} lesson={c.draft.chapters[panel.ch].lessons[panel.le]} onClose={() => setPanel(null)}
            onSave={(data) => saveDraft(d => { const st = d.chapters[panel.ch].lessons[panel.le].steps.find(s => s.data?.gate)!; st.data = data; })} />}
    </div>;
}

/* ═════════════ temat: kroki + formularz + podgląd ═════════════ */
function LessonPanel({ courseId, chapter, chIndex, lesson, previewKey, onClose, onSave, onDelete }: {
    courseId: string; chapter: Chapter; chIndex: number; lesson: Lesson; previewKey: number; onClose: () => void; onSave: (l: Lesson) => Promise<boolean>; onDelete: () => void;
}) {
    const [l, setL] = useState<Lesson>(() => clone(lesson));
    const [sel, setSel] = useState(0);
    const [lang, setLang] = useState<Lang>("de");
    const [dirty, setDirty] = useState(false);
    const [busy, setBusy] = useState(false);
    const [adding, setAdding] = useState(false);
    const [confirm, setConfirm] = useState<"" | "step" | "lesson">("");
    const st = l.steps[sel];
    const upd = (fn: (x: Lesson) => void) => { setL(x => { const n = clone(x); fn(n); return n; }); setDirty(true); };
    const save = async () => { setBusy(true); const ok = await onSave(l); setBusy(false); if (ok) setDirty(false); };
    const move = (k: number, d: number) => upd(x => { const [s] = x.steps.splice(k, 1); x.steps.splice(k + d, 0, s); setSel(k + d); });

    return <aside className="ac-panel" aria-label="Thema bearbeiten">
        <header className="ac-ph"><span className="adm-tile t-indigo ac-big"><Ico d={P.book} /></span>
            <div><small>Modul {chIndex + 1} · {tx(chapter.title)}</small><h2>{tx(l.title) || "Neues Thema"}</h2></div>
            <button className="ac-x" aria-label="Schließen" onClick={onClose}><Ico d={P.x} /></button></header>
        <div className="ac-pb three">
            <div className="ac-col">
                <div className="ac-box ac-form">
                    <label className="ac-fl">Titel des Themas<input value={l.title[lang] ?? ""} onChange={e => upd(x => { x.title = { ...x.title, [lang]: e.target.value }; })} />{lang !== "de" && <span className="de"><b>DE:</b> {tx(l.title)}</span>}</label>
                    <label className="ac-fl">Dauer (Minuten)<input type="number" min={1} value={l.durationMin ?? ""} onChange={e => upd(x => { x.durationMin = Number(e.target.value) || undefined; })} /></label>
                </div>
                <p className="ac-sec">Schritte ({l.steps.length})</p>
                <div className="ac-box ac-steps">{l.steps.map((s, k) => <div key={s.id} className={`ac-sitem k-${s.type}`} aria-pressed={k === sel} onClick={() => setSel(k)} role="button" tabIndex={0}>
                    <span className="kt">{TYPE[s.type]?.[1] ?? "?"}</span>
                    <span className="lb"><b>{stepLabel(s)}</b><small>{TYPE[s.type]?.[0] ?? s.type}{s.type === "sim" && s.data?.sim ? ` · ${s.data.sim}` : ""}{missing(s.data, lang) && lang !== "de" ? " · Übersetzung fehlt" : ""}</small></span>
                    {k === sel && <span className="mv"><button aria-label="Nach oben" disabled={k === 0} onClick={e => { e.stopPropagation(); move(k, -1); }}><Ico d={P.up} /></button><button aria-label="Nach unten" disabled={k === l.steps.length - 1} onClick={e => { e.stopPropagation(); move(k, 1); }}><Ico d={P.down} /></button></span>}
                </div>)}</div>
                {adding ? <div className="ac-box ac-add">{Object.keys(TEMPLATES).map(t => <button key={t} className="ac-btn o s" onClick={() => { upd(x => { x.steps.splice(sel + 1, 0, { id: newId("st"), type: t, data: TEMPLATES[t]() }); }); setSel(sel + 1); setAdding(false); }}>{TYPE[t][0]}</button>)}<button className="ac-btn g s" onClick={() => setAdding(false)}>Abbrechen</button><small className="ac-hint">Simulationen, Zuordnen und Lückentexte bleiben wie bisher in den Themen; neue fügen wir bei Bedarf gemeinsam hinzu.</small></div>
                    : <button className="ac-btn o s" style={{ justifySelf: "start" }} onClick={() => setAdding(true)}><Ico d={P.plus} />Schritt nach dem gewählten</button>}
            </div>
            <div className="ac-col">
                {st ? <div className="ac-box ac-form">
                    <div className="ac-row-b"><b>{TYPE[st.type]?.[0] ?? st.type}{st.type === "sim" && st.data?.sim ? ` · ${st.data.sim}` : ""}</b>
                        <div className="ac-ltabs">{LANGS.map(x => <button key={x} aria-pressed={x === lang} onClick={() => setLang(x)}>{x.toUpperCase()}{x !== "de" && missing(st.data, x) && <i />}</button>)}</div></div>
                    {st.type === "sim" && <p className="ac-hint">Aussehen und Ablauf der Simulation sind fest programmiert. Hier ändern Sie die Texte.</p>}
                    {st.type === "video" && <VideoUpload url={st.data?.url} onUrl={url => upd(x => { x.steps[sel].data.url = url || undefined; })} />}
                    <DataForm value={st.data} lang={lang} onChange={data => upd(x => { x.steps[sel].data = data; })} />
                </div> : <p className="ac-muted">Dieses Thema hat noch keine Schritte.</p>}
                <div className="ac-danger">
                    {confirm === "step" ? <><span>Schritt wirklich entfernen?</span><button className="ac-btn x s" onClick={() => { upd(x => { x.steps.splice(sel, 1); }); setSel(Math.max(0, sel - 1)); setConfirm(""); }}>Ja, entfernen</button><button className="ac-btn g s" onClick={() => setConfirm("")}>Abbrechen</button></>
                        : confirm === "lesson" ? <><span>Ganzes Thema löschen? Fortschritt der Kursanten in diesem Thema geht verloren.</span><button className="ac-btn x s" onClick={onDelete}>Ja, löschen</button><button className="ac-btn g s" onClick={() => setConfirm("")}>Abbrechen</button></>
                            : <>{st && <button className="ac-btn x s" onClick={() => setConfirm("step")}>Schritt entfernen</button>}<button className="ac-btn g s" onClick={() => setConfirm("lesson")}>Thema löschen</button></>}
                </div>
            </div>
            <div className="ac-col ac-pvc">
                <div className="ac-phone"><iframe key={`${previewKey}|${sel}`} title="Vorschau" src={`/lernen/${courseId}/${lesson.id}?draft=1&step=${sel}`} /></div>
                <p className="ac-hint" style={{ textAlign: "center" }}>{dirty ? "Vorschau zeigt den zuletzt gespeicherten Stand." : "Vorschau des Entwurfs, so wie ein Kursant ihn sieht."}</p>
            </div>
        </div>
        <footer className="ac-pf"><span className="ac-hint">{dirty ? "Nicht gespeicherte Änderungen" : "Gespeichert im Entwurf · erst „Veröffentlichen“ zeigt es den Kursanten"}</span>
            <div><button className="ac-btn o" onClick={onClose}>Schließen</button><button className="ac-btn p" disabled={!dirty || busy} onClick={save}>{busy ? "Speichert …" : "Speichern"}</button></div></footer>
    </aside>;
}

/** Wszystkie teksty kroku jako pola. Tablice obiektów (punkty, pytania) można rozszerzać i skracać, przy odpowiedziach wybiera się poprawną. */
function DataForm({ value, lang, onChange }: { value: any; lang: Lang; onChange: (v: any) => void }) {
    const set = (path: (string | number)[], v: any) => { if (!path.length) { onChange(v); return; } const n = clone(value); let o = n; path.slice(0, -1).forEach(k => { o = o[k]; }); o[path[path.length - 1]] = v; onChange(n); };
    return <div className="ac-df">{renderNode(value, [], "", lang, value, set)}</div>;
}
function labelOf(key: string | number, parentKey: string) {
    if (typeof key === "number") return parentKey === "options" ? `Antwort ${key + 1}` : `${LABEL[parentKey] ? LABEL[parentKey].replace(/n$/, "") : "Eintrag"} ${key + 1}`;
    return LABEL[key] ?? key;
}
function renderNode(v: any, path: (string | number)[], parentKey: string, lang: Lang, root: any, set: (p: (string | number)[], v: any) => void): any {
    const key = path[path.length - 1];
    if (isLT(v)) {
        const label = typeof key === "number" && parentKey ? labelOf(key, parentKey) : labelOf(key as string, parentKey);
        const val = v[lang] ?? "", long = (v.de ?? "").length > 70 || /<|\n/.test(v.de ?? "");
        return <label key={path.join(".")} className="ac-fl">{label}
            {lang !== "de" && v.de && <span className="de"><b>DE:</b> {strip(v.de)}</span>}
            {long ? <textarea value={val} onChange={e => set(path, { ...v, [lang]: e.target.value })} rows={Math.min(8, Math.max(2, Math.ceil(val.length / 60)))} />
                : <input value={val} onChange={e => set(path, { ...v, [lang]: e.target.value })} />}
        </label>;
    }
    if (Array.isArray(v)) {
        if (!v.length && !(typeof key === "string" && ["points", "options", "items"].includes(key))) return null;
        const parent = path.length > 1 ? path.slice(0, -1).reduce((o: any, k) => o?.[k], root) : root;
        const correct = key === "options" && parent && (typeof parent.correct === "number" || Array.isArray(parent.correct)) ? parent.correct : undefined;
        const kids = v.map((x, i) => {
            const inner = renderNode(x, [...path, i], key as string, lang, root, set);
            if (!inner) return null;
            const isRight = correct !== undefined && (Array.isArray(correct) ? correct.includes(i) : correct === i);
            return <div key={i} className={`ac-item ${isLT(x) ? "flat" : ""}`}>
                {correct !== undefined && <button type="button" className="ac-okb" aria-pressed={isRight} title="Richtige Antwort" onClick={() => set([...path.slice(0, -1), "correct"], Array.isArray(correct) ? (isRight ? correct.filter((c: number) => c !== i) : [...correct, i].sort()) : i)}><Ico d={P.check} /></button>}
                <div className="ac-item-in">{inner}</div>
                {v.length > 1 && <button type="button" className="ac-rm" title="Entfernen" onClick={() => {
                    const n = v.filter((_, k) => k !== i);
                    if (correct === undefined) { set(path, n); return; }
                    // odpowiedzi i numer poprawnej zmieniamy razem, jednym zapisem
                    const np = clone(parent); np[key as string] = n;
                    np.correct = Array.isArray(correct) ? correct.filter((c: number) => c !== i).map((c: number) => (c > i ? c - 1 : c)) : correct > i ? correct - 1 : correct === i ? 0 : correct;
                    set(path.slice(0, -1), np);
                }}><Ico d={P.x} /></button>}
            </div>;
        }).filter(Boolean);
        if (!kids.length && v.length) return null;
        return <div key={path.join(".")} className="ac-group"><span className="ac-gl">{LABEL[key as string] ?? key}</span>{kids}
            {v.length > 0 && <button type="button" className="ac-btn o s" style={{ justifySelf: "start" }} onClick={() => set(path, [...v, emptyLike(v[v.length - 1])])}><Ico d={P.plus} />{key === "options" ? "Antwort" : key === "items" ? "Frage" : "Eintrag"}</button>}
        </div>;
    }
    if (v && typeof v === "object") {
        const keys = Object.keys(v).sort((a, b) => (a === "title" ? -1 : b === "title" ? 1 : 0));
        const kids = keys.map(k => renderNode(v[k], [...path, k], k, lang, root, set)).filter(Boolean);
        if (!kids.length) return null;
        if (!path.length || typeof key === "number") return <div key={path.join(".") || "root"} className="ac-obj">{kids}</div>;
        return <div key={path.join(".")} className="ac-group"><span className="ac-gl">{LABEL[key as string] ?? key}</span>{kids}</div>;
    }
    return null;
}

function VideoUpload({ url, onUrl }: { url?: string; onUrl: (u: string) => void }) {
    const ref = useRef<HTMLInputElement>(null);
    const [pct, setPct] = useState<number | null>(null);
    const [err, setErr] = useState("");
    const pick = (f?: File) => {
        if (!f) return;
        if (!/^video\/|\.(mp4|webm|mov)$/i.test(f.type || f.name)) { setErr("Bitte ein Video (MP4, WebM, MOV) wählen."); return; }
        setErr("");
        const fd = new FormData(); fd.append("file", f);
        const x = new XMLHttpRequest(); x.open("POST", `${API}/upload`); x.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("token")}`);
        x.upload.onprogress = e => e.lengthComputable && setPct(Math.round(e.loaded / e.total * 100));
        x.onload = () => { setPct(null); try { const r = JSON.parse(x.responseText); if (x.status >= 300 || !r.url) throw new Error(r.message); onUrl(r.url); } catch (e: any) { setErr(e.message || "Upload fehlgeschlagen"); } };
        x.onerror = () => { setPct(null); setErr("Upload fehlgeschlagen"); };
        setPct(0); x.send(fd);
    };
    return <div className="ac-fl">Video
        {url ? <div className="ac-vid"><video src={url} controls preload="metadata" /><div><button className="ac-btn o s" onClick={() => ref.current?.click()}>Ersetzen</button><button className="ac-btn x s" onClick={() => onUrl("")}>Entfernen</button></div></div>
            : <button type="button" className="ac-drop" onClick={() => ref.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}>
                <Ico d={P.upl} />{pct !== null ? `Wird hochgeladen … ${pct} %` : <span>Video hierher ziehen oder <b>auswählen</b></span>}<small>Solange kein Video da ist, sieht der Kursant den Platzhalter.</small></button>}
        {err && <span className="ac-err">{err}</span>}
        <input ref={ref} type="file" hidden accept="video/mp4,video/webm,video/quicktime" onChange={e => { pick(e.target.files?.[0]); e.target.value = ""; }} />
    </div>;
}

/* ═════════════ test modułu ═════════════ */
function TestPanel({ chapter, chIndex, lesson, onClose, onSave }: { chapter: Chapter; chIndex: number; lesson: Lesson; onClose: () => void; onSave: (data: any) => Promise<boolean> }) {
    const [d, setD] = useState<any>(() => clone(lesson.steps.find(s => s.data?.gate)!.data));
    const [filter, setFilter] = useState<"" | "les" | "kl" | "off">("");
    const [edit, setEdit] = useState<number | null>(null);
    const [lang, setLang] = useState<Lang>("de");
    const [dirty, setDirty] = useState(false);
    const [busy, setBusy] = useState(false);
    const upd = (fn: (x: any) => void) => { setD((x: any) => { const n = clone(x); fn(n); return n; }); setDirty(true); };
    const items: any[] = d.items;
    const active = items.filter(q => !q.disabled).length;
    const list = items.map((q, k) => ({ q, k })).filter(({ q }) => !filter || (filter === "kl" ? q.src : filter === "les" ? !q.src : q.disabled));
    const right = (q: any) => q.unit ? `${q.correct} ${q.unit}` : Array.isArray(q.correct) ? q.correct.map((k: number) => tx(q.options[k])).join(" · ") : tx(q.options?.[q.correct]);
    const save = async () => { if (active < d.count) return; setBusy(true); const ok = await onSave(d); setBusy(false); if (ok) setDirty(false); };
    const q = edit !== null ? items[edit] : null;

    return <aside className="ac-panel" aria-label="Modul-Test">
        <header className="ac-ph"><span className="adm-tile t-green ac-big"><Ico d={P.quiz} /></span><div><small>Modul {chIndex + 1} · {tx(chapter.title)}</small><h2>Modul-Test</h2></div>
            <button className="ac-x" aria-label="Schließen" onClick={onClose}><Ico d={P.x} /></button></header>
        <div className="ac-pb two">
            <div className="ac-col"><p className="ac-sec">Einstellungen</p><div className="ac-box ac-form">
                <div className="ac-fl">Fragen pro Versuch<div className="ac-num"><button onClick={() => upd(x => { x.count = Math.max(1, x.count - 1); })}>−</button><b>{d.count}</b><button onClick={() => upd(x => { x.count = Math.min(active, x.count + 1); })}>+</button></div>
                    <span className="ac-hint">aus {active} aktiven Fragen, bei jedem Versuch neu gezogen</span>{active < d.count && <span className="ac-err">Es sind weniger aktive Fragen als Fragen pro Versuch.</span>}</div>
                <div className="ac-fl">Bestanden ab<div className="ac-num"><button onClick={() => upd(x => { x.passPercent = Math.max(50, (x.passPercent ?? 80) - 5); })}>−</button><b>{d.passPercent ?? 80} %</b><button onClick={() => upd(x => { x.passPercent = Math.min(100, (x.passPercent ?? 80) + 5); })}>+</button></div>
                    <span className="ac-hint">nötig: {Math.ceil(d.count * (d.passPercent ?? 80) / 100)} von {d.count} richtig</span></div>
                <p className="ac-hint">Erst nach bestandenem Test wird das nächste Modul freigeschaltet. Am Ende sieht der Kursant nur sein Ergebnis, nicht die Lösungen.</p>
            </div></div>
            <div className="ac-col">
                {q ? <>
                    <div className="ac-row-b"><button className="ac-btn g s" onClick={() => setEdit(null)}>← Fragen</button><span className={`ac-src ${q.src ? "kl" : "les"}`}>{q.src ? `Fragenkatalog ${q.src}` : "aus Thema / Test"}</span></div>
                    <div className="ac-box ac-form">
                        <div className="ac-row-b"><span className="ac-hint">{q.unit ? "Zahl eingeben" : Array.isArray(q.correct) ? "Mehrere richtige" : "Eine richtige"}{q.img ? " · mit Bild" : ""}</span>
                            <div className="ac-ltabs">{LANGS.map(x => <button key={x} aria-pressed={x === lang} onClick={() => setLang(x)}>{x.toUpperCase()}{x !== "de" && missing({ q: q.q, o: q.options }, x) && <i />}</button>)}</div></div>
                        {q.img && <img src={q.img} alt="" className="ac-qimg" />}
                        <DataForm value={{ q: q.q, options: q.options, correct: q.correct, why: q.why }} lang={lang} onChange={v => upd(x => { Object.assign(x.items[edit!], { q: v.q, options: v.options, correct: v.correct, why: v.why }); })} />
                        {q.unit && <label className="ac-fl">Richtiger Wert ({q.unit})<input type="number" value={q.correct} onChange={e => upd(x => { x.items[edit!].correct = Number(e.target.value); })} /></label>}
                        <label className="ac-toggle"><span>Im Test verwenden</span><button className="ac-sw" role="switch" aria-checked={!q.disabled} onClick={() => upd(x => { x.items[edit!].disabled = !x.items[edit!].disabled || undefined; })} /></label>
                        {q.src && <p className="ac-hint">Diese Frage stammt aus dem Fragenkatalog. Änderungen hier gelten für den Test; im Fragenkatalog bearbeiten Sie sie unter „Fragenkatalog“.</p>}
                    </div>
                </> : <>
                    <div className="ac-row-b"><p className="ac-sec">Fragen im Test ({active} von {items.length})</p>
                        <button className="ac-btn p s" onClick={() => { upd(x => { x.items.unshift({ q: L4(), options: [L4(), L4(), L4(), L4()], correct: 0, why: L4() }); }); setEdit(0); }}><Ico d={P.plus} />Neue Frage</button></div>
                    <div className="ac-box">
                        <div className="ac-qf"><div className="ac-seg">{([["", "Alle"], ["les", "Aus Themen"], ["kl", "Fragenkatalog"], ["off", "Ausgeschaltet"]] as const).map(([k, t]) => <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{t}</button>)}</div></div>
                        {list.map(({ q, k }) => <div key={k} className={`ac-qrow ${q.disabled ? "off" : ""}`} onClick={() => setEdit(k)} role="button" tabIndex={0}>
                            <span><b>{tx(q.q) || "Neue Frage"}</b><small>{right(q)}</small></span>
                            <span className={`ac-src ${q.src ? "kl" : "les"}`}>{q.src || "Thema"}</span>
                            <button className="ac-sw" role="switch" aria-checked={!q.disabled} title="Im Test verwenden" onClick={e => { e.stopPropagation(); upd(x => { x.items[k].disabled = !x.items[k].disabled || undefined; }); }} />
                        </div>)}
                        {!list.length && <p className="ac-muted" style={{ padding: 14 }}>Keine Fragen in dieser Auswahl.</p>}
                    </div>
                </>}
            </div>
        </div>
        <footer className="ac-pf"><span className="ac-hint">{dirty ? "Nicht gespeicherte Änderungen" : "Ausgeschaltete Fragen werden beim Veröffentlichen aus dem Test genommen, bleiben hier aber erhalten."}</span>
            <div><button className="ac-btn o" onClick={onClose}>Schließen</button><button className="ac-btn p" disabled={!dirty || busy || active < d.count} onClick={save}>{busy ? "Speichert …" : "Speichern"}</button></div></footer>
    </aside>;
}

function ExamSettings({ exam, onSave }: { exam: Chapter; onSave: (d: any) => Promise<boolean> }) {
    const st = exam.lessons[0]?.steps.find(s => s.type === "sim");
    const [v, setV] = useState(() => ({ count: Number(st?.data?.count ?? 50), minutes: Number(st?.data?.minutes ?? 45), passPercent: Number(st?.data?.passPercent ?? 80) }));
    const [dirty, setDirty] = useState(false);
    const pool = useMemo(() => (st?.data?.items ?? []).length, [st]);
    if (!st) return <p className="ac-muted">Keine Abschlussprüfung in diesem Kurs.</p>;
    const N = ({ k, step, unit = "" }: { k: keyof typeof v; step: number; unit?: string }) => <div className="ac-num"><button onClick={() => { setV(x => ({ ...x, [k]: Math.max(1, x[k] - step) })); setDirty(true); }}>−</button><b>{v[k]}{unit}</b><button onClick={() => { setV(x => ({ ...x, [k]: x[k] + step })); setDirty(true); }}>+</button></div>;
    return <section className="ac-card ac-exam">
        <div><h2>Abschlussprüfung</h2><p className="ac-hint">Fragen werden bei jedem Versuch aus dem Prüfungspool gezogen, gleichmäßig über die Module verteilt.</p></div>
        <div className="ac-exam-n"><div className="ac-fl">Fragen pro Prüfung<N k="count" step={1} /></div><div className="ac-fl">Zeit (Minuten)<N k="minutes" step={5} /></div><div className="ac-fl">Bestanden ab<N k="passPercent" step={5} unit=" %" /></div></div>
        <p className="ac-hint">Prüfungspool: {pool} Fragen.{v.count > pool ? " Achtung: mehr Fragen pro Prüfung als im Pool." : ""}</p>
        <div><button className="ac-btn p" disabled={!dirty || v.count > pool} onClick={async () => { if (await onSave(v)) setDirty(false); }}>Speichern</button></div>
    </section>;
}
