import { SelfData } from "../types";
import { Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from ".";

/** Samoocena 1–5 przy każdym celu. Nie ma złych odpowiedzi, Weiter zawsze aktywne. */
export function SelfStep({ data, last, finishLabel }: StepProps<SelfData>) {
    const { x, t, useStepState } = usePlayer();
    const [rating, setRating] = useStepState<Record<string, number>>({}, "self-ratings");
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <p className="small">{x(data.lead)}</p>
        <div>{data.goals.map(g => (
            <div className="goal" key={g.code}>
                <div className="gt"><em className="tn">{g.code}</em><span id={`gl-${g.code}`}>{x(g.text)}</span></div>
                <div className="rate" role="group" aria-labelledby={`gl-${g.code}`}>{[1, 2, 3, 4, 5].map(v => (
                    <button key={v} type="button" aria-pressed={rating[g.code] === v} onClick={() => setRating(r => ({ ...r, [g.code]: v }))}>{v}</button>
                ))}</div>
            </div>
        ))}</div>
        <div className="scale"><span>{t("unknown")}</span><span>{t("sure")}</span></div>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}
