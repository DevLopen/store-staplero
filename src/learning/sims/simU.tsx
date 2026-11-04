/** Unfallgeschehen: zgadnij liczbę wypadków, potem dane DGUV (rodzaje wózków, przebieg wypadków). */
import { LText, SimData } from "../types";
import { Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from "../steps";
import { useSimText } from "./shared";
import "./tech.css";

interface Bar { label: LText; n: number; dead?: number }
interface Part { label: LText; pct: number; n: number }
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a"];       // paleta kategoryczna (zweryfikowana), kolejność stała
const fmt = (n: number, lang: string) => n.toLocaleString(lang === "en" ? "en-GB" : lang === "uk" ? "uk-UA" : lang === "pl" ? "pl-PL" : "de-DE");

export function StatsSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, lang, useStepState } = usePlayer();
    const T = useSimText(data);
    const total = data.total as number, dead = data.dead as number, pensions = data.pensions as number, prev = data.prev as { n: number; dead: number };
    const bars = (data.bars ?? []) as Bar[];
    const parts = (data.parts ?? []) as Part[];
    const [st, setSt] = useStepState<{ guess: number; shown: boolean }>({ guess: 5000, shown: false });
    const max = Math.max(...bars.map(b => b.n));
    const off = Math.round(Math.abs(st.guess - total) / total * 100);
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        <p className="small">{x(data.lead as LText)}</p>
        <div className="st-guess">
            <label className="pk-sl"><span>{T("Deine Schätzung")}<b>{fmt(st.guess, lang)}</b></span>
                <input type="range" min={0} max={40000} step={500} value={st.guess} disabled={st.shown} onChange={e => setSt(s => ({ ...s, guess: +e.target.value }))} /></label>
            {!st.shown && <button type="button" className="btn btn-d pk-go" onClick={() => setSt(s => ({ ...s, shown: true }))}>{T("Auflösen")}</button>}
        </div>
        {st.shown && <>
            <div className="st-hero" aria-live="polite">
                <b>{fmt(total, lang)}</b>
                <span>{x(data.heroLabel as LText)}</span>
                <small>{off <= 15 ? T("Sehr nah dran.") : st.guess < total ? T("Es sind {p} % mehr, als du geschätzt hast.", { p: Math.round((total - st.guess) / Math.max(1, st.guess) * 100) }) : T("Es sind weniger, als du geschätzt hast, aber immer noch sehr viele.")}</small>
            </div>
            <div className="st-tiles">
                <div><b>{T("rund {n}", { n: Math.round(total / 250) })}</b><span>{T("an jedem Arbeitstag")}</span></div>
                <div><b>{fmt(pensions, lang)}</b><span>{T("so schwer, dass eine Unfallrente nötig wurde")}</span></div>
                <div><b>{dead}</b><span>{T("Menschen starben")}</span></div>
            </div>
            <p className="st-note">{T("Vorjahr: {n} Unfälle, {d} Tote. Arbeitstage gerechnet mit rund 250 pro Jahr.", { n: fmt(prev.n, lang), d: prev.dead })}</p>

            <figure className="st-fig">
                <figcaption><b>{x(data.barsTitle as LText)}</b><span>{T("Meldepflichtige Unfälle")}</span></figcaption>
                <div className="st-bars" role="list">{bars.map((b, i) => (
                    <div key={i} className="st-row" role="listitem" title={`${x(b.label)}: ${fmt(b.n, lang)}${b.dead ? ` · ${T("{d} tödlich", { d: b.dead })}` : ""}`}>
                        <span className="st-l">{x(b.label)}</span>
                        <span className="st-track"><i style={{ width: `${b.n / max * 100}%` }} /></span>
                        <span className="st-v">{fmt(b.n, lang)}{b.dead ? <em>{T("{d} tödlich", { d: b.dead })}</em> : null}</span>
                    </div>
                ))}</div>
            </figure>

            <figure className="st-fig">
                <figcaption><b>{x(data.partsTitle as LText)}</b><span>{T("Anteil der Unfälle mit Flurförderzeugen")}</span></figcaption>
                <div className="st-stack" role="img" aria-label={parts.map(p => `${x(p.label)} ${p.pct} %`).join(", ")}>
                    {parts.map((p, i) => <i key={i} style={{ width: `${p.pct}%`, background: SERIES[i] }} title={`${x(p.label)}: ${p.pct} % (${fmt(p.n, lang)})`} />)}
                </div>
                <ul className="st-legend">{parts.map((p, i) => <li key={i}><i style={{ background: SERIES[i] }} /><span>{x(p.label)}</span><b>{p.pct.toLocaleString(lang === "en" ? "en-GB" : "de-DE")} %</b></li>)}</ul>
            </figure>
            <details className="dg-more"><summary>{T("Als Tabelle anzeigen")}</summary>
                <table className="st-table"><thead><tr><th>{x(data.barsTitle as LText)}</th><th>{T("Unfälle")}</th><th>{T("tödlich")}</th></tr></thead><tbody>
                    {bars.map((b, i) => <tr key={i}><td>{x(b.label)}</td><td>{fmt(b.n, lang)}</td><td>{b.dead ?? 0}</td></tr>)}
                </tbody></table>
                <table className="st-table"><thead><tr><th>{x(data.partsTitle as LText)}</th><th>{T("Unfälle")}</th><th>%</th></tr></thead><tbody>
                    {parts.map((p, i) => <tr key={i}><td>{x(p.label)}</td><td>{fmt(p.n, lang)}</td><td>{p.pct}</td></tr>)}
                </tbody></table>
            </details>
        </>}
        {x(data.src as LText) && <p className="src">{t("source")}: {x(data.src as LText)}</p>}
        <Nav label={last ? finishLabel : undefined} />
    </>;
}
