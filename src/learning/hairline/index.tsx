/**
 * Rysunki Hairline (izometryczne, liniowe, reagują na kursor i palec) w karcie wiedzy.
 * kernel.js to niezmieniony silnik @lucasmarkes/hairline (MIT), figury są zbudowane skillem hairline-create
 * i sprawdzone jego walidatorem. Oba pliki wczytujemy jako tekst i uruchamiamy w osobnym zakresie,
 * żeby stałe z kilku figur nie kolidowały ze sobą.
 */
import { useEffect, useRef, useState } from "react";
import kernelSrc from "./kernel.js?raw";
import wippeSrc from "./wippe.js?raw";
import { usePlayer } from "../LessonPlayer";
import type { LText } from "../types";
import "./hairline.css";

export type FigureName = "wippe";
interface Def { name: string; means: string; range: number[]; tour: ([number, number] | null)[] | null; mount: (ctx: { stage: HTMLElement; svg: SVGSVGElement; read: { textContent: string } }, value: number) => { set: (v: number) => void; destroy: () => void } }
/** Odcinek ruchu dla „Pokaż”, w punktach viewBox 400 × 320 (wippe: środek palety od 500 mm do końca wideł). */
const DEMO: Record<FigureName, [number[], number[]]> = { wippe: [[228, 211], [270, 232]] };
const SRC: Record<FigureName, string> = { wippe: wippeSrc };
let HL: any = null;
const defs: Partial<Record<FigureName, Def>> = {};
function load(name: FigureName): Def {
    if (!HL) HL = new Function(`${kernelSrc}\n;return HL;`)();
    if (!defs[name]) new Function("HL", "hairline", SRC[name])(HL, (d: Def) => { defs[name] = d; });
    return defs[name]!;
}

type L4 = { de: string; en: string; pl: string; uk: string };
const S: Record<string, L4> = {
    speed: { de: "Tempo", en: "Speed", pl: "Prędkość", uk: "Швидкість" },
    stop: { de: "Anhalteweg", en: "Stopping distance", pl: "Droga zatrzymania", uk: "Шлях зупинки" },
    centre: { de: "Lastschwerpunkt", en: "Load centre", pl: "Środek ciężkości ładunku", uk: "Центр ваги вантажу" },
    state: { de: "Stapler", en: "Forklift", pl: "Wózek", uk: "Навантажувач" },
    stands: { de: "steht sicher", en: "stays stable", pl: "stoi stabilnie", uk: "стоїть стійко" },
    lifts: { de: "Hinterachse hebt ab", en: "rear axle lifts", pl: "tylna oś się unosi", uk: "задня вісь піднімається" },
    play: { de: "Vorführen", en: "Show me", pl: "Pokaż", uk: "Показати" },
    stopPlay: { de: "Anhalten", en: "Stop", pl: "Zatrzymaj", uk: "Зупинити" },
};

export interface FigureData {
    name: FigureName;
    hint: LText;                                            // co zrobić palcem; widać, dopóki nikt nie dotknął
    choice?: { label: LText; values: number[]; names: LText[] };   // wartość suwaka figury (masa ładunku, czas reakcji)
    legend?: { mark: "dot" | "dot-lo" | "low" | "high" | "hi"; text: LText }[];
    note?: LText;                                           // założenia modelu, np. „vereinfacht: 1,5 m/s²”
}

const Mark = ({ m }: { m: string }) => <svg viewBox="0 0 24 16" width="24" height="16" aria-hidden="true" className="hl-mk">
    {m === "dot" && <circle cx="12" cy="8" r="3" className="d" />}
    {m === "dot-lo" && <circle cx="12" cy="8" r="3" className="dl" />}
    {m === "low" && <><path d="M3 10 12 6 21 10 12 14Z" /><circle cx="12" cy="10" r="1.2" className="d" /></>}
    {m === "high" && <><path d="M3 6 12 2 21 6 21 10 12 14 3 10Z" /><path d="M3 6 12 10 21 6M12 10V14" /></>}
    {m === "hi" && <path d="M3 6 12 2 21 6 21 10 12 14 3 10Z" className="h" />}
</svg>;

export function HairlineFigure({ data }: { data: FigureData }) {
    const { x, lang } = usePlayer();
    const l = (k: keyof typeof S) => S[k][lang as keyof L4] ?? S[k].de;
    const ref = useRef<HTMLDivElement>(null);
    const handle = useRef<ReturnType<Def["mount"]> | null>(null);
    const playing = useRef<{ stop: () => void } | null>(null);
    const def = load(data.name);
    const [value, setValue] = useState(data.choice ? data.choice.values[1] ?? data.choice.values[0] : def.range[1]);
    const [read, setRead] = useState("rest");
    const [isPlaying, setPlaying] = useState(false);

    useEffect(() => {
        const stage = ref.current!;
        HL.inject(document);
        stage.setAttribute("data-hairline", data.name);
        const svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
        const r = { set textContent(v: string) { setRead(String(v)); }, get textContent() { return ""; } };
        handle.current = def.mount({ stage, svg, read: r }, value);
        return () => { playing.current?.stop(); handle.current?.destroy(); stage.replaceChildren(); };
    }, [data.name]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { handle.current?.set(value); }, [value]);

    // „Pokaż”: jeden płynny ruch wskaźnika (tam, postój, z powrotem) zamiast trasy z przystankami z kernela
    const togglePlay = () => {
        if (playing.current) { playing.current.stop(); return; }
        const stage = ref.current!, [p0, p1] = DEMO[data.name];
        const ease = (u: number) => (u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
        const OUT = 2600, HOLD = 1400, BACK = 2000, t0 = performance.now();
        let raf = 0;
        const fire = (type: string, p?: number[]) => {
            const r = stage.getBoundingClientRect();
            stage.dispatchEvent(new PointerEvent(type, p ? { clientX: r.left + p[0] / 400 * r.width, clientY: r.top + p[1] / 320 * r.height, pointerType: "mouse", bubbles: true } : { pointerType: "mouse" }));
        };
        const frame = (now: number) => {
            // czas klatki z requestAnimationFrame bywa wcześniejszy niż t0, więc nigdy nie schodzimy poniżej zera
            const t = Math.max(0, now - t0);
            if (t >= OUT + HOLD + BACK) { playing.current?.stop(); return; }
            const k = t < OUT ? ease(t / OUT) : t < OUT + HOLD ? 1 : 1 - ease((t - OUT - HOLD) / BACK);
            fire("pointermove", [p0[0] + (p1[0] - p0[0]) * k, p0[1] + (p1[1] - p0[1]) * k]);
            raf = requestAnimationFrame(frame);
        };
        playing.current = { stop: () => { cancelAnimationFrame(raf); fire("pointerleave"); playing.current = null; setPlaying(false); } };
        setPlaying(true);
        raf = requestAnimationFrame(frame);
    };

    const dec = (s: string) => (lang === "en" ? s : s.replace(".", ","));
    let stats: { k: string; v: string }[] = [];
    const m1 = /^(\d+) km\/h · ([\d.]+) m$/.exec(read), m2 = /^(\d+) mm( · lift)?$/.exec(read);
    if (m1) stats = [{ k: l("speed"), v: `${m1[1]} km/h` }, { k: l("stop"), v: `${dec(m1[2])} m` }];
    if (m2) stats = [{ k: l("centre"), v: `${Number(m2[1]).toLocaleString("de-DE")} mm` }, { k: l("state"), v: l(m2[2] ? "lifts" : "stands") }];

    return <figure className="hl-card">
        <div ref={ref} className="hl-stage" role="img" aria-label={x(data.hint)} />
        <div className="hl-read" aria-live="polite">
            {stats.length ? stats.map(s => <div key={s.k}><span>{s.k}</span><b className={/\d/.test(s.v) ? "" : "w"}>{s.v}</b></div>) : <p>{x(data.hint)}</p>}
        </div>
        <div className="hl-ctl">
            {data.choice && <div className="hl-seg" role="group" aria-label={x(data.choice.label)}>
                <span>{x(data.choice.label)}</span>
                {data.choice.values.map((v, i) => <button key={v} type="button" aria-pressed={v === value} className={v === value ? "on" : ""} onClick={() => setValue(v)}>{x(data.choice!.names[i])}</button>)}
            </div>}
            <button type="button" className="hl-play" onClick={togglePlay}>{l(isPlaying ? "stopPlay" : "play")}</button>
        </div>
        {data.legend?.length ? <ul className="hl-legend">{data.legend.map((g, i) => <li key={i}><Mark m={g.mark} />{x(g.text)}</li>)}</ul> : null}
        {x(data.note) && <figcaption className="hl-note">{x(data.note)}</figcaption>}
    </figure>;
}
