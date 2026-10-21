import { LText, SimData } from "../types";
import { Nav, usePlayer } from "../LessonPlayer";
import { useSimText } from "./shared";
import type { StepProps } from "../steps";

/* ───────── plan teorii: udział tematów, szczegóły w panelu ───────── */
interface PlanRow { title: LText; min: number; max: number; items: LText[]; current?: boolean }
export function PlanSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, openSheet } = usePlayer();
    const T = useSimText(data);
    const rows = (data.rows ?? []) as PlanRow[];
    const pc = (r: PlanRow) => (r.min === r.max ? `${r.min}` : `${r.min}–${r.max}`);
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <p className="small">{T("Anteil jedes Themas am Unterricht laut DGUV G 308-001. Tippe auf eine Zeile.")}</p>
        <div className="plan">{rows.map((r, i) => (
            <button key={i} type="button" className={`pr ${r.current ? "k1" : ""}`}
                onClick={() => openSheet({
                    kind: "neu", title: x(r.title), sub: T("{p} % der Theorie", { p: pc(r) }) + (r.current ? ` · ${T("dieses Kapitel")}` : ""),
                    body: <><ul>{r.items.map((it, k) => <li key={k}>{x(it)}</li>)}</ul><p className="src">{T("DGUV G 308-001, Tabelle 1 und Anhang 1")}</p></>,
                    button: t("close"),
                })}>
                <span>{x(r.title)}</span>
                <span className="tr"><span className="rg" style={{ left: `${r.min / 20 * 100}%`, width: `${Math.max((r.max - r.min) / 20 * 100, 6)}%` }} /></span>
                <span className="pc">{pc(r)} %</span>
            </button>
        ))}</div>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

/* ───────── egzamin: suwak z progiem 70 % ───────── */
export function ExamSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data);
    const total = Number(data.questions ?? 50), pass = Number(data.passPercent ?? 70);
    const need = Math.ceil(total * pass / 100);
    const [v, setV] = useStepState<number>(Math.round(total * .76));
    const ok = v >= need;
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <div className="big-n"><b>{v}</b><span>{T("von 50 Fragen richtig")}</span></div>
        <div style={{ display: "grid", gap: 8 }}>
            <div className="meter"><i style={{ width: `${v / total * 100}%`, background: ok ? "#22c55e" : "#f59e0b" }} /><span className="th" style={{ left: `${pass}%` }} /></div>
            <div className="meter-l"><span>0</span><b style={{ left: `${pass}%` }}>{pass} %</b><span>{total}</span></div>
        </div>
        <label className="small" htmlFor="eIn">{T("Schiebe den Regler: Wie viele Fragen beantwortest du richtig?")}</label>
        <input id="eIn" type="range" min={0} max={total} value={v} onChange={e => setV(+e.target.value)} />
        <p className={`status ${ok ? "ok" : "no"}`}>{ok ? T("Bestanden mit {p} %", { p: Math.round(v / total * 100) }) : T("Nicht bestanden: noch {n} Fragen bis 70 %", { n: need - v })}</p>
        <div className="grid2">
            <div><span>{T("Fragen")}</span><b>{T("ca. 50")}</b></div><div><span>{T("Form")}</span><b>Multiple Choice</b></div>
            <div><span>{T("Zeit")}</span><b>{T("max. 45 Min.")}</b></div><div><span>{T("Danach")}</span><b>{T("Prüfungsfahrt")}</b></div>
        </div>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

/* ───────── profil startowy z samooceny (kroki „self” zapisują wspólny stan) ───────── */
export function ProfileSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data);
    const goals = (data.goals ?? []) as { code: string; short: LText }[];
    const [rating] = useStepState<Record<string, number>>({}, "self-ratings");
    const W = 360, x0 = 150, w = W - x0 - 8, rh = 38;
    const rated = goals.filter(g => rating[g.code]);
    let note = T("Du hast noch keine Ziele bewertet. Du kannst zurückgehen oder einfach weitermachen.");
    if (rated.length) {
        const lo = rated.reduce((a, b) => (rating[b.code] < rating[a.code] ? b : a));
        note = rating[lo.code] >= 4 ? T("Du bringst schon viel Vorwissen mit.") : T("Am meisten Neues erwartet dich in Thema {n}: {name}.", { n: lo.code, name: x(lo.short) });
    }
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <svg className="chart" viewBox={`0 0 ${W} ${rh * goals.length + 22}`} role="img" aria-label={T("Selbsteinschätzung pro Lernziel")}>
            {[1, 2, 3, 4, 5].map(v => { const xx = x0 + v / 5 * w; return <g key={v}><line x1={xx} y1={0} x2={xx} y2={rh * goals.length} stroke="#e5e7eb" /><text x={xx} y={rh * goals.length + 16} textAnchor="middle" fontSize="11" fill="#9ca3af" fontFamily="Inter">{v}</text></g>; })}
            {goals.map((g, i) => {
                const y = i * rh, r = rating[g.code] ?? 0;
                return <g key={g.code}>
                    <text x={0} y={y + 23} fontSize="12.5" fontFamily="Inter" fill="#374151"><tspan fontWeight="700" fill="#b45309">{g.code}</tspan>  {x(g.short)}</text>
                    <rect x={x0} y={y + 11} width={w} height={16} rx={8} fill="#f3f4f6" />
                    {r > 0 && <rect x={x0} y={y + 11} width={r / 5 * w} height={16} rx={8} fill={r <= 2 ? "#d1d5db" : "#f59e0b"} />}
                </g>;
            })}
        </svg>
        <p className="note">{note}</p>
        <p className="small">{T("Nach dem Test zu Kapitel 1 siehst du hier deinen Vorher-nachher-Vergleich.")}</p>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}
