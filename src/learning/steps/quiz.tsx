import { permOf } from "../shuffle";
import { ChoiceData, LText, QuestionData, SortData } from "../types";
import { Actions, CheckResult, Nav, usePlayer } from "../LessonPlayer";
import { useState } from "react";
import type { StepProps } from ".";
import { CAR_SVG, CHEF, DRIVER, FORKLIFT_SVG, personSVG } from "../sims/people";
import { AnswerInput, isAnswered, isRight } from "./answer";

const IL = {
    car: { de: "Auto", en: "Car", pl: "Samochód", uk: "Автомобіль" },
    carOk: { de: "Führerschein vorhanden", en: "Driving licence held", pl: "Ma prawo jazdy", uk: "Водійське посвідчення є" },
    fork: { de: "Gabelstapler", en: "Forklift", pl: "Wózek widłowy", uk: "Вилковий навантажувач" },
    forkQ: { de: "Darfst du ihn damit fahren?", en: "Can you drive it with that?", pl: "Czy z tym dokumentem możesz jeździć wózkiem widłowym?", uk: "Чи можна з цим документом керувати навантажувачем?" },
    emp: { de: "Unternehmer", en: "Employer", pl: "Pracodawca", uk: "Роботодавець" },
    empS: { de: "Chef, Lager- oder Schichtleiter", en: "Boss, warehouse or shift manager", pl: "Szef, kierownik magazynu lub zmiany", uk: "Шеф, керівник складу чи зміни" },
    drv: { de: "Fahrer", en: "Driver", pl: "Operator", uk: "Водій" },
    drvS: { de: "du, mit Staplerschein", en: "you, with a forklift licence", pl: "ty, ze Staplerschein", uk: "ти, зі Staplerschein" },
};
function Illustration({ kind }: { kind: QuestionData["illustration"] }) {
    const { lang } = usePlayer();
    const l = (k: keyof typeof IL) => IL[k][lang];
    if (kind === "car-forklift") return (
        <div className="vs">
            <figure><div dangerouslySetInnerHTML={{ __html: CAR_SVG }} /><figcaption><b>{l("car")}</b><span className="tag-ok"><svg className="ic" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>{l("carOk")}</span></figcaption></figure>
            <figure><div dangerouslySetInnerHTML={{ __html: FORKLIFT_SVG }} /><figcaption><b>{l("fork")}</b><span className="tag-qt"><i>?</i>{l("forkQ")}</span></figcaption></figure>
        </div>
    );
    if (kind === "employer-driver") return (
        <div className="duo">
            <figure><div className="av pic" dangerouslySetInnerHTML={{ __html: personSVG(CHEF) }} /><figcaption><b>{l("emp")}</b><span>{l("empS")}</span></figcaption></figure>
            <figure><div className="av pic" dangerouslySetInnerHTML={{ __html: personSVG(DRIVER) }} /><figcaption><b>{l("drv")}</b><span>{l("drvS")}</span></figcaption></figure>
        </div>
    );
    return null;
}

/** Pytanie na start tematu: wybór, potem wyjaśnienie w panelu. Kolor panelu = poprawność odpowiedzi. */
export function QuestionStep({ data, last, finishLabel }: StepProps<QuestionData>) {
    const { x, t, openSheet, next, useStepState } = usePlayer();
    const [picked, setPicked] = useStepState<number | null>(null);
    const answer = (k: number) => {
        setPicked(k);
        const ok = k === data.correct;
        openSheet({
            kind: ok ? "ok" : "no",
            title: x(ok ? data.resultTitle?.right : data.resultTitle?.wrong) || t(ok ? "right" : "wrong"),
            sub: t("yourAnswer", { a: x(data.options[k]) }),
            body: <>
                {x(data.quote) && <blockquote>{x(data.quote)}</blockquote>}
                <p>{x(data.body)}</p>
                {x(data.src) && <p className="src">{x(data.src)}</p>}
            </>,
            button: x(data.button) || t("next"),
            onButton: next,
        });
    };
    return <>
        <h2 className="q">{x(data.title)}</h2>
        {data.illustration && <Illustration kind={data.illustration} />}
        {x(data.text) && <p className={data.layout === "list" ? "say" : "txt"}>{x(data.text)}</p>}
        {data.layout === "list" || data.options.length > 2 ? <>
            <div className="opts">{permOf(data.options.length, `${data.title.de ?? ""}`).map(k => (
                <button key={k} type="button" disabled={picked !== null} onClick={() => answer(k)}
                    className={`opt ${picked === null ? "" : k === data.correct ? "right" : k === picked ? "wrong" : ""}`}>{x(data.options[k])}</button>
            ))}</div>
            {picked === null ? <Nav disabled hint={t("chooseOne")} /> : <Nav label={last ? finishLabel : undefined} />}
        </> : (
            <Actions>
                <div className="row-btn">{data.options.map((o, k) => (
                    <button key={k} className={`btn ${k === data.options.length - 1 ? "btn-d" : "btn-o"}`} type="button" onClick={() => answer(k)}>{x(o)}</button>
                ))}</div>
            </Actions>
        )}
    </>;
}

interface SeqState { i: number; res: boolean[]; answered: number | null }

function Dots({ count, st }: { count: number; st: SeqState }) {
    return <div className="qdots" aria-hidden="true">{Array.from({ length: count }, (_, k) => (
        <i key={k} className={k < st.res.length ? (st.res[k] ? "ok" : "no") : k === st.i ? "cur" : ""} />
    ))}</div>;
}

function Result({ title, n, total, allRight, someWrong, last, finishLabel, st }: { title: LText; n: number; total: number; allRight: LText; someWrong: LText; last: boolean; finishLabel?: string; st: SeqState }) {
    const { x, t } = usePlayer();
    return <>
        <h2 className="q">{x(title)}</h2>
        <div className="res-big"><b>{n} / {total}</b><span className="small">{t("correctOf")}</span></div>
        <p className="txt">{x(n === total ? allRight : someWrong)}</p>
        <Dots count={total} st={st} />
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

/** Wspólny przebieg: pytanie po pytaniu, odpowiedź, uzasadnienie, „Nächste”, na końcu wynik. */
function useSeq(count: number) {
    const { useStepState } = usePlayer();
    const [st, setSt] = useStepState<SeqState>({ i: 0, res: [], answered: null });
    const answer = (k: number) => setSt(s => ({ ...s, answered: k }));
    const advance = (correct: number) => setSt(s => ({
        i: s.i < count - 1 ? s.i + 1 : s.i,
        res: [...s.res, s.answered === correct],
        answered: null,
    }));
    return { st, answer, advance, finished: st.res.length === count };
}

export function SortStep({ data, last, finishLabel }: StepProps<SortData>) {
    const { x, t } = usePlayer();
    const { st, answer, advance, finished } = useSeq(data.items.length);
    if (finished) return <Result title={data.title} n={st.res.filter(Boolean).length} total={data.items.length} allRight={data.allRight} someWrong={data.someWrong} last={last} finishLabel={finishLabel} st={st} />;
    const it = data.items[st.i], a = st.answered;
    return <>
        <h2 className="q">{x(data.title)}</h2>
        {x(data.lead) && a === null && <p className="small">{x(data.lead)}</p>}
        <div className={`stmt ${a === null ? "" : a === it.a ? "ok" : "no"}`}>{x(it.t)}</div>
        {a !== null && <div className={`fb ${a === it.a ? "ok" : "no"}`} aria-live="polite"><b>{t(a === it.a ? "right" : "notQuite")}: {x(data.labels[it.a])}</b><span>{x(it.why)}</span></div>}
        <Dots count={data.items.length} st={st} />
        <Actions>
            {a === null
                ? <div className="row-btn">{data.labels.map((l, k) => <button key={k} className={`btn ${k === data.labels.length - 1 ? "btn-d" : "btn-o"}`} type="button" onClick={() => answer(k)}>{x(l)}</button>)}</div>
                : <button className="btn btn-p" type="button" onClick={() => advance(it.a)}>{t(st.i < data.items.length - 1 ? "nextQ" : "results")}</button>}
        </Actions>
    </>;
}

/** Test modułu: losowy zestaw z puli przy każdym podejściu, bez podpowiedzi w trakcie, ocena na serwerze,
 *  na końcu tylko wynik (bez listy błędnych pytań, żeby nie uczyć się zestawu na pamięć). */
type GateSt = { attempt: number; seed: string; pick: number[]; i: number; ans: Record<number, number>; res: (CheckResult & { everPassed?: boolean }) | null };
const randomSeed = () => Math.random().toString(36).slice(2);
function drawGate(n: number, count: number, seed: string) { return permOf(n, `gate|${seed}`).slice(0, Math.min(n, count)); }
function GateCheck({ data, last, finishLabel }: StepProps<ChoiceData>) {
    const { x, t, useStepState, onCheck } = usePlayer();
    const items = data.items, pass = data.passPercent ?? 80, count = Math.min(items.length, data.count ?? items.length);
    const [seed0] = useState(randomSeed);
    const [st, setSt] = useStepState<GateSt>({ attempt: 0, seed: seed0, pick: drawGate(items.length, count, seed0), i: 0, ans: {}, res: null });
    const [sending, setSending] = useState(false);
    // stan zapisany przed wprowadzeniem losowania nie ma `pick`
    const pick = st.pick?.length === count && st.pick.every(k => k < items.length) ? st.pick : drawGate(items.length, count, st.seed ?? "0");
    const n = pick.length;
    const submit = async () => {
        const answers = items.map((_, k) => pick.includes(k) ? (st.ans[k] ?? -1) : -1);
        setSending(true);
        try {
            const res = onCheck ? await onCheck(answers) : (() => { const score = pick.filter(k => isRight(items[k], answers[k])).length, need = Math.ceil(n * pass / 100); return { score, total: n, need, passed: score >= need }; })();
            setSt(s => ({ ...s, res }));
        } finally { setSending(false); }
    };
    const retry = () => setSt(s => { const seed = randomSeed(); return { attempt: s.attempt + 1, seed, pick: drawGate(items.length, count, seed), i: 0, ans: {}, res: null }; });
    if (st.res) {
        const r = st.res, ok = r.passed || !!r.everPassed;
        return <>
            <h2 className="q">{x(data.title)}</h2>
            <div className={`ex-res ${r.passed ? "ok" : "no"}`} aria-live="polite">
                <b>{r.score} / {r.total}</b>
                <span>{r.passed ? t("gatePassed") : t("gateFailed", { n: r.need, m: r.total })}</span>
            </div>
            {!r.passed && <p className="small">{t("gateNew")}</p>}
            {!r.passed && <button type="button" className="btn btn-o pk-go" onClick={retry}>{t("gateRetry")}</button>}
            {ok ? <Nav label={last ? finishLabel : undefined} /> : <Nav disabled hint={t("gateHint")} />}
        </>;
    }
    const k = pick[st.i], it = items[k];
    return <>
        <h2 className="q">{x(data.title)}</h2>
        {st.i === 0 && <p className="small">{t("gateLead", { p: pass })}</p>}
        <div className="ex-top"><span>{t("qOf", { a: st.i + 1, b: n })}</span></div>
        <div className="say" style={{ fontSize: 17, fontWeight: 600 }}>{x(it.q)}</div>
        <AnswerInput key={k} it={it} value={st.ans[k]} seed={st.seed} onChange={a => setSt(s => { const ans = { ...s.ans }; if (a === undefined) delete ans[k]; else ans[k] = a; return { ...s, ans }; })} />
        <Actions><div className="nav2">
            <button type="button" className="btn btn-o" disabled={st.i === 0} onClick={() => setSt(s => ({ ...s, i: s.i - 1 }))}>{t("back")}</button>
            {st.i < n - 1
                ? <button type="button" className="btn btn-p" disabled={!isAnswered(it, st.ans[k])} onClick={() => setSt(s => ({ ...s, i: s.i + 1 }))}>{t("next")}</button>
                : <button type="button" className="btn btn-p" disabled={!isAnswered(it, st.ans[k]) || sending} onClick={submit}>{t(sending ? "gateSending" : "submit")}</button>}
        </div></Actions>
    </>;
}

export function ChoiceStep(props: StepProps<ChoiceData>) {
    if (props.data.gate) return <GateCheck {...props} />;
    return <PlainChoice {...props} />;
}
function PlainChoice({ data, last, finishLabel }: StepProps<ChoiceData>) {
    const { x, t } = usePlayer();
    // ćwiczenia w lekcjach mają zawsze jedną poprawną odpowiedź (pytania wielokrotnego wyboru są tylko w testach)
    const { st, answer, advance, finished } = useSeq(data.items.length);
    if (finished) return <Result title={data.title} n={st.res.filter(Boolean).length} total={data.items.length} allRight={data.allRight} someWrong={data.someWrong} last={last} finishLabel={finishLabel} st={st} />;
    const it = { ...data.items[st.i], correct: data.items[st.i].correct as number }, a = st.answered;
    return <>
        <h2 className="q">{x(data.title)}</h2>
        {x(data.lead) && a === null && <p className="small">{x(data.lead)}</p>}
        <div className="say" style={{ fontSize: 17, fontWeight: 600 }}>{x(it.q)}</div>
        <div className="opts">{permOf(it.options.length, `${it.q.de ?? ""}|${st.i}`).map(k => { const o = it.options[k]; return (
            <button key={k} type="button" disabled={a !== null} onClick={() => answer(k)}
                className={`opt ${a === null ? "" : k === it.correct ? "right" : k === a ? "wrong" : ""}`}>{x(o)}</button>
        ); })}</div>
        {a !== null && <div className={`fb ${a === it.correct ? "ok" : "no"}`} aria-live="polite"><b>{t(a === it.correct ? "right" : "notQuite")}</b><span>{x(it.why)}</span></div>}
        <Dots count={data.items.length} st={st} />
        {a === null
            ? <Nav disabled hint={t("chooseOne")} />
            : <Actions><button className="btn btn-p" type="button" onClick={() => advance(it.correct)}>{t(st.i < data.items.length - 1 ? "nextQ" : "results")}</button></Actions>}
    </>;
}
