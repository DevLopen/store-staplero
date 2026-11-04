import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CurveRun, CurveView } from "./three/CurveScene3D";
import { LText, SimData } from "../types";
import { Actions, Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from "../steps";
import { useNum, useSimText } from "./shared";
import { CogScene, DiagramScene, S3, use3dUi } from "./lazy3d";
import { Hold } from "./sim2";
import { cog3, diagramSVG, qAllowed, triangleSVG, triModel } from "./stability";
import { R_M, Radius } from "./curve";
import "./tech.css";

const Tick = () => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const Up = () => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>;
const Down = () => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>;
const TiltF = () => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 20L14 5M14 5l-5 3M14 5l1 5.5" /></svg>;
const TiltB = () => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20L10 5M10 5l5 3M10 5L9 10.5" /></svg>;
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function Tasks({ items, done }: { items: { k: string; t: string }[]; done: Record<string, boolean> }) {
    return <div className="tasks">{items.map(k => <div key={k.k} className={done[k.k] ? "on" : ""}><span className="bx">{done[k.k] && <Tick />}</span>{k.t}</div>)}</div>;
}

/* ───────── wykres udźwigu: od której strony podjąć skrzynię ───────── */
interface Crate { name: LText; l: number; w: number; kg: number }
/** Ikona widoku z góry: wózek na dole, widły w górę, skrzynia stoi do wózka dłuższym albo krótszym bokiem. */
const SideIc = ({ long }: { long: boolean }) => {
    const bw = long ? 52 : 32, bh = long ? 32 : 52, x = 40 - bw / 2, y = 62 - bh;
    return <svg viewBox="0 0 80 96" aria-hidden="true" className="side-ic">
        <rect x={x} y={y} width={bw} height={bh} rx="3" className="bx2" />
        <path d={`M${x} ${y + bh + 0.5}H${x + bw}`} className="face" />
        <path d="M31 84V40M49 84V40" className="fk" />
        <rect x="18" y="80" width="44" height="12" rx="3" className="tr" />
        <circle cx="40" cy={y + bh / 2} r="3.5" className="cg" />
    </svg>;
};
export function DiagramSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState } = usePlayer();
    const T = useSimText(data), num = useNum(), ui = use3dUi();
    const crates = (data.crates ?? []) as Crate[];
    const [st, setSt] = useStepState<{ i: number; side: "long" | "short"; res: boolean[]; run: number; tried: Record<string, boolean> }>({ i: 0, side: "short", res: [], run: 0, tried: {} });
    const [busy, setBusy] = useState(false);
    const timer = useRef<number>();
    useEffect(() => () => window.clearTimeout(timer.current), []);
    const done = st.res.length >= crates.length;
    const cr = crates[Math.min(st.i, crates.length - 1)];
    // od dłuższego boku: widły wchodzą wzdłuż krótszego wymiaru
    const L = Math.max(cr.l, cr.w), S = Math.min(cr.l, cr.w);
    const depth = st.side === "long" ? S : L, across = st.side === "long" ? L : S;
    const c = depth / 2, q = Math.round(qAllowed(c) / 10) * 10, ok = cr.kg <= qAllowed(c);
    const shown = st.run > 0 && !busy;
    const pick = (side: "long" | "short") => { if (!busy) setSt(s => ({ ...s, side, run: 0 })); };
    const lift = () => {
        if (busy) return;
        setBusy(true);
        setSt(s => ({ ...s, run: Date.now(), tried: { ...s.tried, [s.side]: true } }));
        timer.current = window.setTimeout(() => setBusy(false), ok ? 1600 : 1300);
    };
    const next = () => setSt(s => ({ i: s.i + 1, side: "short", res: [...s.res, true], run: 0, tried: {} }));
    if (done) return <>
        <h2 className="q">{x(data.title)}</h2>
        <div className="mission done">{T("Alle Kisten richtig aufgenommen.")}</div>
        <p className="txt">{x(data.done as LText)}</p>
        <Nav label={last ? finishLabel : undefined} />
    </>;
    const chart = diagramSVG(c, cr.kg, { load: T("Last (kg)"), dist: T("Lastschwerpunktabstand (mm)"), safe: T("sicherer Bereich"), over: T("überlastet") }, num);
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        <div className="crate-id"><b>{x(cr.name)}</b><span>{num(cr.l)} × {num(cr.w)} mm</span><span className="kg">{num(cr.kg)} kg</span></div>
        <div className="sidepick" role="group" aria-label={T("Aufnahme wählen")}>
            {(["long", "short"] as const).map(sd => <button key={sd} type="button" aria-pressed={st.side === sd} disabled={busy} onClick={() => pick(sd)}>
                <SideIc long={sd === "long"} />
                <span><b>{T(sd === "long" ? "Längsseite zum Stapler" : "Stirnseite zum Stapler")}</b><small>{T("{d} mm auf den Gabeln", { d: num(sd === "long" ? S : L) })}</small></span>
            </button>)}
        </div>
        <S3 cls="s3d-diag" fallback={ui.loading}>
            <DiagramScene depth={depth} across={across} ok={ok} reveal={st.run > 0} run={st.run}
                labels={{ c: T("Lastschwerpunkt {c} mm", { c: num(c) }), cog: T("Schwerpunkt"), d: `${num(depth)} mm`, a: `${num(across)} mm` }}
                label={T("Kiste auf den Gabeln, Lastschwerpunkt {c} mm", { c: num(c) })} hint={ui.hint} resetLabel={ui.resetLabel} />
        </S3>
        <p className="small">{T("Der Lastschwerpunktabstand wird vom Gabelrücken bis zur Mitte der Last gemessen. Je weiter vorn, desto weniger darf der Stapler heben.")}</p>
        {shown && <div className={`part verdict ${ok ? "ok" : "no"}`} aria-live="polite">
            <b>{T(ok ? "Darf aufgenommen werden" : "Überlastet")}</b>
            <div className="cmp">
                <div><span>{T("Erlaubt bei {c} mm", { c: num(c) })}</span><b>{num(q)} kg</b></div>
                <div><span>{T("Gewicht der Kiste")}</span><b>{num(cr.kg)} kg</b></div>
            </div>
            <p>{T(ok ? "Der Punkt liegt unter der Linie. So nimmst du die Kiste sicher auf." : "Der Punkt liegt über der Linie. Dreh die Kiste: von der anderen Seite liegt der Schwerpunkt näher am Gabelrücken.")}</p>
            <details className="dg-more"><summary>{T("Im Lastschwerpunktdiagramm ansehen")}</summary>
                <div className="stage" dangerouslySetInnerHTML={{ __html: chart }} />
                <p className="small">{T("Beispieldiagramm: Stapler mit 1.500 kg Nenntragfähigkeit bei 500 mm")}</p>
            </details>
        </div>}
        <Actions>{shown && ok
            ? <button className="btn btn-p" type="button" onClick={next}>{t(st.i < crates.length - 1 ? "nextQ" : "results")}</button>
            : <button className="btn btn-d" type="button" disabled={busy} onClick={lift}>{T("Anheben")}</button>}</Actions>
    </>;
}

/* ───────── wspólny środek ciężkości: podnoszenie, pochylanie, hamowanie ───────── */
export function CogSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data), num = useNum();
    const [st, setSt] = useStepState<{ lift: number; tilt: number; done: Record<string, boolean> }>({ lift: 150, tilt: -4, done: {} });
    const [braking, setBraking] = useState(false);
    const ref = useRef(st); ref.current = st;
    const timer = useRef<number>();
    useEffect(() => () => window.clearTimeout(timer.current), []);
    const ui = use3dUi();
    const cs = cog3(st.lift, st.tilt, braking);
    const tipped = braking && cs.tips;
    const set = (patch: Partial<typeof st>) => setSt(s => ({ ...s, ...patch }));
    const moveLift = (d: number) => { const s = ref.current, n = Math.max(0, Math.min(3000, s.lift + d)); set({ lift: n }); return d > 0 ? n < 3000 : n > 0; };
    const moveTilt = (d: number) => { const s = ref.current, n = Math.max(-8, Math.min(5, s.tilt + d)); set({ tilt: Math.round(n * 10) / 10 }); return d > 0 ? n < 5 : n > -8; };
    const brake = () => {
        setBraking(true);
        const tipsNow = cog3(ref.current.lift, ref.current.tilt, true).tips;
        setSt(s => ({ ...s, done: { ...s.done, safe: s.done.safe || (!tipsNow && s.lift <= 300), tip: s.done.tip || tipsNow } }));
        timer.current = window.setTimeout(() => setBraking(false), tipsNow ? 2200 : 1300);
    };
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        <S3 cls="s3d-cog" fallback={ui.loading}>
            <CogScene lift={st.lift} tilt={st.tilt} braking={braking} labels={{ truck: T("Stapler"), load: T("Last"), total: T("Gesamtschwerpunkt"), edge: T("Kippkante") }}
                label={T("Gabelstapler mit Schwerpunkten")} hint={ui.hint} resetLabel={ui.resetLabel} />
        </S3>
        <div className={`phase ${tipped ? "hit" : braking ? "free" : ""}`} aria-live="polite"><i />{
            tipped ? T("Der Gesamtschwerpunkt wandert über die Kippkante: Der Stapler kippt nach vorn.")
                : braking ? T("Beim Bremsen drückt die Masse nach vorn. Es bleibt noch Abstand zur Kippkante.")
                    : T("Gesamtschwerpunkt {h} mm hoch, {m} mm vor der Kippkante", { h: num(Math.round(cs.height / 10) * 10), m: num(Math.max(0, Math.round(cs.margin / 10) * 10)) })
        }<span className="ex">{T("Modell")}</span></div>
        <div className="ctl">
            <div className="rocker" role="group" aria-label={T("Heben")}>
                <Hold label={T("Heben")} icon={<Up />} disabled={braking || st.lift >= 3000} onMove={dt => moveLift(dt * 900)} onStep={() => moveLift(250)} />
                <Hold label={T("Senken")} icon={<Down />} disabled={braking || st.lift <= 0} onMove={dt => moveLift(-dt * 1100)} onStep={() => moveLift(-250)} />
            </div>
            <div className="rocker" role="group" aria-label={T("Neigen")}>
                <Hold label={T("Vor")} icon={<TiltF />} disabled={braking || st.tilt >= 5} onMove={dt => moveTilt(dt * 6)} onStep={() => moveTilt(1)} />
                <Hold label={T("Zurück")} icon={<TiltB />} disabled={braking || st.tilt <= -8} onMove={dt => moveTilt(-dt * 6)} onStep={() => moveTilt(-1)} />
            </div>
        </div>
        <Tasks items={[{ k: "safe", t: T("Bremse in Fahrstellung: Last unten, Mast zurück") }, { k: "tip", t: T("Bremse mit hoch angehobener Last") }]} done={st.done} />
        <Actions><button className="btn btn-d" type="button" disabled={braking} onClick={brake}>{T("Stark bremsen")}</button></Actions>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

/* ───────── trójkąt stateczności i jazda po łuku ───────── */
export function TriangleSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data), num = useNum();
    const [st, setSt] = useStepState<{ loaded: boolean; raised: boolean; kmh: number; r: number; done: Record<string, boolean> }>({ loaded: false, raised: false, kmh: 6, r: 5, done: {} });
    const [shown, setShown] = useState(0);
    const [busy, setBusy] = useState(false);
    const raf = useRef(0);
    useEffect(() => () => cancelAnimationFrame(raf.current), []);
    const m = triModel(st.loaded, st.raised, st.kmh, st.r);
    useEffect(() => { cancelAnimationFrame(raf.current); setShown(0); setBusy(false); }, [st.loaded, st.raised, st.kmh, st.r]);
    const drive = () => {
        const target = Math.min(m.lateral, m.d * 1.6);
        const finish = () => {
            setBusy(false);
            setSt(s => ({ ...s, done: { ...s.done, emptyTip: s.done.emptyTip || (!s.loaded && m.tips), safe: s.done.safe || (!m.tips && s.kmh >= 6), raised: s.done.raised || (s.loaded && s.raised && m.tips) } }));
        };
        if (reduced()) { setShown(target); finish(); return; }
        setBusy(true);
        let t0 = 0;
        const loop = (ts: number) => {
            if (!t0) t0 = ts;
            const k = Math.min(1, (ts - t0) / 900), e = 1 - Math.pow(1 - k, 3);
            setShown(target * e);
            if (k < 1) raf.current = requestAnimationFrame(loop); else finish();
        };
        raf.current = requestAnimationFrame(loop);
    };
    const tipped = !busy && shown > 0 && m.tips;
    const html = triangleSVG(m, shown, { pivot: T("Pendelachse"), edge: T("Kippkante"), cf: T("Fliehkraft") }, tipped, T("Draufsicht mit Kippdreieck"));
    const pct = Math.min(160, m.ratio * 100);
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        <div className="seg" role="group" aria-label={T("Beladung")}>
            <button type="button" aria-pressed={!st.loaded} onClick={() => setSt(s => ({ ...s, loaded: false, raised: false }))}>{T("Leer")}</button>
            <button type="button" aria-pressed={st.loaded && !st.raised} onClick={() => setSt(s => ({ ...s, loaded: true, raised: false }))}>{T("Last unten")}</button>
            <button type="button" aria-pressed={st.loaded && st.raised} onClick={() => setSt(s => ({ ...s, loaded: true, raised: true }))}>{T("Last oben")}</button>
        </div>
        <div className="stage" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="sliders">
            <label className="slider2"><span>{T("Geschwindigkeit")}<b>{num(st.kmh)} km/h</b></span><input type="range" min={2} max={16} step={1} value={st.kmh} disabled={busy} onChange={e => setSt(s => ({ ...s, kmh: Number(e.target.value) }))} /></label>
            <label className="slider2"><span>{T("Kurvenradius")}<b>{num(st.r)} m</b></span><input type="range" min={2} max={10} step={0.5} value={st.r} disabled={busy} onChange={e => setSt(s => ({ ...s, r: Number(e.target.value) }))} /></label>
        </div>
        <div className="mom" aria-label={T("Kippmoment im Vergleich zum Standmoment")}>
            <div className="mom-l"><span>{T("Kippmoment: {p} % des Standmoments", { p: num(Math.round(m.ratio * 100)) })}</span></div>
            <div className="mom-bar"><i style={{ width: `${pct / 1.6}%` }} className={m.tips ? "no" : pct > 75 ? "warn" : ""} /><u style={{ left: `${100 / 1.6}%` }} /></div>
        </div>
        <div className={`phase ${tipped ? "hit" : ""}`} aria-live="polite"><i />{
            tipped ? T("Der Schwerpunkt liegt außerhalb des Dreiecks: Der Stapler kippt zur Seite.")
                : shown > 0 && !busy ? T("Der Schwerpunkt bleibt im Dreieck. Der Stapler bleibt stehen.") : T("Stell Tempo und Radius ein und fahr die Kurve.")
        }<span className="ex">{T("Modell")}</span></div>
        <Tasks items={[{ k: "emptyTip", t: T("Bring den leeren Stapler zum Kippen") }, { k: "safe", t: T("Fahr eine Kurve mit mindestens 6 km/h, ohne zu kippen") }, { k: "raised", t: T("Probier es mit angehobener Last") }]} done={st.done} />
        <Actions><button className="btn btn-d" type="button" disabled={busy} onClick={drive}>{T("Kurve fahren")}</button></Actions>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

/* ───────── jazda po łuku: widok z góry + od tyłu ───────── */
type LoadMode = "empty" | "low" | "high";
interface CurveCfg { load: LoadMode; rad: Radius; kmh: number }
const SPEEDS = [6, 9, 12, 15];
const PRESETS: { k: string; cfg: CurveCfg }[] = [
    { k: "p1", cfg: { load: "empty", rad: "tight", kmh: 12 } },
    { k: "p2", cfg: { load: "empty", rad: "tight", kmh: 6 } },
    { k: "p3", cfg: { load: "empty", rad: "wide", kmh: 12 } },
    { k: "p4", cfg: { load: "high", rad: "tight", kmh: 12 } },
];
const same = (a: CurveCfg, b: CurveCfg) => a.load === b.load && a.rad === b.rad && a.kmh === b.kmh;
const CurveScene3D = lazy(() => import("./three/CurveScene3D"));
export function CurveSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data), num = useNum();
    const [st, setSt] = useStepState<{ cfg: CurveCfg; done: Record<string, boolean>; result: { tipped: boolean; pct: number; p: number } | null }>({ cfg: { load: "empty", rad: "tight", kmh: 12 }, done: {}, result: null });
    const [run, setRun] = useState<CurveRun>(null);
    const [busy, setBusy] = useState(false);
    const [view, setView] = useState<CurveView>("chase");
    const barRef = useRef<HTMLElement>(null), pctRef = useRef<HTMLSpanElement>(null);
    const cfg = st.cfg;
    const m = triModel(cfg.load !== "empty", cfg.load === "high", cfg.kmh, R_M[cfg.rad]);
    const setLive = useCallback((r: number) => {
        if (barRef.current) { barRef.current.style.width = `${Math.min(100, r / 1.6 * 100)}%`; barRef.current.className = r >= 1 ? "no" : r > 0.75 ? "warn" : ""; }
        if (pctRef.current) pctRef.current.textContent = `${Math.round(Math.min(r, 9.99) * 100)} %`;
    }, []);
    const setCfg = (patch: Partial<CurveCfg>) => { if (busy) return; setRun(null); setLive(0); setSt(s => ({ ...s, cfg: { ...s.cfg, ...patch }, result: null })); };
    const go = () => {
        if (busy) return;
        setSt(s => ({ ...s, result: null }));
        setBusy(true);
        setRun({ id: Date.now(), kmh: cfg.kmh, radius: R_M[cfg.rad], load: cfg.load, ratio: m.ratio, tips: m.tips });
    };
    const onDone = useCallback((tipped: boolean, sPos: number) => {
        setBusy(false);
        setSt(s => {
            const done = { ...s.done };
            for (const pr of PRESETS) if (same(pr.cfg, s.cfg)) done[pr.k] = true;
            return { ...s, done, result: { tipped, pct: Math.round(triModel(s.cfg.load !== "empty", s.cfg.load === "high", s.cfg.kmh, R_M[s.cfg.rad]).ratio * 100), p: tipped ? sPos : 0 } };
        });
        setLive(tipped ? m.ratio : 0);
    }, [m.ratio, setLive]);
    const restTipped = useMemo(() => (!run && st.result?.tipped ? { s: st.result.p } : null), [run, st.result]);
    const loadLabel = (l: LoadMode) => T({ empty: "Leer", low: "Last unten", high: "Last oben" }[l]);
    const label = (p: CurveCfg) => `${loadLabel(p.load)}, ${T(p.rad === "tight" ? "enge Kurve" : "weite Kurve")}, ${num(p.kmh)} km/h`;
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        <p className="small">{T("Wähle Ladung, Kurve und Tempo und tippe auf „Losfahren“. Am Boden siehst du das Standdreieck und den Schwerpunkt.")}</p>
        <div className="c3d">
            <Suspense fallback={<div className="c3d-load">{T("3D-Szene wird geladen")}</div>}>
                <CurveScene3D radius={R_M[cfg.rad]} load={cfg.load} run={run} view={view} restTipped={restTipped} onLive={setLive} onDone={onDone} />
            </Suspense>
            <div className="c3d-hud">
                <span className="c3d-tag"><b>{num(cfg.kmh)} km/h</b>r = {num(R_M[cfg.rad])} m</span>
                <div className="c3d-cam" role="group" aria-label={T("Kamera")}>
                    <button type="button" aria-pressed={view === "chase"} onClick={() => setView("chase")}>{T("Hinterher")}</button>
                    <button type="button" aria-pressed={view === "top"} onClick={() => setView("top")}>{T("Von oben")}</button>
                </div>
            </div>
            <div className="c3d-meter" aria-hidden="true">
                <span>{T("Kippgefahr")}</span>
                <div><i ref={barRef} /><u /></div>
                <span ref={pctRef} className="v">0 %</span>
            </div>
            {st.result && !busy && <div className={`c3d-verdict ${st.result.tipped ? "no" : "ok"}`} aria-live="polite">{T(st.result.tipped ? "Umgekippt" : "Sicher durch die Kurve")}</div>}
        </div>
        <div className="cfg">
            <span>{T("Ladung")}</span>
            <div className="seg" role="group" aria-label={T("Ladung")}>{(["empty", "low", "high"] as LoadMode[]).map(l => <button key={l} type="button" aria-pressed={cfg.load === l} disabled={busy} onClick={() => setCfg({ load: l })}>{loadLabel(l)}</button>)}</div>
            <span>{T("Kurve")}</span>
            <div className="seg" role="group" aria-label={T("Kurve")}>{(["tight", "wide"] as Radius[]).map(r => <button key={r} type="button" aria-pressed={cfg.rad === r} disabled={busy} onClick={() => setCfg({ rad: r })}>{T(r === "tight" ? "eng" : "weit")} · {num(R_M[r])} m</button>)}</div>
            <span>{T("Tempo")}</span>
            <div className="seg" role="group" aria-label={T("Tempo")}>{SPEEDS.map(v => <button key={v} type="button" aria-pressed={cfg.kmh === v} disabled={busy} onClick={() => setCfg({ kmh: v })}>{num(v)} km/h</button>)}</div>
        </div>
        {st.result && !busy && <div className={`part verdict ${st.result.tipped ? "no" : "ok"}`}>
            <b>{T(st.result.tipped ? "Umgekippt" : "Sicher durch die Kurve")}</b>
            <p>{st.result.tipped ? T("Die Fliehkraft war stärker als die Standsicherheit ({p} %). Halbes Tempo hätte nur ein Viertel der Fliehkraft bedeutet.", { p: num(st.result.pct) }) : T("Kippgefahr {p} %. Der Schwerpunkt blieb innerhalb der Kippkante.", { p: num(st.result.pct) })}</p>
        </div>}
        <div className="presets2">
            <span>{T("Probier diese Fahrten:")}</span>
            {PRESETS.map(pr => <button key={pr.k} type="button" disabled={busy} className={`${st.done[pr.k] ? "on" : ""} ${same(pr.cfg, cfg) ? "cur" : ""}`} onClick={() => setCfg(pr.cfg)}><span className="bx">{st.done[pr.k] && <Tick />}</span>{label(pr.cfg)}</button>)}
        </div>
        <Actions><button className="btn btn-d" type="button" disabled={busy} onClick={go}>{T("Losfahren")}</button></Actions>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}
