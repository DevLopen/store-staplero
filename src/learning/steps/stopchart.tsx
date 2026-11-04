/**
 * Droga zatrzymania jako wykres: pasek = droga reakcji + droga hamowania, w metrach na wspólnej skali.
 * Na górze pasek dla prędkości z suwaka, pod nim 5, 10 i 15 km/h do porównania.
 * Model uproszczony: reakcja = v × t, hamowanie = v² / (2 × 1,5 m/s²).
 */
import { useState } from "react";
import { usePlayer } from "../LessonPlayer";
import type { LText } from "../types";
import "./stopchart.css";

type L4 = { de: string; en: string; pl: string; uk: string };
const S: Record<string, L4> = {
    speed: { de: "Dein Tempo", en: "Your speed", pl: "Twoja prędkość", uk: "Твоя швидкість" },
    react: { de: "Reaktionsweg", en: "Reaction distance", pl: "Droga reakcji", uk: "Шлях реакції" },
    brake: { de: "Bremsweg", en: "Braking distance", pl: "Droga hamowania", uk: "Гальмівний шлях" },
    stop: { de: "Anhalteweg", en: "Stopping distance", pl: "Droga zatrzymania", uk: "Шлях зупинки" },
    rt: { de: "Reaktionszeit", en: "Reaction time", pl: "Czas reakcji", uk: "Час реакції" },
    cmp: { de: "Zum Vergleich", en: "For comparison", pl: "Dla porównania", uk: "Для порівняння" },
};
const DEC = 1.5, MAXM = 14, TICKS = [0, 2, 4, 6, 8, 10, 12, 14];
const parts = (v: number, tr: number) => { const ms = v / 3.6; return { r: ms * tr, b: (ms * ms) / (2 * DEC) }; };

export interface StopChartData { note?: LText }

export function StopChart({ data }: { data: StopChartData }) {
    const { x, lang } = usePlayer();
    const l = (k: keyof typeof S) => S[k][lang as keyof L4] ?? S[k].de;
    const m = (n: number) => `${n.toFixed(1).replace(".", lang === "en" ? "." : ",")} m`;
    const [v, setV] = useState(10);
    const [tr, setTr] = useState(1);
    const cur = parts(v, tr);
    const pct = (n: number) => `${Math.min(100, (n / MAXM) * 100)}%`;
    const Bar = ({ r, b, big }: { r: number; b: number; big?: boolean }) => (
        <div className={`sc-bar ${big ? "big" : ""}`}>
            <i className="r" style={{ width: pct(r) }} />
            <i className="b" style={{ width: pct(b) }} />
            <span className="sc-tot">{m(r + b)}</span>
        </div>
    );

    return <figure className="sc">
        <div className="sc-top">
            <div><span>{l("speed")}</span><b>{v} km/h</b></div>
            <div><span>{l("stop")}</span><b>{m(cur.r + cur.b)}</b></div>
        </div>
        <input className="sc-range" type="range" min={4} max={16} step={1} value={v} aria-label={l("speed")} onChange={e => setV(Number(e.target.value))} />
        <div className="sc-row"><span className="sc-v cur">{v} km/h</span><Bar r={cur.r} b={cur.b} big /></div>
        <div className="sc-parts">
            <span><i className="r" />{l("react")} <b>{m(cur.r)}</b></span>
            <span><i className="b" />{l("brake")} <b>{m(cur.b)}</b></span>
        </div>

        <p className="sc-h">{l("cmp")}</p>
        {[5, 10, 15].map(s => { const p = parts(s, tr); return <div key={s} className="sc-row"><span className="sc-v">{s} km/h</span><Bar r={p.r} b={p.b} /></div>; })}
        <div className="sc-row" aria-hidden="true"><span className="sc-v">m</span><div className="sc-axis">{TICKS.map(t => <span key={t} style={{ left: pct(t) }}>{t}</span>)}</div></div>

        <div className="sc-seg" role="group" aria-label={l("rt")}>
            <span>{l("rt")}</span>
            {[0.5, 1, 1.5].map(t => <button key={t} type="button" aria-pressed={t === tr} className={t === tr ? "on" : ""} onClick={() => setTr(t)}>{String(t).replace(".", lang === "en" ? "." : ",")} s</button>)}
        </div>
        {x(data.note) && <figcaption className="sc-note">{x(data.note)}</figcaption>}
    </figure>;
}
