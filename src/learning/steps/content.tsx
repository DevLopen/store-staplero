import { Fragment } from "react";
import { IntroData, KeyPoint, LearnData, SummaryData, VideoData } from "../types";
import { Nav, usePlayer } from "../LessonPlayer";
import type { StepProps } from ".";
import { BLUEPRINT } from "../sims/people";

/** Kernpunkte: numery tylko, gdy kolejność ma znaczenie (`ordered`), inaczej neutralny znacznik. */
export function Points({ points, ordered }: { points: KeyPoint[]; ordered?: boolean }) {
    const { x } = usePlayer();
    return (
        <ul className="kp">
            {points.map((p, i) => (
                <li key={i}>
                    {ordered ? <span className="n">{i + 1}</span> : <span className="mark" aria-hidden="true" />}
                    <span>{x(p.k) && <b>{x(p.k)}</b>} {x(p.v)}</span>
                </li>
            ))}
        </ul>
    );
}

export function IntroStep({ data, last, finishLabel }: StepProps<IntroData>) {
    const { x, t } = usePlayer();
    return <>
        {data.image === "blueprint" ? <div className="hero-img" dangerouslySetInnerHTML={{ __html: BLUEPRINT }} />
            : data.image && <img className="hero-img" src={data.image} alt="" />}
        <div style={{ display: "grid", gap: 10 }}>
            <h1 className="h1">{x(data.title)}</h1>
            <p className="txt">{x(data.text)}</p>
        </div>
        {data.meta?.length ? <div className="meta">{data.meta.map((m, i) => <span key={i}>{x(m)}</span>)}</div> : null}
        <Nav label={last ? finishLabel : t("start")} />
    </>;
}

export function LearnStep({ data, last, finishLabel }: StepProps<LearnData>) {
    const { x, t } = usePlayer();
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <div className="learn">
            <p className="lead">{x(data.lead)}</p>
            {data.formula?.length ? (
                <div className="formula">{x(data.formula[0])} ={data.formula.slice(1).map((f, i) => <Fragment key={i}>{i ? " ×" : ""} <span>{x(f)}</span></Fragment>)}</div>
            ) : null}
            {data.compare?.length ? (
                <div className="cmp">{data.compare.map((c, i) => <div key={i}><span className="k">{x(c.label)}</span><b>{x(c.title)}</b><p>{x(c.text)}</p></div>)}</div>
            ) : null}
            <Points points={data.points} ordered={data.ordered} />
            {x(data.merke) && <div className="merke"><b>{t("merke")}</b>{x(data.merke)}</div>}
            {x(data.src) && <p className="src">{t("source")}: {x(data.src)}</p>}
        </div>
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

export function VideoStep({ data, last, finishLabel }: StepProps<VideoData>) {
    const { x, t } = usePlayer();
    return <>
        <h2 className="q">{x(data.title)}</h2>
        {data.url ? (
            <div className="video"><video src={data.url} poster={data.poster} controls playsInline preload="metadata" /></div>
        ) : <>
            <div className="video"><span className="tag">{t("videoSlot")}</span><div className="pl"><svg viewBox="0 0 10 12" width="20" height="20" fill="#fff" style={{ marginLeft: 3 }}><path d="M0 0l10 6-10 6z" /></svg></div></div>
            {x(data.brief) && <div className="todo"><b>{t("videoBrief")}</b><span>{x(data.brief)}</span>{x(data.length) && <span>{t("length", { l: x(data.length) })}</span>}</div>}
        </>}
        <Nav label={last ? finishLabel : undefined} />
    </>;
}

export function SummaryStep({ data, last, finishLabel }: StepProps<SummaryData>) {
    const { x } = usePlayer();
    return <>
        <h2 className="q">{x(data.title)}</h2>
        <Points points={data.points} ordered={data.ordered} />
        <Nav label={last ? finishLabel : undefined} />
    </>;
}
