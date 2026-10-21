import { useEffect, useRef, useState } from "react";
import { SimData } from "../types";
import { Actions, Nav, usePlayer } from "../LessonPlayer";
import { animateTurn, capacityChart, leverState, leverSVG, LeverState, MN, MS, Mode, PEDS, pedSVG, posSVG, qzul, turnFrame } from "./art";
import { Svg, Toggle, useNum, useSimText } from "./shared";
import type { StepProps } from "../steps";

/* ───────── skręt: auto i wózek w porównaniu ───────── */
export function TurnSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data);
    const [st, setSt] = useStepState<{ mode: Mode; seen: Record<Mode, boolean> }>({ mode: "stapler", seen: { stapler: false, auto: false } });
    const ref = useRef<HTMLDivElement>(null);
    const [busy, setBusy] = useState(false);
    const both = st.seen.stapler && st.seen.auto;
    useEffect(() => { if (ref.current && !busy) ref.current.innerHTML = turnFrame(T, st.mode, 0, []); }, [st.mode, T]); // eslint-disable-line react-hooks/exhaustive-deps
    const drive = async () => {
        if (!ref.current) return;
        setBusy(true);
        await animateTurn(ref.current, T, st.mode);
        setBusy(false);
        setSt(s => ({ ...s, seen: { ...s.seen, [s.mode]: true } }));
    };
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <Toggle label={T("Fahrzeug wählen")} value={st.mode} disabled={busy} options={[["auto", T("Auto")], ["stapler", T("Gabelstapler")]]} onChange={mode => setSt(s => ({ ...s, mode }))} />
        <div className="sim" ref={ref} />
        <div className="legend"><span><i style={{ background: "#dc2626" }} />{T("Weg der hinteren Ecke")}</span><span><i style={{ background: "#9ca3af" }} />{T("Weg der vorderen Ecke")}</span></div>
        {!both && <div className="mission">{T(st.seen.stapler ? "Jetzt das Auto zum Vergleich" : st.seen.auto ? "Jetzt den Gabelstapler zum Vergleich" : "Lass beide Fahrzeuge abbiegen")}</div>}
        <Actions>
            <button className="btn btn-d" type="button" disabled={busy} onClick={drive}>{T(st.mode === "stapler" ? "Stapler links abbiegen lassen" : "Auto links abbiegen lassen")}</button>
        </Actions>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

/* ───────── kto jest w niebezpieczeństwie przy skręcie ───────── */
export function PedsSim({ data }: StepProps<SimData>) {
    const { x, useStepState, openSheet, next, t } = usePlayer();
    const T = useSimText(data);
    const [pick, setPick] = useStepState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (ref.current && !pick) ref.current.innerHTML = turnFrame(T, "stapler", 0, [], Object.keys(PEDS).map(id => pedSVG(id, PEDS[id], "")).join(""));
    }, [T]); // eslint-disable-line react-hooks/exhaustive-deps
    const choose = async (id: string) => {
        if (!ref.current) return;
        setPick(id);
        const hit = (await animateTurn(ref.current, T, "stapler", true)) ?? "A";
        const right = id === hit;
        setTimeout(() => openSheet({
            kind: right ? "ok" : "no", title: right ? T("Richtig erkannt") : T("Gefahr droht Person {id}", { id: hit }), sub: T("Deine Wahl: Person {id}", { id }),
            body: <><p>{T("Person {id} steht neben dem Heck. Weil der Stapler hinten lenkt, schwenkt das Heck beim Abbiegen nach außen und erfasst sie. Ein Autofahrer rechnet damit nicht.", { id: hit })}</p>
                <p>{T("Deshalb: Personen im Fahrbereich im Blick behalten und vor dem Lenken auch nach hinten schauen.")}</p>
                <p className="src">{T("DGUV G 308-001, Vorbemerkung und Anhang 1 Nr. 3")}</p></>,
            button: t("next"), onButton: next,
        }), 500);
    };
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <p className="small">{T("Der Stapler biegt gleich links ab. Wer steht in Gefahr?")}</p>
        <div className="sim" ref={ref} />
        {pick ? <Nav /> : (
            <Actions><div className="row-btn">{["A", "B", "C"].map(id => <button key={id} className="btn btn-o" type="button" onClick={() => choose(id)}>{T("Person {id}", { id })}</button>)}</div></Actions>
        )}
    </>;
}

/* ───────── huśtawka: kiedy wózek się przewraca ───────── */
export function LeverSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data);
    const num = useNum();
    const [st, setSt] = useStepState<{ kg: number; c: number; prev: LeverState; seen: boolean }>({ kg: 1200, c: 500, prev: "ok", seen: false });
    const state = leverState(st.kg, st.c), M = st.kg * (450 + st.c);
    const set = (kg: number, c: number) => setSt(s => {
        const ns = leverState(kg, c);
        return { kg, c, prev: leverState(s.kg, s.c), seen: s.seen || ns === "tip" };
    });
    const col = state === "ok" ? "#22c55e" : state === "warn" ? "#f59e0b" : "#dc2626";
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        <div className={`mission ${st.seen ? "done" : ""}`}>{T(st.seen ? "Geschafft: Zu viel Last zu weit vorne, er kippt." : "Aufgabe: Bring den Stapler zum Kippen.")}</div>
        <div className="presets">
            {([[1000, 500, "Normale Palette"], [1800, 900, "Lange Kiste"], [3000, 900, "Zu schwer, zu weit vorne"]] as const).map(([kg, c, l]) => <button key={l} type="button" onClick={() => set(kg, c)}>{T(l)}</button>)}
        </div>
        <Svg html={leverSVG(T, num, st.kg, st.c, state, st.prev)} />
        <div className="load-bar">
            <div className="lb"><i style={{ width: `${Math.min(100, M / MS * 100)}%`, background: col }} /></div>
            <div className="lb-l"><span className={`status ${state === "ok" ? "ok" : state === "warn" ? "warn" : "no"}`}>{T(state === "ok" ? "Zulässig" : state === "warn" ? "Überlastet: Hinterräder werden leicht" : "Der Stapler kippt nach vorne")}</span><span className="small">{T("Lastmoment {p} %", { p: Math.round(M / MN * 100) })}</span></div>
        </div>
        <div className="slider"><div className="sl-top"><label htmlFor="lvKg">{T("Gewicht der Last")}</label><b>{num(st.kg)} kg</b></div><input id="lvKg" type="range" min={200} max={3000} step={100} value={st.kg} onChange={e => set(+e.target.value, st.c)} /></div>
        <div className="slider"><div className="sl-top"><label htmlFor="lvC">{T("Lastschwerpunkt c")}</label><b>{st.c} mm</b></div><input id="lvC" type="range" min={400} max={1200} step={50} value={st.c} onChange={e => set(st.kg, +e.target.value)} /></div>
        <p className="small">{T("Beispielstapler {q} kg bei 500 mm, vereinfacht.", { q: num(2500) })}</p>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

/* ───────── diagram udźwigu: czy wolno podnieść tę paletę ───────── */
export function CapacitySim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState, openSheet, next } = usePlayer();
    const T = useSimText(data);
    const num = useNum();
    const [ans, setAns] = useStepState<boolean | null>(null);
    const answer = (yes: boolean) => {
        setAns(yes);
        openSheet({
            kind: !yes ? "ok" : "no", title: T(!yes ? "Richtig, nicht zulässig" : "Nein, das ist zu viel"), sub: T("Lastschwerpunktdiagramm"),
            body: <><p dangerouslySetInnerHTML={{ __html: T("Bei 900 mm Lastschwerpunkt darf dieser Stapler nur rund <b>{z} kg</b> heben. {a} kg sind zu viel, obwohl die Nennlast {q} kg beträgt.", { z: num(Math.floor(qzul(900) / 10) * 10), a: num(1800), q: num(2500) }) }} />
                <p>{T("Die zulässigen Werte stehen am Stapler im Lastschwerpunktdiagramm. Als Autofahrer musst du so etwas nie beachten.")}</p>
                <p className="src">{T("DGUV G 308-001, Anhang 1 Nr. 5 Standsicherheit")}</p></>,
            button: t("next"), onButton: next,
        });
    };
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <div className="grid2"><div><span>{T("Deine Palette")}</span><b>{num(1800)} kg</b></div><div><span>{T("Lastschwerpunkt")}</span><b>900 mm</b></div></div>
        <p className="small">{T("Eine lange Kiste, der Schwerpunkt liegt weit vorne. Dein Stapler hat {q} kg Nennlast. Grün ist der zulässige Bereich.", { q: num(2500) })}</p>
        <Svg className="" html={capacityChart(T, num, ans !== null ? [900, 1800] : null)} />
        {ans !== null ? <Nav label={last ? finishLabel : undefined} /> : (
            <Actions><div className="row-btn"><button className="btn btn-o" type="button" onClick={() => answer(true)}>{T("Ja, darf ich")}</button><button className="btn btn-d" type="button" onClick={() => answer(false)}>{T("Nein")}</button></div></Actions>
        )}
    </>;
}

/* ───────── pozycja do jazdy ───────── */
type Tilt = "fwd" | "up" | "back";
export function PositionSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState, openSheet, next } = usePlayer();
    const T = useSimText(data);
    const [st, setSt] = useStepState<{ h: number; tilt: Tilt; done: boolean }>({ h: 120, tilt: "fwd", done: false });
    const okH = st.h > 0 && st.h <= 30, okT = st.tilt === "back";
    const drive = () => {
        if (okH && okT) {
            setSt(s => ({ ...s, done: true }));
            openSheet({ kind: "ok", title: T("Gute Fahrt"), sub: T("Richtige Fahrstellung"),
                body: <><ul><li>{T("Last nur bodenfrei angehoben")}</li><li>{T("Hubmast zurückgeneigt")}</li></ul><p>{T("So liegt der Schwerpunkt tief und die Last liegt sicher an der Gabel an.")}</p><p className="src">{T("DGUV G 308-001, Anhang 1 Nr. 8 Umgang mit Last")}</p></>,
                button: t("next"), onButton: next });
            return;
        }
        const errs: string[] = [];
        if (st.h === 0) errs.push("Die Gabel schleift am Boden. Hebe die Last an, bis sie bodenfrei ist.");
        else if (!okH) errs.push("Die Last ist zu hoch. Ein hoher Schwerpunkt bedeutet Kippgefahr in Kurven und beim Bremsen, dazu schlechte Sicht.");
        if (!okT) errs.push(st.tilt === "fwd" ? "Der Mast ist vorgeneigt. Die Last kann beim Bremsen von der Gabel rutschen." : "Neige den Mast zurück, damit die Last sicher an der Gabel anliegt.");
        openSheet({ kind: "no", title: T("So noch nicht"), sub: T("Korrigiere die Fahrstellung"), body: <ul>{errs.map(e => <li key={e}>{T(e)}</li>)}</ul>, button: t("tryAgain") });
    };
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <div className="sim">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "12px 12px 0" }}>
                <span className={`pill ${okH ? "ok" : "no"}`}>{T("Höhe")}: {T(st.h === 0 ? "Gabel schleift" : okH ? "bodenfrei" : "zu hoch")}</span>
                <span className={`pill ${okT ? "ok" : "no"}`}>{T("Mast")}: {T(st.tilt === "fwd" ? "vorgeneigt" : st.tilt === "back" ? "zurückgeneigt" : "senkrecht")}</span>
            </div>
            <div dangerouslySetInnerHTML={{ __html: posSVG(T, st.h, st.tilt) }} />
        </div>
        <div className="slider"><div className="sl-top"><label htmlFor="ph">{T("Hubhöhe")}</label><b>{st.h} cm</b></div><input id="ph" type="range" min={0} max={200} step={10} value={st.h} onChange={e => setSt(s => ({ ...s, h: +e.target.value }))} /></div>
        <Toggle label={T("Neigung des Hubmasts")} value={st.tilt} options={[["fwd", T("vorgeneigt")], ["up", T("senkrecht")], ["back", T("zurückgeneigt")]]} onChange={tilt => setSt(s => ({ ...s, tilt }))} />
        {st.done ? <Nav label={last ? finishLabel : undefined} /> : <Actions><button className="btn btn-d" type="button" onClick={drive}>{T("Losfahren")}</button></Actions>}
    </>;
}

/* ───────── na terenie zakładu czy na drodze ───────── */
export function RoadSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data);
    const [road, setRoad] = useStepState<"site" | "road">("site");
    const base: [string, string][] = [["Mindestens 18 Jahre", ""], ["Geeignet", "körperlich, geistig, charakterlich"], ["Ausgebildet, Befähigung nachgewiesen", "Staplerschein"], ["Schriftlicher Auftrag", "vom Unternehmer"]];
    const extra: [string, string][] = [["Fahrerlaubnis", "Führerschein der passenden Klasse nach FeV"], ["Fahrzeug für die Straße", "Ausrüstung und Zulassung nach StVZO und FZV"]];
    const ck = <span className="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>;
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <p className="small">{T("Im Betrieb gelten die Voraussetzungen aus §7. Auf öffentlichen Straßen kommt das Straßenverkehrsrecht dazu. Schalte um und vergleiche.")}</p>
        <Toggle label={T("Einsatzort")} value={road} options={[["site", T("Im Betrieb")], ["road", T("Öffentliche Straße")]]} onChange={v => setRoad(v)} />
        <div className="reqs">
            {base.map(([a, b]) => <div className="req" key={a}>{ck}<span>{T(a)}{b && <small>{T(b)}</small>}</span></div>)}
            {road === "road" && extra.map(([a, b]) => <div className="req road" key={a}>{ck}<span>{T(a)}<small>{T(b)}</small></span></div>)}
        </div>
        <p className="note">{T(road === "road" ? "Auf der Straße brauchst du beides: Staplerausbildung und Führerschein." : "Im Betrieb ersetzt der Führerschein keine dieser Voraussetzungen.")}</p>
        <p className="src">{T("DGUV G 308-001, Abschn. 2.1 und 2.2")}</p>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}
