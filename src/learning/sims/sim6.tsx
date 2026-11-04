/** Moduł 6 „Betrieb allgemein”: odstawianie wózka (miejsce + kroki zabezpieczenia) i osoby w pobliżu wózka (sceny 3D). */
import { lazy, useState } from "react";
import { LText, SimData } from "../types";
import { Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from "../steps";
import { useSimText } from "./shared";
import { S3, use3dUi } from "./lazy3d";
import type { ParkState, ZoneMark } from "./three/scenes6";
import "./tech.css";

const load6 = () => import("./three/scenes6");
const ParkScene = lazy(() => load6().then(m => ({ default: m.ParkScene })));
const PeopleScene = lazy(() => load6().then(m => ({ default: m.PeopleScene })));
const LoadingScene = lazy(() => import("./three/scenesLast").then(m => ({ default: m.LoadingScene })));
const PlatformScene = lazy(() => import("./three/scenesSonder").then(m => ({ default: m.PlatformScene })));
const RouteScene = lazy(() => import("./three/scenesVerkehr").then(m => ({ default: m.RouteScene })));
const ChargeScene = lazy(() => import("./three/scenesCharge").then(m => ({ default: m.ChargeScene })));

const Tick = () => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;

/* ───────── odstawianie wózka ───────── */
interface Spot { id: string; label: LText; ok?: boolean; why: LText }
const SPOT_POS: Record<string, { pos: [number, number]; yaw: number; slope?: boolean }> = {
    exit: { pos: [-1.6, -2.9], yaw: Math.PI },
    lane: { pos: [-0.6, 2.1], yaw: Math.PI / 2 },
    ramp: { pos: [4.6, 5.6], yaw: Math.PI, slope: true },
    bay: { pos: [3.6, -2.4], yaw: Math.PI },
};
const ACTIONS: { k: keyof ParkState; t: string; sub: string }[] = [
    { k: "brake", t: "Feststellbremse anziehen", sub: "sichert gegen Wegrollen" },
    { k: "forks", t: "Gabeln ganz absenken", sub: "tiefste Stellung, auf dem Boden" },
    { k: "tilt", t: "Mast nach vorn neigen", sub: "Gabelspitzen zeigen auf den Boden" },
    { k: "motor", t: "Antrieb abstellen", sub: "Motor aus" },
    { k: "key", t: "Schlüssel abziehen und mitnehmen", sub: "gegen unbefugte Benutzung" },
];
export function AbstellenSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data), ui = use3dUi();
    const spots = (data.spots ?? []) as Spot[];
    const [st, setSt] = useStepState<{ chosen: string | null; tried: Record<string, boolean>; done: Partial<ParkState>; left: boolean }>({ chosen: null, tried: {}, done: {}, left: false });
    const cur = spots.find(s => s.id === st.chosen);
    const parked = !!cur?.ok;
    const all = ACTIONS.every(a => st.done[a.k]);
    const verdict = Object.fromEntries(spots.filter(s => st.tried[s.id]).map(s => [s.id, s.ok ? "ok" : "no"])) as Record<string, "ok" | "no">;
    const state: ParkState = { forks: !!st.done.forks, tilt: !!st.done.tilt, brake: !!st.done.brake, motor: !!st.done.motor, key: !!st.done.key };
    const choose = (id: string) => { if (!parked) setSt(s => ({ ...s, chosen: id, tried: { ...s.tried, [id]: true } })); };
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        <p className="small">{T(parked ? "Jetzt sicherst du den Stapler. Tippe die Schritte an und schau auf den Stapler." : "Feierabend. Wähle zuerst den Platz, an dem du den Stapler abstellst.")}</p>
        <S3 cls="s3d-park" fallback={ui.loading}>
            <ParkScene spots={spots.map(s => ({ id: s.id, label: x(s.label), ...SPOT_POS[s.id] }))} chosen={st.chosen} verdict={verdict} state={state}
                exitLabel={T("Notausgang")} label={T("Halle mit Abstellplätzen")} hint={ui.hint} resetLabel={ui.resetLabel} />
        </S3>
        {!parked && <div className="spots" role="group" aria-label={T("Platz wählen")}>{spots.map(s => (
            <button key={s.id} type="button" className={verdict[s.id] ?? ""} aria-pressed={st.chosen === s.id} onClick={() => choose(s.id)}>{x(s.label)}</button>
        ))}</div>}
        {cur && <div className={`part verdict ${cur.ok ? "ok" : "no"}`} key={cur.id} aria-live="polite">
            <b>{T(cur.ok ? "Richtiger Platz" : "Nicht hier")}</b><p>{x(cur.why)}</p>
        </div>}
        {parked && <>
            <div className="ticks">{ACTIONS.map(a => (
                <button key={a.k} type="button" aria-pressed={!!st.done[a.k]} disabled={!!st.done[a.k] || st.left} onClick={() => setSt(s => ({ ...s, done: { ...s.done, [a.k]: true } }))}>
                    <span className="bx">{st.done[a.k] && <Tick />}</span><span>{T(a.t)}<small>{T(a.sub)}</small></span>
                </button>
            ))}</div>
            {all && <div className="mission done">{T("Gesichert. Jetzt darfst du den Stapler verlassen.")}</div>}
        </>}
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

/* ───────── osoby w pobliżu wózka ───────── */
interface Zone { id: string; label: LText; bad?: boolean; why: LText }
export function PeopleSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState } = usePlayer();
    const T = useSimText(data), ui = use3dUi();
    const zones = (data.zones ?? []) as Zone[];
    const [st, setSt] = useStepState<{ seen: Record<string, boolean>; cur: string | null }>({ seen: {}, cur: null });
    const [focus, setFocus] = useState<string | null>(null);
    const pick = (id: string) => { setSt(s => ({ seen: { ...s.seen, [id]: true }, cur: id })); setFocus(id); };
    const cur = zones.find(z => z.id === st.cur);
    const bads = zones.filter(z => z.bad), found = bads.filter(z => st.seen[z.id]).length, done = found === bads.length;
    const marks: Record<string, ZoneMark> = Object.fromEntries(zones.map(z => [z.id, st.seen[z.id] ? (z.bad ? "ok" : "seen") : st.cur === z.id ? "cur" : ""]));
    if (cur && !cur.bad) marks[cur.id] = "cur";
    const Scene = data.scene === "loading" ? LoadingScene : data.scene === "platform" ? PlatformScene : data.scene === "route" ? RouteScene : data.scene === "charging" ? ChargeScene : PeopleScene;
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        {x(data.lead as LText) && <p className="small">{x(data.lead as LText)}</p>}
        <div className={`prog ${done ? "done" : ""}`}><span>{T(done ? "Alle Gefahren gefunden" : "Gefahren gefunden")}</span><div className="bar"><i style={{ width: `${found / Math.max(1, bads.length) * 100}%` }} /></div><b>{found} / {bads.length}</b></div>
        <S3 cls="s3d-people" fallback={ui.loading}>
            <Scene zones={zones.map(z => ({ id: z.id, label: x(z.label) }))} marks={marks} focus={focus} onPick={pick} label={x(data.title)} hint={ui.hint} resetLabel={ui.resetLabel} />
        </S3>
        {cur ? <div className={`part verdict ${cur.bad ? "ok" : "neutral"}`} key={cur.id} aria-live="polite">
            <b>{cur.bad ? T("Gefahr: {l}", { l: x(cur.label) }) : T("In Ordnung: {l}", { l: x(cur.label) })}</b><p>{x(cur.why)}</p>
        </div> : <div className="part empty">{T("Tippe auf die Punkte in der Halle. Nicht alles ist falsch.")}</div>}
        {focus && <button type="button" className="btn-ghost" onClick={() => setFocus(null)}>{T("Ganze Halle zeigen")}</button>}
        {done && x(data.done as LText) && <div className="mission done">{x(data.done as LText)}</div>}
        {x(data.src as LText) && <p className="src">{t("source")}: {x(data.src as LText)}</p>}
        <Nav label={last ? finishLabel : undefined} />
    </>;
}
