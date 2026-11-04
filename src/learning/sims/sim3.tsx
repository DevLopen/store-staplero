import { useEffect, useRef, useState } from "react";
import { KeyPoint, LText, SimData } from "../types";
import { Actions, Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from "../steps";
import { useSimText } from "./shared";
import { hotspots } from "./forklift";
import { batterySVG, BatteryKind, gasTileSVG, sceneSVG } from "./scenes";
import "./tech.css";

const Tick = () => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ───────── akumulator: typ, ładowanie, gazowanie ───────── */
interface BatType { id: BatteryKind; name: LText; rows: KeyPoint[]; after?: LText }
export function BatterySim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data);
    const types = (data.types ?? []) as BatType[];
    const [st, setSt] = useStepState<{ kind: BatteryKind; done: Record<string, boolean> }>({ kind: types[0]?.id ?? "lead", done: {} });
    const [soc, setSoc] = useState(15);
    const [charging, setCharging] = useState(false);
    const [tick, setTick] = useState(0);
    const raf = useRef(0);
    useEffect(() => () => cancelAnimationFrame(raf.current), []);
    useEffect(() => { cancelAnimationFrame(raf.current); setCharging(false); setSoc(15); }, [st.kind]);
    const start = () => {
        if (charging) return;
        if (reduced()) { setSoc(100); setSt(s => ({ ...s, done: { ...s.done, [s.kind]: true } })); return; }
        setCharging(true);
        let s0 = soc, t0 = 0;
        const loop = (ts: number) => {
            if (!t0) t0 = ts;
            const v = Math.min(100, s0 + (ts - t0) / 45);
            setSoc(v); setTick(ts);
            if (v < 100) raf.current = requestAnimationFrame(loop);
            else { setCharging(false); setSt(s => ({ ...s, done: { ...s.done, [s.kind]: true } })); s0 = 100; }
        };
        raf.current = requestAnimationFrame(loop);
    };
    const cur = types.find(b => b.id === st.kind) ?? types[0];
    const status = charging ? T("lädt") : soc >= 100 ? T("voll") : soc < 20 ? T("fast leer") : T("bereit");
    const html = batterySVG(st.kind, soc, charging, tick, { charger: T("Ladegerät"), soc: T("Ladezustand"), status });
    const n = types.filter(b => st.done[b.id]).length;
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        <div className="seg" role="group" aria-label={T("Batterieart wählen")}>{types.map(b => (
            <button key={b.id} type="button" aria-pressed={st.kind === b.id} onClick={() => setSt(s => ({ ...s, kind: b.id }))}>{x(b.name)}</button>
        ))}</div>
        <div className="stage" dangerouslySetInnerHTML={{ __html: html }} />
        <div className={`phase ${soc < 20 ? "hit" : charging ? "free" : soc >= 100 ? "ext" : ""}`} aria-live="polite"><i />{
            soc < 20 && !charging ? T("Unter 20 %: Tiefentladung vermeiden, jetzt laden.")
                : charging ? (st.kind === "li" ? T("Lädt ohne Gasbildung. Das Batteriemanagement überwacht die Zellen.") : st.kind === "gel" ? T("Lädt. Bei Überladung entweicht Gas über die Ventile.") : T("Lädt. Es entsteht Wasserstoff: Knallgasgefahr."))
                    : soc >= 100 ? x(cur?.after) || T("Voll geladen.") : T("Bereit.")
        }</div>
        <dl className="facts2">{cur?.rows.map((r, i) => <div key={i}><dt>{x(r.k)}</dt><dd>{x(r.v)}</dd></div>)}</dl>
        <Progress n={n} m={types.length} label={T("Batteriearten geladen")} />
        <Actions>
            <button className="btn btn-d" type="button" disabled={charging || soc >= 100} onClick={start}>{T(soc >= 100 ? "Geladen" : "Ladegerät einschalten")}</button>
        </Actions>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

function Progress({ n, m, label }: { n: number; m: number; label: string }) {
    return <div className={`prog ${n >= m ? "done" : ""}`}><span>{label}</span><div className="bar"><i style={{ width: `${(n / Math.max(1, m)) * 100}%` }} /></div><b>{n} / {m}</b></div>;
}

/* ───────── właściwa kolejność kroków ───────── */
interface SeqItem { t: LText }
export function SequenceSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState } = usePlayer();
    const T = useSimText(data);
    const items = (data.items ?? []) as SeqItem[];
    const shown = ((data.shuffle as number[] | undefined) ?? items.map((_, i) => i)).filter(i => i < items.length);
    const [st, setSt] = useStepState<{ pick: number[]; checked: boolean }>({ pick: [], checked: false });
    const ok = st.checked && st.pick.every((v, i) => v === i);
    const add = (i: number) => { if (!st.checked && !st.pick.includes(i)) setSt(s => ({ ...s, pick: [...s.pick, i] })); };
    const del = (k: number) => { if (!st.checked) setSt(s => ({ ...s, pick: s.pick.filter((_, j) => j !== k) })); };
    const full = st.pick.length === items.length;
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        {x(data.lead as LText) && <p className="small">{x(data.lead as LText)}</p>}
        <ol className="seq">{items.map((_, k) => {
            const v = st.pick[k];
            const cls = v === undefined ? "empty" : st.checked ? (v === k ? "ok" : "no") : "set";
            return <li key={k} className={cls}>
                <span className="n">{k + 1}</span>
                {v === undefined ? <span className="ph">{k === st.pick.length ? T("Tippe unten den nächsten Schritt an") : ""}</span>
                    : <button type="button" onClick={() => del(k)} disabled={st.checked}>{x(items[v].t)}</button>}
                {st.checked && v !== k && <span className="fix">{T("Richtig: {s}", { s: x(items[k].t) })}</span>}
            </li>;
        })}</ol>
        {!st.checked && <div className="pool">{shown.filter(i => !st.pick.includes(i)).map(i => <button key={i} type="button" onClick={() => add(i)}>{x(items[i].t)}</button>)}</div>}
        {st.checked && <div className={`fb ${ok ? "ok" : "no"}`} aria-live="polite"><b>{t(ok ? "right" : "notQuite")}</b><span>{x((ok ? data.allRight : data.someWrong) as LText)}</span>{x(data.src as LText) && <span className="src">{x(data.src as LText)}</span>}</div>}
        {st.checked ? (ok ? <Nav label={last ? finishLabel : undefined} />
            : <Actions><div className="nav2"><button className="btn btn-o" type="button" onClick={() => setSt({ pick: [], checked: false })}>{t("tryAgain")}</button><NextBtn /></div></Actions>)
            : <Actions hint={full ? undefined : T("Tippe die Schritte in der richtigen Reihenfolge an")}><button className="btn btn-d" type="button" disabled={!full} onClick={() => setSt(s => ({ ...s, checked: true }))}>{t("check")}</button></Actions>}
    </>;
}
function NextBtn() {
    const { t, next } = usePlayer();
    return <button className="btn btn-p" type="button" onClick={next}>{t("next")}</button>;
}

/* ───────── scena: znajdź zagrożenia albo wybierz właściwe miejsce ───────── */
interface Zone { id: string; label: LText; short?: LText; bad?: boolean; why: LText }
export function SceneSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState } = usePlayer();
    const T = useSimText(data);
    const zones = (data.zones ?? []) as Zone[];
    const mode = data.mode === "choose" ? "choose" : "find";
    const [st, setSt] = useStepState<{ seen: Record<string, boolean>; cur: string | null }>({ seen: {}, cur: null });
    const base = sceneSVG(String(data.scene), x(data.title), "");
    const anchors = Object.fromEntries(base.zones.map(z => [z.id, z.p])) as Record<string, [number, number]>;
    const right: Record<string, boolean> = {};
    let wrong: string | null = null;
    for (const z of zones) if (st.seen[z.id]) { if (mode === "find" ? z.bad : !z.bad) right[z.id] = true; else if (z.id === st.cur) wrong = z.id; }
    const seenNeutral = Object.fromEntries(zones.filter(z => st.seen[z.id] && !right[z.id] && z.id !== wrong).map(z => [z.id, true]));
    const overlay = hotspots(anchors, zones.map(z => z.id), { cur: st.cur, right, wrong, seen: seenNeutral });
    const names = mode === "choose" ? Object.fromEntries(zones.map(z => [z.id, x(z.short ?? z.label)])) : undefined;
    const html = sceneSVG(String(data.scene), x(data.title), overlay, names).html;
    const pick = (id: string | null) => { if (id && zones.some(z => z.id === id)) setSt(s => ({ seen: { ...s.seen, [id]: true }, cur: id })); };
    const cur = zones.find(z => z.id === st.cur);
    const bads = zones.filter(z => z.bad), found = bads.filter(z => st.seen[z.id]).length;
    const chosenOk = mode === "choose" && zones.some(z => !z.bad && st.seen[z.id]);
    const done = mode === "find" ? found === bads.length : chosenOk;
    const curGood = cur ? (mode === "find" ? !!cur.bad : !cur.bad) : false;
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        {x(data.lead as LText) && <p className="small">{x(data.lead as LText)}</p>}
        {mode === "find" && <Progress n={found} m={bads.length} label={T(done ? "Alle Gefahren gefunden" : "Gefahren gefunden")} />}
        {data.layout === "tiles" ? (
            <div className="tiles">{zones.map(z => {
                const c = !st.seen[z.id] ? "" : (mode === "find" ? !!z.bad : !z.bad) ? "ok" : "no";
                return <button key={z.id} type="button" className={`tile ${c} ${st.cur === z.id ? "on" : ""}`} onClick={() => pick(z.id)}>
                    <span dangerouslySetInnerHTML={{ __html: gasTileSVG(z.id, x(z.label)) }} /><b>{x(z.label)}</b>
                </button>;
            })}</div>
        ) : <div className="stage" onClick={e => pick((e.target as Element).closest("[data-k]")?.getAttribute("data-k") ?? null)} dangerouslySetInnerHTML={{ __html: html }} />}
        {cur ? (
            <div className={`part verdict ${curGood ? "ok" : mode === "find" ? "neutral" : "no"}`} key={cur.id}>
                <b>{mode === "find" ? (cur.bad ? T("Gefahr: {l}", { l: x(cur.label) }) : T("In Ordnung: {l}", { l: x(cur.label) })) : (cur.bad ? T("Nicht hier: {l}", { l: x(cur.label) }) : T("Richtig: {l}", { l: x(cur.label) }))}</b>
                <p>{x(cur.why)}</p>
            </div>
        ) : <div className="part empty">{T(mode === "find" ? "Tippe auf die Punkte im Bild. Nicht alles ist falsch." : "Tippe auf einen Platz im Bild.")}</div>}
        {done && x(data.done as LText) && <div className="mission done">{x(data.done as LText)}</div>}
        {x(data.src as LText) && <p className="src">{t("source")}: {x(data.src as LText)}</p>}
        <Nav label={last ? finishLabel : undefined} />
    </>;
}
