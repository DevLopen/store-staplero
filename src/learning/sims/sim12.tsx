import { LText, SimData } from "../types";
import { Actions, Nav, usePlayer } from "../LessonPlayer";
import { checkSVG, licenceSVG, ParkState, parkSVG, rampSVG } from "./art";
import { DRIVER, personSVG } from "./people";
import { Svg, Toggle, useSimText } from "./shared";
import type { StepProps } from "../steps";

const Check = () => <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;

/* ───────── kontrola przed pracą: dotknij każdy punkt ───────── */
interface CheckPoint { id: string; label: LText; finding: LText; bad?: boolean }
export function CheckSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data);
    const points = (data.points ?? []) as CheckPoint[];
    const [st, setSt] = useStepState<{ seen: Record<string, boolean>; cur: string | null }>({ seen: {}, cur: null });
    const pick = (id: string) => setSt(s => ({ seen: { ...s.seen, [id]: true }, cur: id }));
    const n = points.filter(p => st.seen[p.id]).length;
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <div className={`mission ${n === points.length ? "done" : ""}`}>{n === points.length ? T("Alle Punkte geprüft.") : T("Aufgabe: Prüfe alle Punkte. Geprüft: {n} von {m}", { n, m: points.length })}</div>
        <Svg html={checkSVG(T, points.map(p => ({ id: p.id, label: x(p.label), bad: p.bad })), st.seen, st.cur)}
            onClick={e => { const g = (e.target as Element).closest("[data-k]"); if (g) pick(g.getAttribute("data-k")!); }} />
        <div className="chk">{points.map(p => {
            const seen = st.seen[p.id];
            return (
                <button key={p.id} type="button" onClick={() => pick(p.id)} className={`${seen ? (p.bad ? "bad" : "good") : ""} ${st.cur === p.id ? "on" : ""}`}>
                    <span className="st">{seen ? (p.bad ? "!" : <Check />) : null}</span>
                    <span><b>{x(p.label)}</b><span className="f">{seen ? (p.bad ? `${T("Mangel")}: ` : "") + x(p.finding) : T("noch nicht geprüft")}</span></span>
                </button>
            );
        })}</div>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

/* ───────── rampa: ładunek zawsze od strony wzniesienia ───────── */
type Dir = "vor" | "rueck";
export function RampSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState, openSheet, closeSheet, next } = usePlayer();
    const T = useSimText(data);
    const [st, setSt] = useStepState<{ cs: "up" | "down"; up: Dir | null; down: Dir | null; checked: boolean; ok: boolean }>({ cs: "up", up: null, down: null, checked: false, ok: false });
    const d = st[st.cs];
    const check = () => {
        const okUp = st.up === "vor", okDown = st.down === "rueck", ok = okUp && okDown;
        setSt(s => ({ ...s, checked: true, ok }));
        const li = (good: boolean, w: string, txt: string) => <li><b>{T(w)}: {T(good ? "richtig gewählt." : "falsch gewählt.")}</b> {T(txt)}</li>;
        openSheet({
            kind: ok ? "ok" : "no", title: T(ok ? "Last immer oben" : "So noch nicht"), sub: T("DGUV Vorschrift 68 §12 Abs. 7"),
            body: <><ul>{li(okUp, "Hinauf", "Richtig ist vorwärts, die Last ist vorne oben.")}{li(okDown, "Hinunter", "Richtig ist rückwärts, so bleibt die Last oben.")}</ul>
                <p>{T("Liegt die Last talseitig, kann sie von der Gabel rutschen und der Stapler kippt leichter nach vorne. Auf der Schräge wird nie gewendet.")}</p>
                <p className="src">{T("DGUV V68 §12 Abs. 7, §8 mit DA")}</p></>,
            button: ok ? t("next") : t("tryAgain"),
            onButton: ok ? next : () => { closeSheet(); setSt(s => ({ cs: !okUp ? "up" : "down", up: okUp ? s.up : null, down: okDown ? s.down : null, checked: false, ok: false })); },
        });
    };
    const full = !!(st.up && st.down);
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <p className="small">{T("Du transportierst eine Palette über eine Rampe. Wähle für beide Fahrten die Richtung.")}</p>
        <Toggle label={T("Fahrt wählen")} value={st.cs} options={[["up", T("Hinauf")], ["down", T("Hinunter")]]} onChange={cs => setSt(s => ({ ...s, cs }))} />
        <Svg html={rampSVG(T, st.cs, d, st.checked || st.ok)} />
        <Toggle label={T("Fahrtrichtung des Staplers")} value={d} disabled={st.ok} options={[["vor", T("Vorwärts")], ["rueck", T("Rückwärts")]]}
            onChange={v => setSt(s => ({ ...s, [s.cs]: v, checked: false }))} />
        {st.ok ? <Nav label={last ? finishLabel : undefined} />
            : <Actions hint={full ? undefined : T("Wähle für Hinauf und Hinunter eine Richtung")}><button className="btn btn-d" type="button" disabled={!full} onClick={check}>{t("check")}</button></Actions>}
    </>;
}

/* ───────── odstawianie wózka ───────── */
const PARK: [keyof ParkState, string, [string, string][]][] = [
    ["loc", "Abstellort", [["exit", "Notausgang"], ["area", "Abstellfläche"]]],
    ["brake", "Feststellbremse", [["off", "gelöst"], ["on", "angezogen"]]],
    ["fork", "Gabel", [["up", "angehoben"], ["down", "ganz unten"]]],
    ["tilt", "Gabelspitzen", [["flat", "waagerecht"], ["down", "nach unten"]]],
    ["motor", "Motor", [["on", "läuft"], ["off", "aus"]]],
    ["key", "Schlüssel", [["in", "steckt"], ["out", "abgezogen"]]],
];
const PARK_ERR: Record<keyof ParkState, string> = {
    loc: "Vor dem Notausgang ist der Fluchtweg versperrt. Stell den Stapler auf die Abstellfläche.",
    brake: "Die Feststellbremse ist gelöst. Der Stapler kann wegrollen.",
    fork: "Die Gabel ist noch angehoben. Fahre sie in die tiefste Stellung.",
    tilt: "Neige die Gabel mit den Spitzen nach unten, damit niemand darüber stolpert.",
    motor: "Der Motor läuft noch. Stell ihn ab.",
    key: "Der Schlüssel steckt. Zieh ihn ab und nimm ihn mit, damit niemand unbefugt fährt.",
};
const PARK_OK: ParkState = { loc: "area", brake: "on", fork: "down", tilt: "down", motor: "off", key: "out" };
export const PARK_TEXTS = [...PARK.flatMap(([, l, o]) => [l, ...o.map(v => v[1])]), ...Object.values(PARK_ERR)];

export function ParkSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState, openSheet, next } = usePlayer();
    const T = useSimText(data);
    const [st, setSt] = useStepState<{ p: ParkState; ok: boolean }>({ p: { loc: "exit", brake: "off", fork: "up", tilt: "flat", motor: "on", key: "in" }, ok: false });
    const leave = () => {
        const errs = (Object.keys(PARK_OK) as (keyof ParkState)[]).filter(k => st.p[k] !== PARK_OK[k]);
        if (!errs.length) {
            setSt(s => ({ ...s, ok: true }));
            openSheet({ kind: "ok", title: T("Richtig abgestellt"), sub: T("Alle Punkte erfüllt"),
                body: <><ul>{["Abstellfläche statt Fluchtweg", "Feststellbremse angezogen", "Gabel ganz unten, Spitzen nach unten", "Motor aus, Schlüssel abgezogen"].map(s => <li key={s}>{T(s)}</li>)}</ul><p className="src">{T("DGUV V68 §15 Abs. 1")}</p></>,
                button: t("next"), onButton: next });
        } else {
            openSheet({ kind: "no", title: T("So noch nicht"), sub: errs.length === 1 ? T("1 Punkt fehlt") : T("{n} Punkte fehlen", { n: errs.length }),
                body: <ul>{errs.map(k => <li key={k}>{T(PARK_ERR[k])}</li>)}</ul>, button: T("Korrigieren") });
        }
    };
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        <Svg html={parkSVG(T, st.p)} />
        <div className="sw">{PARK.map(([k, l, o]) => (
            <div className="sw-row" key={k}><span>{T(l)}</span>
                <Toggle label={T(l)} value={st.p[k]} options={o.map(([v, lab]) => [v, T(lab)] as [string, string])} onChange={v => setSt(s => ({ ...s, p: { ...s.p, [k]: v } as ParkState }))} />
            </div>
        ))}</div>
        {st.ok ? <Nav label={last ? finishLabel : undefined} />
            : <Actions><button className="btn btn-d" type="button" onClick={leave}>{T("Absteigen und gehen")}</button></Actions>}
    </>;
}

/* ───────── 1.5: budowa Staplerscheinu, dotknij pola ───────── */
export function LicenceSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data);
    const points = (data.points ?? []) as CheckPoint[];
    const [st, setSt] = useStepState<{ seen: Record<string, boolean>; cur: string | null }>({ seen: {}, cur: null });
    const pick = (id: string) => setSt(s => ({ seen: { ...s.seen, [id]: true }, cur: id }));
    const n = points.filter(p => st.seen[p.id]).length;
    const photo = personSVG(DRIVER).replace('<svg viewBox="0 0 64 64"', '<svg viewBox="0 0 64 64" width="64" height="64"');
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <div className={`mission ${n === points.length ? "done" : ""}`}>{n === points.length ? T("Alle Felder angesehen.") : T("Aufgabe: Tippe alle Felder an. Angesehen: {n} von {m}", { n, m: points.length })}</div>
        <Svg html={licenceSVG(T, points.map(p => ({ id: p.id, label: x(p.label) })), st.seen, st.cur, photo)}
            onClick={e => { const g = (e.target as Element).closest("[data-k]"); if (g) pick(g.getAttribute("data-k")!); }} />
        <div className="chk">{points.map(p => {
            const seen = st.seen[p.id];
            return (
                <button key={p.id} type="button" onClick={() => pick(p.id)} className={`${seen ? "good" : ""} ${st.cur === p.id ? "on" : ""}`}>
                    <span className="st">{seen ? <Check /> : null}</span>
                    <span><b>{x(p.label)}</b><span className="f">{seen ? x(p.finding) : T("noch nicht angesehen")}</span></span>
                </button>
            );
        })}</div>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}
