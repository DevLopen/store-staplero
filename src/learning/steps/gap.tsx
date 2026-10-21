import { ReactNode } from "react";
import { GapData } from "../types";
import { Actions, Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from ".";

interface GapState { fill: (string | null)[]; checked: boolean; ok: boolean }

/** Luki wypełniane po kolei słowami z puli; po błędzie złe luki same się czyszczą. */
export function GapStep({ data, last, finishLabel }: StepProps<GapData>) {
    const { x, t, useStepState, openSheet, next } = usePlayer();
    const n = data.answer.length;
    const [st, setSt] = useStepState<GapState>({ fill: Array(n).fill(null), checked: false, ok: false });
    const chipText = (id: string) => x(data.chips.find(c => c.id === id)?.text);
    const right = (i: number) => {
        const v = st.fill[i];
        const group = data.interchangeable?.find(g => g.includes(i));
        if (!group) return v === data.answer[i];
        // luki z jednej grupy przyjmują swoje odpowiedzi w dowolnej kolejności, ale bez powtórzeń
        const want = group.map(g => data.answer[g]);
        const got = group.map(g => st.fill[g]);
        return !!v && want.includes(v) && got.filter(g => g === v).length === 1;
    };

    const parts: ReactNode[] = [];
    x(data.sentence).split(/(\{\d+\})/).forEach((p, k) => {
        const m = p.match(/^\{(\d+)\}$/);
        if (!m) { parts.push(p); return; }
        const i = Number(m[1]) - 1, v = st.fill[i];
        const cls = st.checked && v ? (right(i) ? "right" : "wrong") : "";
        parts.push(
            <button key={k} type="button" aria-label={t("gap", { n: i + 1 })} className={`blank ${v ? "" : "empty"} ${cls}`}
                onClick={() => !st.ok && setSt(s => ({ ...s, checked: false, fill: s.fill.map((f, j) => j === i ? null : f) }))}>
                {v ? chipText(v) : "______"}
            </button>
        );
    });
    const used = st.fill.filter(Boolean);
    const full = st.fill.every(Boolean);
    const check = () => {
        if (st.fill.every((_, i) => right(i))) {
            setSt(s => ({ ...s, checked: true, ok: true }));
            openSheet({ kind: "ok", title: x(data.success.title), body: <><p>{x(data.success.body)}</p>{x(data.success.src) && <p className="src">{x(data.success.src)}</p>}</>, button: t("next"), onButton: next });
        } else {
            setSt(s => ({ ...s, checked: true }));
            setTimeout(() => setSt(s => ({ ...s, checked: false, fill: s.fill.map((v, i) => (right(i) ? v : null)) })), 1500);
        }
    };

    return <>
        <h2 className="q">{x(data.title)}</h2>
        <p className="small">{x(data.lead) || t("gapHelp")}</p>
        <div className="gap-text">{parts}</div>
        <div className="chips">{data.chips.map(c => (
            <button key={c.id} className="chip" type="button" disabled={used.includes(c.id) || st.ok}
                onClick={() => setSt(s => { const k = s.fill.indexOf(null); return k < 0 ? s : { ...s, checked: false, fill: s.fill.map((f, j) => (j === k ? c.id : f)) }; })}>
                {x(c.text)}
            </button>
        ))}</div>
        {st.ok
            ? <Nav label={last ? finishLabel : undefined} />
            : <Actions hint={full ? undefined : t("fillAll")}><button className="btn btn-d" type="button" disabled={!full} onClick={check}>{t("check")}</button></Actions>}
    </>;
}
