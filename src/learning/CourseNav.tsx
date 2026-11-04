import { Link } from "react-router-dom";
import { CourseOutline } from "./api";
import { Lang, tx } from "./types";
import { ui } from "./ui";

/** Boczna lista rozdziałów i tematów w lekcji (jak w zaakceptowanym demo). */
export default function CourseNav({ outline, lessonId, lang, step, draft, onPick }: {
    outline: CourseOutline; lessonId: string; lang: Lang; step: number; draft?: boolean; onPick?: () => void;
}) {
    const q = draft ? "?draft=1" : "";
    return (
        <nav className="cn" aria-label={ui("overview", lang)}>
            <div className="cn-hd">
                <Link to={`/lernen/${outline.id}${q}`} className="cn-back" onClick={onPick}>
                    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>{ui("overview", lang)}
                </Link>
                <b>{tx(outline.title, lang)}</b>
                {!draft && <Link to={`/lernen/${outline.id}/tests`} className="cn-back cn-tests" onClick={onPick}>
                    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M9 3h6v3H9zM8.5 13l2.5 2.5 4.5-5" /></svg>{ui("testsLink", lang)}
                </Link>}
            </div>
            {outline.chapters.map((c, i) => {
                const hasCur = c.lessons.some(l => l.id === lessonId);
                return (
                    <div key={c.id} className={`cn-ch ${c.locked ? "locked" : ""}`}>
                        <div className={`cn-ch-hd ${hasCur ? "act" : ""}`}><span className="n">{i + 1}</span><span>{tx(c.title, lang).replace(/&amp;/g, "&")}</span>{c.locked && <span className="cn-lock" title={ui("locked", lang)}><svg className="ic lock" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></span>}</div>
                        {!c.locked && <div className="cn-tops">{c.lessons.map(l => {
                            const p = outline.progress[l.id];
                            const cur = l.id === lessonId;
                            const cls = cur ? "cur" : p?.completed ? "done" : "";
                            return (
                                <Link key={l.id} to={`/lernen/${outline.id}/${l.id}${q}`} className={`cn-top ${cls}`} aria-current={cur ? "page" : undefined} onClick={onPick}>
                                    <span className="dot">{p?.completed && !cur && <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}</span>
                                    <span className="tt">{tx(l.title, lang)}{cur && <span className="sub">{ui("stepOf", lang, { a: step + 1, b: l.stepCount })}</span>}</span>
                                </Link>
                            );
                        })}</div>}
                    </div>
                );
            })}
        </nav>
    );
}
