/** Moduł 7 „Umgang mit Last”: podjęcie palety i pozycja do jazdy (3D) oraz odkładanie na regał według tabliczki obciążenia. */
import { lazy, useEffect, useState } from "react";
import { LText, SimData } from "../types";
import { Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from "../steps";
import { useSimText } from "./shared";
import { S3, use3dUi } from "./lazy3d";
import type { PickOutcome, RackSlot } from "./three/scenesLast";
import "./tech.css";

const loadL = () => import("./three/scenesLast");
const PickupScene = lazy(() => loadL().then(m => ({ default: m.PickupScene })));
const RackScene = lazy(() => loadL().then(m => ({ default: m.RackScene })));

/* ───────── podjęcie i jazda ───────── */
type Res = { title: LText; text: LText };
export function PickupSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState } = usePlayer();
    const T = useSimText(data), ui = use3dUi();
    const res = (data.outcomes ?? {}) as Record<PickOutcome, Res>;
    const [st, setSt] = useStepState<{ insert: "half" | "full" | null; clear: number; tilt: number; run: number; out: PickOutcome | null; solved: boolean }>({ insert: null, clear: 0, tilt: 0, run: 0, out: null, solved: false });
    const [shown, setShown] = useState<PickOutcome | null>(null);
    useEffect(() => {
        if (!st.out || !st.run) { setShown(null); return; }
        const id = setTimeout(() => setShown(st.out), st.out === "low" ? 3200 : 4300);
        return () => clearTimeout(id);
    }, [st.run, st.out]);
    const go = () => {
        const out: PickOutcome = st.insert === "half" ? "drop" : st.clear < 100 ? "low" : st.clear > 300 ? "high" : st.tilt >= 0 ? "slide" : "ok";
        setSt(s => ({ ...s, run: s.run + 1, out, solved: s.solved || out === "ok" }));
    };
    const reset = () => setSt(s => ({ ...s, run: 0, out: null }));
    const running = st.run > 0;
    const tiltTxt = st.tilt < 0 ? T("{n}° nach hinten", { n: -st.tilt }) : st.tilt > 0 ? T("{n}° nach vorn", { n: st.tilt }) : T("senkrecht");
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        {x(data.lead as LText) && <p className="small">{x(data.lead as LText)}</p>}
        <S3 cls="s3d-pick" fallback={ui.loading}>
            <PickupScene insert={st.insert} clear={st.clear} tilt={st.tilt} run={st.run} outcome={st.out}
                tags={{ clear: T("Bodenfreiheit {v} mm", { v: st.clear }), bump: T("Schwelle") }} label={x(data.title)} hint={ui.hint} resetLabel={ui.resetLabel} />
        </S3>
        <div className="pk-step">
            <span className="pk-h">{T("Gabeln unter die Palette fahren")}</span>
            <div className="spots">
                {(["half", "full"] as const).map(k => <button key={k} type="button" aria-pressed={st.insert === k} disabled={running} onClick={() => setSt(s => ({ ...s, insert: k }))}>
                    {T(k === "half" ? "Halb unterfahren" : "Bis zum Gabelrücken")}
                </button>)}
            </div>
        </div>
        {st.insert && <div className="pk-step">
            <span className="pk-h">{T("Fahrstellung einstellen")}</span>
            <label className="pk-sl"><span>{T("Bodenfreiheit")}<b>{st.clear} mm</b></span>
                <input type="range" min={0} max={600} step={10} value={st.clear} disabled={running} onChange={e => setSt(s => ({ ...s, clear: +e.target.value }))} /></label>
            <label className="pk-sl"><span>{T("Hubmast")}<b>{tiltTxt}</b></span>
                <input type="range" min={-6} max={3} step={1} value={st.tilt} disabled={running} onChange={e => setSt(s => ({ ...s, tilt: +e.target.value }))} /></label>
            {!running ? <button type="button" className="btn btn-d pk-go" onClick={go}>{T("Losfahren und bremsen")}</button>
                : <button type="button" className="btn btn-o pk-go" onClick={reset} disabled={!shown}>{T("Nochmal einstellen")}</button>}
        </div>}
        {shown && res[shown] && <div className={`part verdict ${shown === "ok" ? "ok" : "no"}`} aria-live="polite"><b>{x(res[shown].title)}</b><p>{x(res[shown].text)}</p></div>}
        {st.solved && shown === "ok" && x(data.done as LText) && <div className="mission done">{x(data.done as LText)}</div>}
        {x(data.src as LText) && <p className="src">{t("source")}: {x(data.src as LText)}</p>}
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

/* ───────── regał i tabliczka obciążenia ───────── */
interface Slot { id: string; level: number; side: -1 | 1; kg?: number; label?: LText }
export function RackSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState } = usePlayer();
    const T = useSimText(data), ui = use3dUi();
    const slots = (data.slots ?? []) as Slot[];
    const fach = data.fach as number, feld = data.feld as number, carry = data.carry as number;
    const [st, setSt] = useStepState<{ chosen: string | null; tried: Record<string, boolean> }>({ chosen: null, tried: {} });
    const [shown, setShown] = useState<string | null>(null);
    useEffect(() => { setShown(null); if (!st.chosen) return; const id = setTimeout(() => setShown(st.chosen), 6200); return () => clearTimeout(id); }, [st.chosen]);
    const free = slots.filter(s => !s.kg);
    const lvSum = (lv: number) => slots.filter(s => s.level === lv && s.kg).reduce((a, s) => a + (s.kg ?? 0), 0);
    const fieldSum = slots.filter(s => s.level > 0).reduce((a, s) => a + (s.kg ?? 0), 0);
    const judge = (s: Slot) => s.level > 0 && (lvSum(s.level) + carry > fach || fieldSum + carry > feld);
    const cur = slots.find(s => s.id === st.chosen);
    const over = !!cur && judge(cur);
    const verdict = Object.fromEntries(free.filter(s => st.tried[s.id] && s.id !== st.chosen || (s.id === st.chosen && shown)).map(s => [s.id, judge(s) ? "no" : "ok"]));
    const busy = !!st.chosen && !shown;
    const scene: RackSlot[] = slots.map(s => ({ id: s.id, level: s.level, side: s.side, kg: s.kg, label: x(s.label as LText) }));
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        {x(data.lead as LText) && <p className="small">{x(data.lead as LText)}</p>}
        <S3 cls="s3d-rack" fallback={ui.loading}>
            <RackScene slots={scene} chosen={st.chosen} overload={over} plate={[T("Fachlast {n} kg", { n: fach }), T("Feldlast {n} kg", { n: feld })]}
                carryKg={`${carry} kg`} label={x(data.title)} hint={ui.hint} resetLabel={ui.resetLabel} />
        </S3>
        <div className="spots" role="group" aria-label={T("Platz wählen")}>{free.map(s => (
            <button key={s.id} type="button" className={verdict[s.id] ?? ""} aria-pressed={st.chosen === s.id} disabled={busy} onClick={() => setSt(v => ({ chosen: s.id, tried: { ...v.tried, [s.id]: true } }))}>{x(s.label as LText)}</button>
        ))}</div>
        {cur && shown && <div className={`part verdict ${over ? "no" : "ok"}`} key={cur.id} aria-live="polite">
            <b>{T(over ? "Zu schwer für diese Ebene" : "Passt")}</b>
            <div className="cmp">
                <div><span>{T("Ebene {l}", { l: cur.level })}</span><b>{lvSum(cur.level) + carry} kg</b><span>{T("erlaubt {n} kg", { n: fach })}</span></div>
                <div><span>{T("Ganzes Feld")}</span><b>{fieldSum + carry} kg</b><span>{T("erlaubt {n} kg", { n: feld })}</span></div>
            </div>
            <p>{T(over ? "Die Fachlast gilt für die ganze Ebene. Mit der neuen Palette wäre sie überschritten, der Träger biegt sich durch." : "Fachlast und Feldlast bleiben eingehalten.")}</p>
        </div>}
        {x(data.src as LText) && <p className="src">{t("source")}: {x(data.src as LText)}</p>}
        <Nav label={last ? finishLabel : undefined} />
    </>;
}
