import { useRef } from "react";
import { CasesData } from "../types";
import { Actions, Nav, usePlayer } from "../LessonPlayer";
import { personSVG } from "../sims/people";
import type { StepProps } from ".";

const Av = ({ look, cls = "" }: { look: CasesData["cases"][number]["look"]; cls?: string }) =>
    <div className={`av pic ${cls}`} dangerouslySetInnerHTML={{ __html: personSVG(look) }} />;
const T = {
    years: { de: "{name}, {age} Jahre", en: "{name}, {age} years", pl: "{name}, {age} lat", uk: "{name}, {age} років" },
    may: { de: "Darf {name} fahren?", en: "May {name} drive?", pl: "Czy {name} może jeździć?", uk: "Чи може {name} керувати?" },
    no: { de: "Darf nicht", en: "Not allowed", pl: "Nie może", uk: "Не можна" },
    yes: { de: "Darf fahren", en: "May drive", pl: "Może jeździć", uk: "Можна керувати" },
    noL: { de: "darf nicht", en: "not allowed", pl: "nie może", uk: "не можна" },
    yesL: { de: "darf fahren", en: "may drive", pl: "może jeździć", uk: "можна керувати" },
    caseOf: { de: "Fall {a} von {b}", en: "Case {a} of {b}", pl: "Przypadek {a} z {b}", uk: "Випадок {a} з {b}" },
    okName: { de: "{name} darf fahren.", en: "{name} may drive.", pl: "{name} może jeździć.", uk: "{name} може керувати." },
    noName: { de: "{name} darf nicht fahren.", en: "{name} may not drive.", pl: "{name} nie może jeździć.", uk: "{name} не може керувати." },
    answer: { de: "Deine Antwort: {a}", en: "Your answer: {a}", pl: "Twoja odpowiedź: {a}", uk: "Твоя відповідь: {a}" },
    more: { de: "mehr in Thema {n}", en: "more in topic {n}", pl: "więcej w temacie {n}", uk: "більше в темі {n}" },
    nextCase: { de: "Nächster Fall", en: "Next case", pl: "Następny przypadek", uk: "Наступний випадок" },
    toResult: { de: "Zur Auswertung", en: "See results", pl: "Do wyniku", uk: "До результату" },
    first: { de: "Ersten Fall ansehen", en: "Look at the first case", pl: "Zobacz pierwszy przypadek", uk: "Переглянути перший випадок" },
    result: { de: "Deine Einschätzung", en: "Your assessment", pl: "Twoja ocena", uk: "Твоя оцінка" },
    judged: { de: "richtig eingeschätzt", en: "assessed correctly", pl: "trafnie ocenione", uk: "оцінено правильно" },
    rightA: { de: "richtig beantwortet", en: "answered correctly", pl: "odpowiedź dobra", uk: "відповідь правильна" },
    wrongA: { de: "falsch beantwortet", en: "answered incorrectly", pl: "odpowiedź zła", uk: "відповідь неправильна" },
};
const ic = (ok: boolean) => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">{ok ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M6 6l12 12M18 6L6 18" />}</svg>;

/** Karty osób: przegląd → decyzja przy każdej (przycisk albo przesunięcie karty) → podsumowanie. Jeden krok lekcji. */
export function CasesStep({ data, last, finishLabel }: StepProps<CasesData>) {
    const { x, t, lang, useStepState, openSheet, closeSheet } = usePlayer();
    const f = (k: keyof typeof T, v: Record<string, string | number> = {}) => T[k][lang].replace(/\{(\w+)\}/g, (_, n) => String(v[n] ?? ""));
    const [st, setSt] = useStepState<{ i: number; answers: Record<number, boolean> }>({ i: -1, answers: {} });
    const cardRef = useRef<HTMLDivElement>(null);
    const drag = useRef({ on: false, sx: 0, dx: 0 });
    const n = data.cases.length;

    if (st.i < 0) return <>
        <h2 className="q">{x(data.title)}</h2>
        <p className="txt">{x(data.text)}</p>
        <div className="people">{data.cases.map(c => (
            <div key={c.name}><Av look={c.look} /><p><b>{f("years", { name: c.name, age: x(c.facts[0]?.v) })}</b><span>{x(c.role)}</span></p></div>
        ))}</div>
        {x(data.note) && <p className="small">{x(data.note)}</p>}
        <Actions><button className="btn btn-p" type="button" onClick={() => setSt(s => ({ ...s, i: 0 }))}>{f("first")}</button></Actions>
    </>;

    if (st.i >= n) {
        const right = data.cases.filter((c, i) => st.answers[i] === c.ok).length;
        return <>
            <h2 className="q">{f("result")}</h2>
            <div className="res-big"><b>{right} / {n}</b><span className="small">{f("judged")}</span></div>
            <div className="list">{data.cases.map((c, i) => {
                const a = st.answers[i];
                return (
                    <div className="li" key={c.name}><Av look={c.look} />
                        <div className="m"><b>{c.name}: {f(c.ok ? "yesL" : "noL")}</b><span>{x(c.rule)}</span></div>
                        {a !== undefined && <span className={`mk ${a === c.ok ? "ok" : "no"}`} title={f(a === c.ok ? "rightA" : "wrongA")}>{ic(a === c.ok)}</span>}
                    </div>
                );
            })}</div>
            <p className="small"><span className="mk ok inl">{ic(true)}</span> {f("rightA")} <span className="mk no inl">{ic(false)}</span> {f("wrongA")}</p>
            <Nav label={last ? finishLabel : undefined} />
        </>;
    }

    const c = data.cases[st.i];
    const decide = (yes: boolean) => {
        const ok = yes === c.ok;
        setSt(s => ({ ...s, answers: { ...s.answers, [s.i]: yes } }));
        openSheet({
            kind: ok ? "ok" : "no", title: t(ok ? "right" : "wrong"), sub: f("answer", { a: f(yes ? "yesL" : "noL") }),
            body: <><p><b>{f(c.ok ? "okName" : "noName", { name: c.name })}</b></p><p>{x(c.why)}</p>
                <p className="src">{x(c.src)}{c.topic ? ` · ${f("more", { n: c.topic })}` : ""}</p></>,
            button: f(st.i < n - 1 ? "nextCase" : "toResult"),
            onButton: () => { closeSheet(); setSt(s => ({ ...s, i: s.i + 1 })); },
        });
    };
    const el = () => cardRef.current;
    return <>
        <h2 className="q">{f("may", { name: c.name })}</h2>
        <div className="card" ref={cardRef}
            onPointerDown={e => { drag.current = { on: true, sx: e.clientX, dx: 0 }; el()?.classList.add("drag"); el()?.setPointerCapture(e.pointerId); }}
            onPointerMove={e => { if (!drag.current.on) return; drag.current.dx = e.clientX - drag.current.sx; const d = drag.current.dx; if (el()) el()!.style.transform = `translateX(${d * .7}px) rotate(${d / 40}deg)`; }}
            onPointerUp={() => { const d = drag.current; if (!d.on) return; d.on = false; el()?.classList.remove("drag"); if (el()) el()!.style.transform = ""; if (Math.abs(d.dx) > 90) decide(d.dx > 0); }}
            onPointerCancel={() => { drag.current.on = false; el()?.classList.remove("drag"); if (el()) el()!.style.transform = ""; }}>
            <div className="card-hd"><Av look={c.look} cls="lg" /><div><b>{c.name}</b><span>{x(c.role)}</span></div></div>
            <dl className="facts">{c.facts.map((r, k) => <div key={k}><dt>{x(r.k)}</dt><dd>{x(r.v)}</dd></div>)}</dl>
            <p className="say">{x(c.say)}</p>
        </div>
        <div className="swipe-tip"><span>← {f("noL")}</span><span>{f("caseOf", { a: st.i + 1, b: n })}</span><span>{f("yesL")} →</span></div>
        <Actions><div className="row-btn"><button className="btn btn-o" type="button" onClick={() => decide(false)}>{f("no")}</button><button className="btn btn-d" type="button" onClick={() => decide(true)}>{f("yes")}</button></div></Actions>
    </>;
}
