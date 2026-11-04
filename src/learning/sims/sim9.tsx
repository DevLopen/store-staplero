/** Moduł 8 „Sondereinsätze”: jazda z przyczepą (punkt sprzęgu i dopuszczalny uciąg) w 3D. */
import { lazy, useEffect, useState } from "react";
import { LText, SimData } from "../types";
import { Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from "../steps";
import { useSimText } from "./shared";
import { S3, use3dUi } from "./lazy3d";
import type { TowHitch, TowOutcome } from "./three/scenesSonder";
import "./tech.css";

const TowScene = lazy(() => import("./three/scenesSonder").then(m => ({ default: m.TowScene })));
type Res = { title: LText; text: LText };

export function TowSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState } = usePlayer();
    const T = useSimText(data), ui = use3dUi();
    const res = (data.outcomes ?? {}) as Record<TowOutcome, Res>;
    const loads = (data.loads ?? []) as { id: string; kg: number; label: LText }[];
    const maxKg = data.maxKg as number;
    const [st, setSt] = useStepState<{ hitch: TowHitch | null; load: string | null; run: number; out: TowOutcome | null; solved: boolean }>({ hitch: null, load: null, run: 0, out: null, solved: false });
    const [shown, setShown] = useState<TowOutcome | null>(null);
    useEffect(() => {
        if (!st.out || !st.run) { setShown(null); return; }
        const id = setTimeout(() => setShown(st.out), st.out === "wrong" ? 1800 : 5200);
        return () => clearTimeout(id);
    }, [st.run, st.out]);
    const load = loads.find(l => l.id === st.load);
    const go = () => {
        const out: TowOutcome = st.hitch !== "hitch" ? "wrong" : (load?.kg ?? 0) > maxKg ? "over" : "ok";
        setSt(s => ({ ...s, run: s.run + 1, out, solved: s.solved || out === "ok" }));
    };
    const reset = () => setSt(s => ({ ...s, run: 0, out: null, hitch: s.out === "wrong" ? null : s.hitch }));
    const running = st.run > 0;
    const labels = { hitch: T("Anhängekupplung"), guard: T("Fahrerschutzdach"), axle: T("Lenkachse") };
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        {x(data.lead as LText) && <p className="small">{x(data.lead as LText)}</p>}
        <S3 cls="s3d-pick" fallback={ui.loading}>
            <TowScene hitch={st.hitch} heavy={(load?.kg ?? 0) > maxKg} run={st.run} outcome={st.out} labels={labels}
                plate={T("Anhängelast max. {n} kg", { n: maxKg })} label={x(data.title)} hint={ui.hint} resetLabel={ui.resetLabel}
                onPick={h => !running && setSt(s => ({ ...s, hitch: h }))} />
        </S3>
        <div className="pk-step">
            <span className="pk-h">{T("Wo kuppelst du an?")}</span>
            <div className="spots">{(Object.keys(labels) as TowHitch[]).map(h => <button key={h} type="button" aria-pressed={st.hitch === h} disabled={running} onClick={() => setSt(s => ({ ...s, hitch: h }))}>{labels[h]}</button>)}</div>
        </div>
        {st.hitch && <div className="pk-step">
            <span className="pk-h">{T("Was kommt auf den Anhänger?")}</span>
            <div className="spots">{loads.map(l => <button key={l.id} type="button" aria-pressed={st.load === l.id} disabled={running} onClick={() => setSt(s => ({ ...s, load: l.id }))}>{x(l.label)}<small className="sp-sub">{l.kg} kg</small></button>)}</div>
            {!running ? <button type="button" className="btn btn-d pk-go" disabled={!st.load} onClick={go}>{T("Losfahren und bremsen")}</button>
                : <button type="button" className="btn btn-o pk-go" onClick={reset} disabled={!shown}>{T("Nochmal einstellen")}</button>}
        </div>}
        {shown && res[shown] && <div className={`part verdict ${shown === "ok" ? "ok" : "no"}`} aria-live="polite"><b>{x(res[shown].title)}</b><p>{x(res[shown].text)}</p></div>}
        {st.solved && shown === "ok" && x(data.done as LText) && <div className="mission done">{x(data.done as LText)}</div>}
        {x(data.src as LText) && <p className="src">{t("source")}: {x(data.src as LText)}</p>}
        <Nav label={last ? finishLabel : undefined} />
    </>;
}
