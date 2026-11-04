import { useCallback, useEffect, useRef, useState } from "react";
import { LText, SimData } from "../types";
import { Actions, Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from "../steps";
import { useNum, useSimText } from "./shared";
import { Attachment, MASTS, MastKind, mastState, PartId, top3D, TruckType, truckSVG } from "./forklift";
import { AnatomyScene, AttachScene, MastScene, S3, TruckStage, use3dUi } from "./lazy3d";
import "./tech.css";

const Tick = () => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const Up = () => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>;
const TiltF = () => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 20L14 5M14 5l-5 3M14 5l1 5.5" /></svg>;
const TiltB = () => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20L10 5M10 5l5 3M10 5L9 10.5" /></svg>;
const Down = () => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>;

/** Klik w rysunek: id najbliższego hotspotu ([data-k]). */

function Progress({ n, m, label }: { n: number; m: number; label: string }) {
    return <div className={`prog ${n >= m ? "done" : ""}`}><span>{label}</span><div className="bar"><i style={{ width: `${(n / Math.max(1, m)) * 100}%` }} /></div><b>{n} / {m}</b></div>;
}

/* ───────── budowa wózka: eksploracja i test „znajdź część” ───────── */
interface Part { id: PartId; name: LText; text: LText; src?: LText }
export function AnatomySim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x } = usePlayer();
    const T = useSimText(data);
    const parts = (data.parts ?? []) as Part[];
    if (data.mode === "find") return <FindParts data={data} parts={parts} last={last} finishLabel={finishLabel} />;
    return <Explore data={data} parts={parts} last={last} finishLabel={finishLabel} T={T} x={x} />;
}

function Explore({ data, parts, last, finishLabel, T, x }: { data: SimData; parts: Part[]; last: boolean; finishLabel?: string; T: ReturnType<typeof useSimText>; x: (l: LText | undefined) => string }) {
    const { useStepState } = usePlayer();
    const [st, setSt] = useStepState<{ seen: Record<string, boolean>; cur: PartId | null }>({ seen: {}, cur: null });
    const pick = (id: string | null) => { if (id && parts.some(p => p.id === id)) setSt(s => ({ seen: { ...s.seen, [id]: true }, cur: id as PartId })); };
    const ui = use3dUi();
    const cur = parts.find(p => p.id === st.cur);
    const names = Object.fromEntries(parts.map(p => [p.id, x(p.name)]));
    const n = parts.filter(p => st.seen[p.id]).length;
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <Progress n={n} m={parts.length} label={T(n >= parts.length ? "Alle Bauteile entdeckt" : "Entdeckt")} />
        <S3 cls="s3d-anat" fallback={ui.loading}>
            <AnatomyScene ids={parts.map(p => p.id)} st={{ seen: st.seen, cur: st.cur, hi: st.cur }} onPick={id => pick(id)} names={names} fly={st.cur}
                lift={Number(data.lift ?? 1000) / 1000} label={T("Seitenansicht eines Gabelstaplers mit Bauteilen")} hint={ui.hint} resetLabel={ui.resetLabel} />
        </S3>
        {cur ? (
            <div className="part" key={cur.id}><b>{x(cur.name)}</b><p>{x(cur.text)}</p>{x(cur.src) && <p className="src">{x(cur.src)}</p>}</div>
        ) : <div className="part empty">{T("Tippe auf einen orangefarbenen Punkt oder unten auf einen Namen.")}</div>}
        <div className="pchips">{parts.map(p => (
            <button key={p.id} type="button" className={`${st.seen[p.id] ? "seen" : ""} ${st.cur === p.id ? "on" : ""}`} onClick={() => pick(p.id)}><i />{x(p.name)}</button>
        ))}</div>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

function FindParts({ data, parts, last, finishLabel }: { data: SimData; parts: Part[]; last: boolean; finishLabel?: string }) {
    const { x, t, useStepState } = usePlayer();
    const T = useSimText(data);
    const order = ((data.find as string[] | undefined) ?? parts.map(p => p.id)).map(id => parts.find(p => p.id === id)!).filter(Boolean);
    const [st, setSt] = useStepState<{ i: number; res: boolean[]; picked: string | null }>({ i: 0, res: [], picked: null });
    const done = st.res.length === order.length;
    const target = order[Math.min(st.i, order.length - 1)];
    const answered = st.picked !== null;
    const ok = answered && st.picked === target.id;
    const ui = use3dUi();
    const all = parts.map(p => p.id);
    const names = Object.fromEntries(parts.map(p => [p.id, x(p.name)]));
    const tap = (id: string | null) => { if (!done && !answered && id) setSt(s => ({ ...s, picked: id })); };
    const advance = () => setSt(s => ({ i: s.i + 1, res: [...s.res, s.picked === target.id], picked: null }));
    if (done) {
        const n = st.res.filter(Boolean).length;
        return <>
            <h2 className="q">{x(data.title)}</h2>
            <div className="res-big"><b>{n} / {order.length}</b><span className="small">{t("correctOf")}</span></div>
            <p className="txt">{T(n === order.length ? "Alle Bauteile sicher gefunden." : "Schau dir die Bauteile, die du nicht gefunden hast, in Thema 2.1 noch einmal an.")}</p>
            <div className="qdots" aria-hidden="true">{st.res.map((r, k) => <i key={k} className={r ? "ok" : "no"} />)}</div>
            <Nav label={last ? finishLabel : undefined} />
        </>;
    }
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <div className="say" style={{ fontSize: 17, fontWeight: 600 }}>{T("Tippe auf: {name}", { name: x(target.name) })}</div>
        <S3 cls="s3d-anat" fallback={ui.loading}>
            <AnatomyScene ids={all} st={{ right: answered ? { [target.id]: true } : {}, wrong: answered && !ok ? st.picked : null, hi: answered ? target.id : null }} onPick={id => tap(id)} names={names}
                fly={answered ? target.id : null} lift={Number(data.lift ?? 1000) / 1000} label={T("Seitenansicht eines Gabelstaplers")} hint={ui.hint} resetLabel={ui.resetLabel} />
        </S3>
        {answered && <div className={`fb ${ok ? "ok" : "no"}`} aria-live="polite"><b>{t(ok ? "right" : "notQuite")}</b><span>{x(target.text)}</span></div>}
        <div className="qdots" aria-hidden="true">{order.map((_, k) => <i key={k} className={k < st.res.length ? (st.res[k] ? "ok" : "no") : k === st.i ? "cur" : ""} />)}</div>
        {answered
            ? <Actions><button className="btn btn-p" type="button" onClick={advance}>{t(st.i < order.length - 1 ? "nextQ" : "results")}</button></Actions>
            : <Nav disabled hint={T("Tippe auf einen Punkt im Bild")} />}
    </>;
}

/* ───────── maszt: podnoszenie, wolny skok, pochylenie ───────── */
interface MastState { kind: MastKind; lift: number; tilt: number; done: Record<string, boolean> }
const TILT_MIN = -8, TILT_MAX = 5;

/** Przycisk „trzymaj, żeby ruszać” jak dźwignia hydrauliki. Klik z klawiatury = jeden krok. */
export function Hold({ label, icon, onMove, onStep, disabled }: { label: string; icon: React.ReactNode; onMove: (dt: number) => boolean; onStep: () => void; disabled?: boolean }) {
    const [on, setOn] = useState(false);
    const raf = useRef(0), lastT = useRef(0), pointer = useRef(false);
    const stop = useCallback(() => { cancelAnimationFrame(raf.current); setOn(false); }, []);
    useEffect(() => stop, [stop]);
    const loop = (ts: number) => {
        const dt = lastT.current ? (ts - lastT.current) / 1000 : 0;
        lastT.current = ts;
        if (onMove(Math.min(dt, .05)) === false) { stop(); return; }
        raf.current = requestAnimationFrame(loop);
    };
    return <button type="button" className={`hold ${on ? "on" : ""}`} disabled={disabled}
        onPointerDown={e => { if (disabled) return; pointer.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); setOn(true); lastT.current = 0; raf.current = requestAnimationFrame(loop); }}
        onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}
        onClick={() => { if (pointer.current) { pointer.current = false; return; } onStep(); }}
        onContextMenu={e => e.preventDefault()}>{icon}{label}</button>;
}

export function MastSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data), num = useNum();
    const ceiling = data.ceiling ? Number(data.ceiling) : null;
    const [st, setSt] = useStepState<MastState>({ kind: "duplex", lift: 0, tilt: 0, done: {} });
    const ref = useRef(st); ref.current = st;
    const ms = mastState(st.kind, st.lift);
    const mm = (v: number) => `${num(Math.round(v / 10) * 10)} mm`;
    const ui = use3dUi();
    const topNow = top3D(st.kind, st.lift);
    const hit = !!ceiling && topNow >= ceiling;
    const tiltTx = `${st.tilt > 0 ? "+" : st.tilt < 0 ? "−" : ""}${num(Math.abs(Math.round(st.tilt)))}°`;
    const update = (patch: Partial<MastState>) => setSt(s => {
        const n = { ...s, ...patch };
        const m = mastState(n.kind, n.lift);
        const d = { ...s.done };
        if (!m.free && n.kind !== "simplex") d.ext = true;
        if (n.tilt <= TILT_MIN + .01) d.back = true;
        if (n.kind === "triplex" && n.lift >= 1200) d.triplex = true;
        return { ...n, done: d };
    });
    /** Ruch masztu z zatrzymaniem na stropie (nie da się przebić przeszkody). */
    const moveLift = (delta: number) => {
        const s = ref.current, max = MASTS[s.kind].max;
        const nl = Math.max(0, Math.min(max, s.lift + delta));
        if (delta > 0 && ceiling) {
            const hits = (l: number) => top3D(s.kind, l) >= ceiling;
            if (hits(nl)) {
                let lo = s.lift, hi = nl;
                for (let k = 0; k < 12; k++) { const m = (lo + hi) / 2; if (hits(m)) hi = m; else lo = m; }
                update({ lift: lo });
                return false;
            }
        }
        update({ lift: nl });
        return delta > 0 ? nl < max : delta < 0 ? nl > 0 : true;
    };
    const moveTilt = (delta: number) => {
        const s = ref.current, nt = Math.max(TILT_MIN, Math.min(TILT_MAX, s.tilt + delta));
        update({ tilt: Math.round(nt * 10) / 10 });
        return delta > 0 ? nt < TILT_MAX : delta < 0 ? nt > TILT_MIN : true;
    };
    const blocked = hit || (ceiling ? top3D(st.kind, st.lift + 5) >= ceiling : false);
    const phase = blocked && st.lift > 0 ? "hit" : st.lift === 0 ? "" : ms.free ? "free" : "ext";
    const phaseText = {
        "": T("Halte „Heben“ gedrückt und beobachte den Mast."),
        free: T(st.kind === "simplex" ? "Einfacher Mast: Der Gabelträger fährt im Mast hoch." : "Freihub: Nur der Gabelträger fährt hoch, die Bauhöhe bleibt gleich."),
        ext: T("Der Mast fährt aus: Die Bauhöhe wächst."),
        hit: T("Halt: Mast oder Last stößt an die Decke."),
    }[phase];
    const tasks = [
        { k: "ext", t: T("Heb die Gabel, bis der Mast ausfährt") },
        { k: "back", t: T("Neige den Mast ganz zurück") },
        ...(ceiling ? [{ k: "triplex", t: T("Mit Triplex: Heb die Palette über 1,2 m, ohne an die Decke zu stoßen") }] : []),
    ];
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        <div className="seg" role="group" aria-label={T("Mastart wählen")}>{(["simplex", "duplex", "triplex"] as MastKind[]).map(k => (
            <button key={k} type="button" aria-pressed={st.kind === k} onClick={() => update({ kind: k, lift: 0 })}>{T({ simplex: "Simplex", duplex: "Duplex", triplex: "Triplex" }[k])}</button>
        ))}</div>
        <S3 cls="s3d-mast" fallback={ui.loading}>
            <MastScene kind={st.kind} lift={st.lift} tilt={st.tilt} ceiling={ceiling} hit={blocked && st.lift > 0}
                tags={{ lift: `${T("Hubhöhe")} ${mm(st.lift)}`, top: `${T("Bauhöhe")} ${mm(topNow)}`, ceil: ceiling ? T("Decke {h} m", { h: num(ceiling / 1000) }) : undefined, topMm: topNow }}
                label={T("Gabelstapler mit Hubgerüst, Hubhöhe {h} Millimeter", { h: st.lift })} hint={ui.hint} resetLabel={ui.resetLabel} />
        </S3>
        <div className="mread"><span>{T("Neigung")} <b>{tiltTx}</b></span><span className="ex">{T("Beispielwerte")}</span></div>
        <div className={`phase ${phase}`} aria-live="polite"><i />{phaseText}</div>
        <div className="ctl">
            <div className="rocker" role="group" aria-label={T("Heben")}>
                <Hold label={T("Heben")} icon={<Up />} disabled={blocked || st.lift >= MASTS[st.kind].max} onMove={dt => moveLift(dt * 750)} onStep={() => moveLift(150)} />
                <Hold label={T("Senken")} icon={<Down />} disabled={st.lift <= 0} onMove={dt => moveLift(-dt * 900)} onStep={() => moveLift(-150)} />
            </div>
            <div className="rocker" role="group" aria-label={T("Neigen")}>
                <Hold label={T("Vor")} icon={<TiltF />} disabled={st.tilt >= TILT_MAX} onMove={dt => moveTilt(dt * 6)} onStep={() => moveTilt(1)} />
                <Hold label={T("Zurück")} icon={<TiltB />} disabled={st.tilt <= TILT_MIN} onMove={dt => moveTilt(-dt * 6)} onStep={() => moveTilt(-1)} />
            </div>
        </div>
        <div className="tasks">{tasks.map(k => <div key={k.k} className={st.done[k.k] ? "on" : ""}><span className="bx">{st.done[k.k] && <Tick />}</span>{k.t}</div>)}</div>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

/* ───────── typy wózków: karty przewijane w poziomie ───────── */
interface TypeCard { type: TruckType; name: LText; aka?: LText; what: LText; use: LText; note?: LText; lic: LText; licKind?: "extra" | "other" }
export function TypesSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data);
    const cards = (data.cards ?? []) as TypeCard[];
    const ui = use3dUi();
    const [st, setSt] = useStepState<{ cur: number; seen: Record<number, boolean> }>({ cur: 0, seen: { 0: true } });
    const deck = useRef<HTMLDivElement>(null);
    const onScroll = () => {
        const el = deck.current; if (!el) return;
        const mid = el.scrollLeft + el.clientWidth / 2;
        let i = 0, best = Infinity;
        [...el.children].forEach((c, k) => { const h = c as HTMLElement, d = Math.abs(h.offsetLeft - el.offsetLeft + h.offsetWidth / 2 - mid); if (d < best) { best = d; i = k; } });
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) i = cards.length - 1;
        if (i !== st.cur || !st.seen[i]) setSt(s => ({ cur: i, seen: { ...s.seen, [i]: true } }));
    };
    const go = (i: number) => {
        const el = deck.current; if (!el) return;
        const card = el.children[i] as HTMLElement | undefined;
        if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - 20, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        setSt(s => ({ cur: i, seen: { ...s.seen, [i]: true } }));
    };
    const n = Object.keys(st.seen).length;
    return <>
        <h2 className="q">{x(data.title)}</h2>
        {x(data.lead as LText) && <p className="small">{x(data.lead as LText)}</p>}
        <Progress n={n} m={cards.length} label={T(n >= cards.length ? "Alle Bauarten angesehen" : "Wische durch die Karten")} />
        <div className="deck" ref={deck} onScroll={onScroll} role="list">
            {cards.map((c, i) => (
                <article key={i} className={`tcard tk-${c.type}`} role="listitem" aria-label={x(c.name)}>
                    {i === st.cur ? <div className="tk3"><S3 cls="s3d-truck" fallback={<div dangerouslySetInnerHTML={{ __html: truckSVG(c.type, x(c.name)) }} />}><TruckStage type={c.type} label={x(c.name)} hint={ui.hint} /></S3></div>
                        : <div dangerouslySetInnerHTML={{ __html: truckSVG(c.type, x(c.name)) }} />}
                    <div className="tb">
                        <div className="tn2"><b>{x(c.name)}</b></div>
                        {x(c.aka) && <span className="aka">{x(c.aka)}</span>}
                        <dl>
                            <div><dt>{T("Merkmal")}</dt><dd>{x(c.what)}</dd></div>
                            <div><dt>{T("Einsatz")}</dt><dd>{x(c.use)}</dd></div>
                            {x(c.note) && <div><dt>{T("Achtung")}</dt><dd>{x(c.note)}</dd></div>}
                        </dl>
                        <span className={`lic ${c.licKind === "other" ? "no" : ""}`}>{x(c.lic)}</span>
                    </div>
                </article>
            ))}
        </div>
        <div className="dots">{cards.map((c, i) => <button key={i} type="button" aria-label={x(c.name)} className={`${i === st.cur ? "on" : ""} ${st.seen[i] ? "seen" : ""}`} onClick={() => go(i)} />)}</div>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

/* ───────── rozpoznaj typ po sylwetce ───────── */
interface IdItem { type: TruckType; options: LText[]; correct: number; why: LText }
export function IdentifySim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState } = usePlayer();
    const T = useSimText(data);
    const items = (data.items ?? []) as IdItem[];
    const ui = use3dUi();
    const [st, setSt] = useStepState<{ i: number; res: boolean[]; a: number | null }>({ i: 0, res: [], a: null });
    if (st.res.length === items.length) {
        const n = st.res.filter(Boolean).length;
        return <>
            <h2 className="q">{x(data.title)}</h2>
            <div className="res-big"><b>{n} / {items.length}</b><span className="small">{t("correctOf")}</span></div>
            <p className="txt">{x((n === items.length ? data.allRight : data.someWrong) as LText)}</p>
            <div className="qdots" aria-hidden="true">{st.res.map((r, k) => <i key={k} className={r ? "ok" : "no"} />)}</div>
            <Nav label={last ? finishLabel : undefined} />
        </>;
    }
    const it = items[st.i], a = st.a;
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <S3 cls="s3d-truck s3d-idf" fallback={<div className={`idf tk-${it.type}`} dangerouslySetInnerHTML={{ __html: truckSVG(it.type, T("Welche Bauart ist das?")) }} />}>
            <TruckStage key={st.i} type={it.type} label={T("Welche Bauart ist das?")} hint={ui.hint} />
        </S3>
        <div className="opts g2">{it.options.map((o, k) => (
            <button key={k} type="button" disabled={a !== null} onClick={() => setSt(s => ({ ...s, a: k }))}
                className={`opt ${a === null ? "" : k === it.correct ? "right" : k === a ? "wrong" : ""}`}>{x(o)}</button>
        ))}</div>
        {a !== null && <div className={`fb ${a === it.correct ? "ok" : "no"}`} aria-live="polite"><b>{t(a === it.correct ? "right" : "notQuite")}</b><span>{x(it.why)}</span></div>}
        <div className="qdots" aria-hidden="true">{items.map((_, k) => <i key={k} className={k < st.res.length ? (st.res[k] ? "ok" : "no") : k === st.i ? "cur" : ""} />)}</div>
        {a === null ? <Nav disabled hint={t("chooseOne")} />
            : <Actions><button className="btn btn-p" type="button" onClick={() => setSt(s => ({ i: s.i + 1, res: [...s.res, s.a === it.correct], a: null }))}>{t(st.i < items.length - 1 ? "nextQ" : "results")}</button></Actions>}
    </>;
}

/* ───────── osprzęt: zmiana udźwigu i kontrola przed użyciem ───────── */
interface Tool { id: Attachment; name: LText; effect: LText; w: number; e: number; d: number; c: number }
interface Check { t: LText; sub?: LText }
export function AttachSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, useStepState } = usePlayer();
    const T = useSimText(data), num = useNum();
    const tools = (data.tools ?? []) as Tool[];
    const checks = (data.checks ?? []) as Check[];
    const Q = Number(data.Q ?? 2500), C = Number(data.c ?? 500), A = Number(data.A ?? 450);
    const [st, setSt] = useStepState<{ tool: Attachment; seen: Record<string, boolean>; ok: Record<number, boolean> }>({ tool: "none", seen: {}, ok: {} });
    const tool = tools.find(tl => tl.id === st.tool);
    const M = Q * (A + C);
    const res = tool ? Math.max(0, Math.round((M - tool.w * (A + tool.e)) / (A + tool.d + tool.c) / 10) * 10) : Q;
    const load = st.tool === "extension" ? "long" : "pallet";
    const ui = use3dUi();
    const seenN = tools.filter(tl => st.seen[tl.id]).length, okN = checks.filter((_, i) => st.ok[i]).length;
    return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        <div className="tools" role="group" aria-label={T("Anbaugerät wählen")}>
            <button type="button" aria-pressed={st.tool === "none"} onClick={() => setSt(s => ({ ...s, tool: "none" }))}>{T("Nur Gabeln")}</button>
            {tools.map(tl => <button key={tl.id} type="button" className={st.seen[tl.id] ? "seen" : ""} aria-pressed={st.tool === tl.id} onClick={() => setSt(s => ({ ...s, tool: tl.id, seen: { ...s.seen, [tl.id]: true } }))}>{x(tl.name)}</button>)}
        </div>
        <S3 cls="s3d-att" fallback={ui.loading}>
            <AttachScene attach={st.tool} load={load} label={T("Gabelstapler mit Anbaugerät")} hint={ui.hint} resetLabel={ui.resetLabel} />
        </S3>
        <div className="cap" aria-live="polite">
            <div className="cap-top"><span>{T("Resttragfähigkeit")}</span><b>{num(res)}<small>kg</small></b></div>
            <div className="cap-bar"><i style={{ width: `${(res / Q) * 100}%` }} /><u style={{ left: `${(res / Q) * 100}%`, width: `${100 - (res / Q) * 100}%` }} /></div>
            <div className="cap-l"><span>{T("Beispielrechnung")}</span><span>{T("Nenntragfähigkeit {q} kg", { q: num(Q) })}</span></div>
            <p>{tool ? x(tool.effect) : T("Ohne Anbaugerät gilt das Lastschwerpunktdiagramm auf dem Typenschild des Staplers.")}</p>
        </div>
        <Progress n={seenN} m={tools.length} label={T("Anbaugeräte angesehen")} />
        {checks.length > 0 && <>
            <p className="small" style={{ fontWeight: 600, color: "var(--g900)" }}>{T("Vor dem Einsatz prüfst du:")}</p>
            <div className="ticks">{checks.map((c, i) => (
                <button key={i} type="button" aria-pressed={!!st.ok[i]} onClick={() => setSt(s => ({ ...s, ok: { ...s.ok, [i]: !s.ok[i] } }))}>
                    <span className="bx">{st.ok[i] && <Tick />}</span><span>{x(c.t)}{x(c.sub) && <small>{x(c.sub)}</small>}</span>
                </button>
            ))}</div>
            {okN === checks.length && <div className="mission done">{T("Geprüft. Jetzt darfst du mit dem Anbaugerät arbeiten.")}</div>}
        </>}
        <Nav label={last ? finishLabel : undefined} />
    </>;
}
