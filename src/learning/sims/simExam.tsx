/** Egzamin końcowy: pytania ze wszystkich modułów, bez podpowiedzi w trakcie, wynik z progiem i wynikami według modułów (bez listy błędnych pytań). */
import { useEffect, useState } from "react";
import { ChoiceItem, LText, SimData } from "../types";
import { AnswerInput, isRight } from "../steps/answer";
import { Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from "../steps";
import { useSimText } from "./shared";
import "./tech.css";

type QItem = ChoiceItem & { topic: LText };
type St = { order: number[]; i: number; ans: Record<number, number>; started: number | null; done: boolean };
const shuffle = (n: number) => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export function FinalExamSim({ data, last, finishLabel }: StepProps<SimData>) {
    const { x, t, useStepState } = usePlayer();
    const T = useSimText(data);
    const items = (data.items ?? []) as QItem[];
    const pass = Number(data.passPercent ?? 80), minutes = Number(data.minutes ?? 45);
    const count = Math.min(items.length, Number(data.count ?? 50));
    const [st, setSt] = useStepState<St>({ order: [], i: 0, ans: {}, started: null, done: false });
    const [now, setNow] = useState(Date.now());
    useEffect(() => { if (!st.started || st.done) return; const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, [st.started, st.done]);
    const left = st.started ? Math.max(0, minutes * 60 - Math.floor(Math.max(0, now - st.started) / 1000)) : minutes * 60;
    useEffect(() => { if (st.started && !st.done && left === 0) setSt(s => ({ ...s, done: true })); }, [left]); // eslint-disable-line react-hooks/exhaustive-deps
    const start = () => {
        // losowanie warstwowe: po kolei z każdego modułu, żeby żaden temat nie zdominował egzaminu
        const groups: number[][] = [];
        const keyOf: Record<string, number> = {};
        shuffle(items.length).forEach(k => { const g = x(items[k].topic); if (keyOf[g] === undefined) { keyOf[g] = groups.length; groups.push([]); } groups[keyOf[g]].push(k); });
        const picked: number[] = [];
        for (let r = 0; picked.length < count && groups.some(g => g.length > r); r++) groups.forEach(g => { if (g[r] !== undefined && picked.length < count) picked.push(g[r]); });
        const order = picked.sort(() => Math.random() - 0.5);
        setSt({ order, i: 0, ans: {}, started: Date.now(), done: false });
    };

    if (!st.started) return <>
        <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
        <p className="small">{x(data.lead as LText)}</p>
        <div className="st-tiles">
            <div><b>{count}</b><span>{T("Fragen")}</span></div>
            <div><b>{minutes}</b><span>{T("Minuten")}</span></div>
            <div><b>{pass} %</b><span>{T("zum Bestehen")}</span></div>
        </div>
        <ul className="ex-rules">
            <li>{T("Während der Prüfung siehst du nicht, ob eine Antwort richtig ist.")}</li>
            <li>{T("Du kannst zurückblättern und Antworten ändern, bis du abgibst.")}</li>
            <li>{T("Danach siehst du dein Ergebnis und wie viele Fragen du in jedem Modul richtig hattest.")}</li>
            <li>{T("Bei jedem Versuch werden die Fragen neu ausgelost.")}</li>
        </ul>
        <button type="button" className="btn btn-d pk-go" onClick={start}>{T("Prüfung starten")}</button>
    </>;

    if (st.done) {
        const right = st.order.filter(k => isRight(items[k], st.ans[k])).length;
        const total = st.order.length, pct = Math.round(right / total * 100), ok = pct >= pass;
        const topics: { name: string; r: number; n: number }[] = [];
        [...st.order].sort((a, b) => a - b).forEach(k => { const name = x(items[k].topic); let tp = topics.find(z => z.name === name); if (!tp) topics.push(tp = { name, r: 0, n: 0 }); tp.n++; if (isRight(items[k], st.ans[k])) tp.r++; });
        return <>
            <h2 className="q" style={{ fontSize: 21 }}>{x(data.title)}</h2>
            <div className={`ex-res ${ok ? "ok" : "no"}`} aria-live="polite">
                <b>{pct} %</b>
                <span>{T(ok ? "Bestanden" : "Nicht bestanden")}</span>
                <small>{T("{r} von {n} Fragen richtig, nötig sind {p} %.", { r: right, n: total, p: pass })}</small>
            </div>
            <figure className="st-fig">
                <figcaption><b>{T("Ergebnis nach Modul")}</b><span>{T("Richtige Antworten")}</span></figcaption>
                <div className="st-bars">{topics.map(tp => (
                    <div key={tp.name} className="st-row" title={`${tp.name}: ${tp.r} / ${tp.n}`}>
                        <span className="st-l">{tp.name}</span>
                        <span className="st-track"><i style={{ width: `${tp.r / tp.n * 100}%`, background: "#2a78d6" }} /></span>
                        <span className="st-v">{tp.r} / {tp.n}</span>
                    </div>
                ))}</div>
            </figure>
            {!ok && <p className="small">{T("Lies die Module, in denen du schwach warst, noch einmal, bevor du die Prüfung wiederholst.")}</p>}
            <button type="button" className="btn btn-o pk-go" onClick={start}>{T("Prüfung wiederholen")}</button>
            <Nav label={last ? finishLabel : undefined} />
        </>;
    }

    const k = st.order[st.i], it = items[k], n = st.order.length;
    const answered = Object.keys(st.ans).length;
    const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");
    return <>
        <div className="ex-top">
            <span>{T("Frage {i} von {n}", { i: st.i + 1, n })}</span>
            <b className={left < 300 ? "warn" : ""} aria-label={T("Restzeit")}>{mm}:{ss}</b>
        </div>
        <div className="prog"><div className="bar"><i style={{ width: `${answered / n * 100}%` }} /></div><b>{answered} / {n}</b></div>
        <span className="ex-topic">{x(it.topic)}</span>
        <h2 className="q" style={{ fontSize: 19 }}>{x(it.q)}</h2>
        <AnswerInput key={k} it={it} value={st.ans[k]} seed={`${st.started}|${k}`} onChange={a => setSt(s => { const ans = { ...s.ans }; if (a === undefined) delete ans[k]; else ans[k] = a; return { ...s, ans }; })} />
        <div className="nav2 chk3-ans">
            <button type="button" className="btn btn-o" disabled={st.i === 0} onClick={() => setSt(s => ({ ...s, i: s.i - 1 }))}>{t("back")}</button>
            {st.i < n - 1
                ? <button type="button" className="btn btn-p" onClick={() => setSt(s => ({ ...s, i: s.i + 1 }))}>{T("Nächste Frage")}</button>
                : <button type="button" className="btn btn-p" onClick={() => setSt(s => ({ ...s, done: true }))}>{T("Abgeben")}</button>}
        </div>
        {st.i === n - 1 && answered < n && <p className="st-note">{T("Noch {n} Fragen ohne Antwort.", { n: n - answered })}</p>}
    </>;
}
