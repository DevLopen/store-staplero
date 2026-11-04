/** Moduł 9 „Verkehrsregelung”: kto ma pierwszeństwo na skrzyżowaniu w hali (3D, kilka sytuacji po kolei). */
import { lazy, useEffect, useState } from "react";
import { LText, SimData } from "../types";
import { Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from "../steps";
import { useSimText } from "./shared";
import { S3, use3dUi } from "./lazy3d";
import type { RowChoice, RowRound } from "./three/scenesVerkehr";
import "./tech.css";

const RowScene = lazy(() => import("./three/scenesVerkehr").then(m => ({ default: m.RowScene })));
interface Round { id: RowRound; text: LText; correct: RowChoice; why: LText }

export function RowSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState } = usePlayer();
    const T = useSimText(data), ui = use3dUi();
    const rounds = (data.rounds ?? []) as Round[];
    const [st, setSt] = useStepState<{ i: number; ans: Record<string, RowChoice> }>({ i: 0, ans: {} });
    const r = rounds[st.i];
    const choice = r ? st.ans[r.id] ?? null : null;
    const [shown, setShown] = useState(false);
    useEffect(() => { setShown(false); if (!choice) return; const id = setTimeout(() => setShown(true), 4200); return () => clearTimeout(id); }, [choice, st.i]);
    const right = rounds.filter(q => st.ans[q.id] === q.correct).length;
    const done = rounds.every(q => st.ans[q.id]) && shown && st.i === rounds.length - 1;
    if (!r) return null;
    const ok = choice === r.correct;
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        {x(data.lead as LText) && <p className="small">{x(data.lead as LText)}</p>}
        <div className="prog"><span>{T("Situation {n} von {m}", { n: st.i + 1, m: rounds.length })}</span><div className="bar"><i style={{ width: `${(st.i + (shown ? 1 : 0)) / rounds.length * 100}%` }} /></div></div>
        <S3 cls="s3d-pick" fallback={ui.loading}>
            <RowScene key={r.id} round={r.id} choice={choice} label={x(data.title)} hint={ui.hint} resetLabel={ui.resetLabel} />
        </S3>
        <div className="part row-q"><p>{x(r.text)}</p></div>
        {!choice && <div className="nav2 chk3-ans">
            <button type="button" className="btn btn-o" onClick={() => setSt(s => ({ ...s, ans: { ...s.ans, [r.id]: "go" } }))}>{T("Fahren")}</button>
            <button type="button" className="btn btn-o" onClick={() => setSt(s => ({ ...s, ans: { ...s.ans, [r.id]: "wait" } }))}>{T("Warten")}</button>
        </div>}
        {choice && shown && <div className={`part verdict ${ok ? "ok" : "no"}`} aria-live="polite"><b>{ok ? t("right") : t("notQuite")} · {T(r.correct === "go" ? "Fahren" : "Warten")}</b><p>{x(r.why)}</p></div>}
        {choice && shown && st.i < rounds.length - 1 && <button type="button" className="btn btn-d pk-go" onClick={() => setSt(s => ({ ...s, i: s.i + 1 }))}>{T("Nächste Situation")}</button>}
        {done && <div className={`mission ${right === rounds.length ? "done" : ""}`}>{T("{r} von {n} Situationen richtig.", { r: right, n: rounds.length })}</div>}
        {x(data.src as LText) && <p className="src">{t("source")}: {x(data.src as LText)}</p>}
        <Nav label={last ? finishLabel : undefined} />
    </>;
}
