/** Moduł 6 „Regelmäßige Prüfung”: codzienna kontrola wózka w 3D i odczyt plakietki kontrolnej. */
import { lazy, useState } from "react";
import { LText, SimData } from "../types";
import { Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from "../steps";
import { useSimText } from "./shared";
import { S3, use3dUi } from "./lazy3d";
import type { CheckMark } from "./three/scenesPruef";
import "./tech.css";

const CheckScene = lazy(() => import("./three/scenesPruef").then(m => ({ default: m.CheckScene })));

/* ───────── codzienna kontrola ───────── */
interface Pt {
    id: string; look?: boolean; bad?: boolean; label: LText; finding: LText; why: LText;
    action?: LText;                       // test funkcji: co robisz (np. Hupe betätigen)
    gauge?: { kind: "pedal"; at: number } | { kind: "play"; fingers: number; max: number };
}

export function DailyCheckSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState } = usePlayer();
    const T = useSimText(data), ui = use3dUi();
    const pts = (data.points ?? []) as Pt[];
    const [st, setSt] = useStepState<{ ans: Record<string, "ok" | "bad">; tested: Record<string, boolean>; cur: string | null }>({ ans: {}, tested: {}, cur: null });
    const [view, setView] = useState<string | null>(null);
    const cur = pts.find(p => p.id === st.cur);
    const pick = (id: string) => { setSt(s => ({ ...s, cur: id })); setView(id); };
    const answer = (v: "ok" | "bad") => cur && !st.ans[cur.id] && setSt(s => ({ ...s, ans: { ...s.ans, [cur.id]: v } }));
    const right = (p: Pt) => st.ans[p.id] === (p.bad ? "bad" : "ok");
    const marks: Record<string, CheckMark> = Object.fromEntries(pts.map(p => [p.id, st.ans[p.id] ? (right(p) ? "ok" : "no") : st.cur === p.id ? "cur" : ""]));
    const n = Object.keys(st.ans).length, all = n === pts.length;
    const found = pts.filter(p => p.bad && st.ans[p.id] === "bad").length, bads = pts.filter(p => p.bad).length;
    const bad = (id: string) => !!pts.find(p => p.id === id && p.bad);
    const defects = { fork: bad("forks"), tyre: bad("tyre"), chain: bad("chain"), leak: bad("leak") };
    const needsTest = !!cur && !cur.look && !st.tested[cur.id];
    const test = cur && !cur.look && st.tested[cur.id] ? cur.id : null;
    const group = (look: boolean) => pts.filter(p => !!p.look === look);
    const Chips = ({ look }: { look: boolean }) => <div className="chk3">
        <span className="chk3-h">{T(look ? "Sichtprüfung" : "Funktionsprüfung")}</span>
        <div>{group(look).map(p => <button key={p.id} type="button" aria-pressed={st.cur === p.id} className={st.ans[p.id] ? (right(p) ? "ok" : "no") : ""} onClick={() => pick(p.id)}>{x(p.label)}</button>)}</div>
    </div>;
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        {x(data.lead as LText) && <p className="small">{x(data.lead as LText)}</p>}
        <div className={`prog ${all ? "done" : ""}`}><span>{T("Geprüft")}</span><div className="bar"><i style={{ width: `${n / Math.max(1, pts.length) * 100}%` }} /></div><b>{n} / {pts.length}</b></div>
        <S3 cls="s3d-check" fallback={ui.loading}>
            <CheckScene points={pts.map(p => ({ id: p.id, label: x(p.label), look: !!p.look }))} marks={marks} cur={view} defects={defects} test={test}
                onPick={pick} label={x(data.title)} hint={ui.hint} resetLabel={ui.resetLabel} />
        </S3>
        <Chips look /><Chips look={false} />
        {!cur && <div className="part empty">{T("Tippe auf einen Punkt am Stapler oder in der Liste.")}</div>}
        {cur && <div className={`part chk3-card ${st.ans[cur.id] ? (right(cur) ? "verdict ok" : "verdict no") : ""}`} key={cur.id} aria-live="polite">
            <b>{x(cur.label)}</b>
            {needsTest ? <>
                <p>{T("Führe den Test durch und beobachte das Ergebnis.")}</p>
                <button type="button" className="btn btn-d chk3-go" onClick={() => setSt(s => ({ ...s, tested: { ...s.tested, [cur.id]: true } }))}>{x(cur.action as LText)}</button>
            </> : <>
                {cur.gauge && <Gauge g={cur.gauge} T={T} />}
                {!st.ans[cur.id] ? <>
                    <p>{T(cur.look ? "Schau genau hin. Drehe das Modell, wenn nötig." : "Was stellst du fest?")}</p>
                    <div className="nav2 chk3-ans">
                        <button type="button" className="btn btn-o" onClick={() => answer("ok")}>{T("In Ordnung")}</button>
                        <button type="button" className="btn btn-o" onClick={() => answer("bad")}>{T("Mangel")}</button>
                    </div>
                </> : <>
                    <p className="chk3-res">{right(cur) ? t("right") : t("notQuite")} · {T(cur.bad ? "Mangel" : "In Ordnung")}</p>
                    <p><span className="chk3-f">{x(cur.finding)}</span> {x(cur.why)}</p>
                </>}
            </>}
        </div>}
        {view && <button type="button" className="btn-ghost" onClick={() => setView(null)}>{T("Ganzen Stapler zeigen")}</button>}
        {all && <div className={`mission ${found === bads ? "done" : ""}`}>{T("Ergebnis: {f} von {b} Mängeln erkannt.", { f: found, b: bads })} {x(data.done as LText)}</div>}
        {x(data.src as LText) && <p className="src">{t("source")}: {x(data.src as LText)}</p>}
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

/** Odczyt testu: skok pedału hamulca albo luz kierownicy w szerokości palców. */
function Gauge({ g, T }: { g: NonNullable<Pt["gauge"]>; T: ReturnType<typeof useSimText> }) {
    if (g.kind === "pedal") {
        return <div className="gauge3">
            <span>{T("Pedalweg")}</span>
            <svg viewBox="0 0 300 44" aria-hidden="true">
                <rect x="6" y="16" width="288" height="12" rx="6" fill="#e7e3dc" />
                <rect x="6" y="16" width={288 * g.at} height="12" rx="6" fill="#2b3440" />
                <line x1={6 + 288 / 3} y1="8" x2={6 + 288 / 3} y2="36" stroke="#16a34a" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx={6 + 288 * g.at} cy="22" r="9" fill="#f97706" stroke="#fff" strokeWidth="3" />
            </svg>
            <small>{T("Spürbarer Widerstand bei {p} des Weges", { p: g.at <= 0.4 ? "⅓" : g.at <= 0.6 ? "½" : "⅔" })}</small>
        </div>;
    }
    const W = 26, total = Math.max(g.fingers, g.max) + 1;
    return <div className="gauge3">
        <span>{T("Lenkungsspiel")}</span>
        <svg viewBox={`0 0 ${total * W + 12} 46`} aria-hidden="true">
            {Array.from({ length: total }, (_, i) => <rect key={i} x={6 + i * W} y="10" width={W - 4} height="26" rx="10"
                fill={i < g.fingers ? (i < g.max ? "#2b3440" : "#dc2626") : "#e7e3dc"} />)}
            <line x1={6 + g.max * W - 2} y1="4" x2={6 + g.max * W - 2} y2="42" stroke="#16a34a" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
        <small>{T("Spiel am Lenkrad: {n} Finger breit", { n: g.fingers })}</small>
    </div>;
}

/* ───────── plakietka kontrolna ───────── */
interface Plate { m: number; y: number }
interface PCase { id: string; plate: Plate | null; note: LText; ok: boolean; why: LText }
const YEAR_COL = ["#2f6db5", "#c2410c", "#178a45", "#8a3ab9", "#b58a00"];
export function PlaketteSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState } = usePlayer();
    const T = useSimText(data);
    const cases = (data.cases ?? []) as PCase[];
    const [st, setSt] = useStepState<Record<string, boolean>>({});
    const done = cases.every(c => st[c.id] !== undefined);
    const right = cases.filter(c => st[c.id] === c.ok).length;
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        {x(data.lead as LText) && <p className="small">{x(data.lead as LText)}</p>}
        <div className="today3"><span>{T("Heute")}</span><b>{x(data.today as LText)}</b></div>
        <div className="plk-list">{cases.map((c, i) => {
            const a = st[c.id], ans = a !== undefined, ok = a === c.ok;
            return <div key={c.id} className={`plk ${ans ? (ok ? "ok" : "no") : ""}`}>
                <div className="plk-top">
                    {c.plate ? <PlateSvg p={c.plate} label={T("nächste Prüfung")} /> : <div className="plk-none">{T("keine Plakette")}</div>}
                    <div><span className="plk-n">{T("Stapler {n}", { n: i + 1 })}</span><p>{x(c.note)}</p></div>
                </div>
                {!ans ? <div className="nav2">
                    <button type="button" className="btn btn-o" onClick={() => setSt(s => ({ ...s, [c.id]: true }))}>{T("Losfahren")}</button>
                    <button type="button" className="btn btn-o" onClick={() => setSt(s => ({ ...s, [c.id]: false }))}>{T("Nicht fahren")}</button>
                </div> : <div className="plk-fb" aria-live="polite"><b>{ok ? t("right") : t("notQuite")} · {T(c.ok ? "Losfahren" : "Nicht fahren")}</b><span>{x(c.why)}</span></div>}
            </div>;
        })}</div>
        {done && <div className={`mission ${right === cases.length ? "done" : ""}`}>{T("{r} von {n} richtig entschieden.", { r: right, n: cases.length })}</div>}
        {x(data.src as LText) && <p className="src">{t("source")}: {x(data.src as LText)}</p>}
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

/** Okrągła plakietka: rok w środku, miesiące na obwodzie, miesiąc następnej kontroli u góry przy znaczniku. */
function PlateSvg({ p, label }: { p: Plate; label: string }) {
    const col = YEAR_COL[p.y % YEAR_COL.length];
    return <svg className="plk-svg" viewBox="0 0 120 120" role="img" aria-label={`${label}: ${String(p.m).padStart(2, "0")}/${p.y}`}>
        <circle cx="60" cy="60" r="56" fill={col} />
        <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="1" />
        {Array.from({ length: 12 }, (_, i) => {
            const m = i + 1, a = ((m - p.m) * 30 - 90) * Math.PI / 180, r = 45;
            const top = m === p.m;
            return <g key={m}>
                {top && <circle cx={60 + Math.cos(a) * r} cy={60 + Math.sin(a) * r} r="9" fill="#fff" />}
                <text x={60 + Math.cos(a) * r} y={60 + Math.sin(a) * r + 3.8} textAnchor="middle" fontSize={top ? 11 : 9} fontWeight={top ? 800 : 600} fill={top ? col : "rgba(255,255,255,.9)"}>{m}</text>
            </g>;
        })}
        <path d="M60 1 L55 -6 L65 -6 Z" fill="#212121" transform="translate(0 8)" />
        <circle cx="60" cy="60" r="31" fill="#fff" />
        {label.split(" ").map((w, i, a) => <text key={i} x="60" y={(a.length > 1 ? 47 : 52) + i * 9} textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#2b3440">{w}</text>)}
        <text x="60" y="78" textAnchor="middle" fontSize="19" fontWeight="800" fill={col}>{p.y}</text>
    </svg>;
}
