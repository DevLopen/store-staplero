import { ChoiceData, LText, QuestionData, SortData } from "../types";
import { Actions, Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from ".";
import { CAR_SVG, CHEF, DRIVER, FORKLIFT_SVG, personSVG } from "../sims/people";

const IL = {
    car: { de: "Auto", en: "Car", pl: "Samochód", uk: "Автомобіль" },
    carOk: { de: "Führerschein vorhanden", en: "Driving licence held", pl: "Prawo jazdy jest", uk: "Водійське посвідчення є" },
    fork: { de: "Gabelstapler", en: "Forklift", pl: "Wózek widłowy", uk: "Вилковий навантажувач" },
    forkQ: { de: "Darfst du ihn damit fahren?", en: "May you drive it with that?", pl: "Czy możesz nim z tym jeździć?", uk: "Чи можна з ним керувати навантажувачем?" },
    emp: { de: "Unternehmer", en: "Employer", pl: "Pracodawca", uk: "Роботодавець" },
    empS: { de: "Chef, Lager- oder Schichtleiter", en: "Boss, warehouse or shift manager", pl: "Szef, kierownik magazynu lub zmiany", uk: "Шеф, керівник складу чи зміни" },
    drv: { de: "Fahrer", en: "Driver", pl: "Kierowca", uk: "Водій" },
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
        {data.layout === "list" ? <>
            <div className="opts">{data.options.map((o, k) => (
                <button key={k} type="button" disabled={picked !== null} onClick={() => answer(k)}
                    className={`opt ${picked === null ? "" : k === data.correct ? "right" : k === picked ? "wrong" : ""}`}>{x(o)}</button>
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

export function ChoiceStep({ data, last, finishLabel }: StepProps<ChoiceData>) {
    const { x, t } = usePlayer();
    const { st, answer, advance, finished } = useSeq(data.items.length);
    if (finished) return <Result title={data.title} n={st.res.filter(Boolean).length} total={data.items.length} allRight={data.allRight} someWrong={data.someWrong} last={last} finishLabel={finishLabel} st={st} />;
    const it = data.items[st.i], a = st.answered;
    return <>
        <h2 className="q">{x(data.title)}</h2>
        {x(data.lead) && a === null && <p className="small">{x(data.lead)}</p>}
        <div className="say" style={{ fontSize: 17, fontWeight: 600 }}>{x(it.q)}</div>
        <div className="opts">{it.options.map((o, k) => (
            <button key={k} type="button" disabled={a !== null} onClick={() => answer(k)}
                className={`opt ${a === null ? "" : k === it.correct ? "right" : k === a ? "wrong" : ""}`}>{x(o)}</button>
        ))}</div>
        {a !== null && <div className={`fb ${a === it.correct ? "ok" : "no"}`} aria-live="polite"><b>{t(a === it.correct ? "right" : "notQuite")}</b><span>{x(it.why)}</span></div>}
        <Dots count={data.items.length} st={st} />
        {a === null
            ? <Nav disabled hint={t("chooseOne")} />
            : <Actions><button className="btn btn-p" type="button" onClick={() => advance(it.correct)}>{t(st.i < data.items.length - 1 ? "nextQ" : "results")}</button></Actions>}
    </>;
}
