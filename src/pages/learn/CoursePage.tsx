import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import LearnShell, { useLearnLang } from "@/learning/LearnShell";
import { useCourseOutline } from "@/learning/api";
import { Lang, tx } from "@/learning/types";
import { ui } from "@/learning/ui";

const T = {
    progress: { de: "Dein Fortschritt", en: "Your progress", pl: "Twój postęp", uk: "Твій прогрес" },
    topicsOf: { de: "{a} von {b} Themen", en: "{a} of {b} topics", pl: "{a} z {b} tematów", uk: "{a} з {b} тем" },
    resume:   { de: "Weiterlernen", en: "Continue", pl: "Kontynuuj", uk: "Продовжити" },
    start:    { de: "Kurs starten", en: "Start course", pl: "Rozpocznij kurs", uk: "Почати курс" },
    topics:   { de: "{n} Themen", en: "{n} topics", pl: "{n} tematów", uk: "{n} тем" },
    min:      { de: "{n} min", en: "{n} min", pl: "{n} min", uk: "{n} хв" },
    until:    { de: "Zugang bis {d}", en: "Access until {d}", pl: "Dostęp do {d}", uk: "Доступ до {d}" },
};
const LOC: Record<Lang, string> = { de: "de-DE", en: "en-GB", pl: "pl-PL", uk: "uk-UA" };
const f = (k: keyof typeof T, lang: Lang, v: Record<string, string | number> = {}) => T[k][lang].replace(/\{(\w+)\}/g, (_, x) => String(v[x] ?? ""));

// Przegląd kursu v2: /lernen/:courseId — postęp, rozdziały z tematami, „Weiterlernen”
export default function CoursePage() {
    const { courseId = "" } = useParams();
    const [sp] = useSearchParams();
    const draft = sp.get("draft") === "1";
    const lang = useLearnLang();
    const { data, error, isLoading } = useCourseOutline(courseId, draft);
    const [open, setOpen] = useState<string | null>(null);

    if (isLoading) return <LearnShell courseId={courseId} scroll><p className="small" style={{ padding: 24 }}>…</p></LearnShell>;
    if (error || !data) return <LearnShell courseId={courseId} scroll><div className="co-page"><h2 className="q">{(error as any)?.status === 403 ? "Kein Zugriff auf diesen Kurs" : "Kurs nicht gefunden"}</h2></div></LearnShell>;

    const lessons = data.chapters.flatMap(c => c.lessons);
    const done = lessons.filter(l => data.progress[l.id]?.completed).length;
    const pct = lessons.length ? Math.round(done / lessons.length * 100) : 0;
    const current = lessons.find(l => !data.progress[l.id]?.completed) ?? lessons[0];
    const curChapter = data.chapters.find(c => c.lessons.some(l => l.id === current?.id))?.id ?? null;
    const openId = open ?? curChapter;
    const q = draft ? "?draft=1" : "";

    return (
        <LearnShell courseId={courseId} courseTitle={tx(data.title, lang)} scroll>
            <div className="co-page">
                <div className="co-hd">
                    <div className="co-intro">
                        <h1 className="h1">{tx(data.title, lang)}</h1>
                        {tx(data.description, lang) && <p className="txt">{tx(data.description, lang)}</p>}
                    </div>
                    <div className="co-card co-stat">
                        <span className="co-lt">{f("progress", lang)}</span>
                        <b className="co-big">{pct} %</b>
                        <div className="co-bar"><i style={{ width: `${Math.max(2, pct)}%` }} /></div>
                        <span className="small">{f("topicsOf", lang, { a: done, b: lessons.length })}{data.expiresAt ? ` · ${f("until", lang, { d: new Date(data.expiresAt).toLocaleDateString(LOC[lang]) })}` : ""}</span>
                        {current && <Link className="btn btn-p" to={`/lernen/${courseId}/${current.id}${q}`} style={{ textDecoration: "none" }}>{f(done || data.progress[current.id] ? "resume" : "start", lang)}</Link>}
                    </div>
                </div>
                <div className="co-chapters">
                    {data.chapters.map((c, i) => {
                        const isOpen = openId === c.id;
                        const chDone = c.lessons.length > 0 && c.lessons.every(l => data.progress[l.id]?.completed);
                        return (
                            <div key={c.id} className={`co-card co-chap ${isOpen ? "open" : ""} ${chDone ? "done" : c.id === curChapter ? "cur" : ""}`}>
                                <button type="button" className="co-chap-hd" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? "" : c.id)}>
                                    <span className="n">{i + 1}</span>
                                    <span className="t"><b>{tx(c.title, lang).replace(/&amp;/g, "&")}</b><span>{f("topics", lang, { n: c.lessons.length })}</span></span>
                                    <svg className="ic chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                                </button>
                                {isOpen && <div className="co-lessons">{c.lessons.map(l => {
                                    const p = data.progress[l.id];
                                    const st = p?.completed ? "done" : l.id === current?.id ? "cur" : "";
                                    return (
                                        <Link key={l.id} to={`/lernen/${courseId}/${l.id}${q}`} className={`co-les ${st}`}>
                                            <span className="st">{st === "done" && <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}</span>
                                            <span className="t">{tx(l.title, lang)}</span>
                                            {l.durationMin ? <span className="d">{f("min", lang, { n: l.durationMin })}</span> : null}
                                        </Link>
                                    );
                                })}</div>}
                            </div>
                        );
                    })}
                </div>
                <Link to="/dashboard" className="small" style={{ textDecoration: "none" }}>← {ui("dashboard", lang)}</Link>
            </div>
        </LearnShell>
    );
}
