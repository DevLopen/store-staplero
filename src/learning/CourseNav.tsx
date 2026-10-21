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
            </div>
            {outline.chapters.map((c, i) => {
                const hasCur = c.lessons.some(l => l.id === lessonId);
                return (
                    <div key={c.id} className="cn-ch">
                        <div className={`cn-ch-hd ${hasCur ? "act" : ""}`}><span className="n">{i + 1}</span><span>{tx(c.title, lang).replace(/&amp;/g, "&")}</span></div>
                        <div className="cn-tops">{c.lessons.map(l => {
                            const p = outline.progress[l.id];
                            const cur = l.id === lessonId;
                            const cls = cur ? "cur" : p?.completed ? "done" : "";
                            return (
                                <Link key={l.id} to={`/lernen/${outline.id}/${l.id}${q}`} className={`cn-top ${cls}`} aria-current={cur ? "page" : undefined} onClick={onPick}>
                                    <span className="dot">{p?.completed && !cur && <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}</span>
                                    <span className="tt">{tx(l.title, lang)}{cur && <span className="sub">{ui("stepOf", lang, { a: step + 1, b: l.stepCount })}</span>}</span>
                                </Link>
                            );
                        })}</div>
                    </div>
                );
            })}
        </nav>
    );
}
