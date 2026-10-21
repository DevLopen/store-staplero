import { ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Lang, LANGS } from "./types";
import { ui } from "./ui";
import "./player.css";

export const useLearnLang = (): Lang => {
    const { language } = useLanguage();
    return (LANGS as readonly string[]).includes(language) ? (language as Lang) : "de";
};

const mobile = () => typeof window !== "undefined" && window.innerWidth < 900;

/** Wspólny pasek stron kursu v2: menu kursu, Übersicht / kurs, przełącznik języka.
 *  `sidebar` dostaje funkcję zamykającą, żeby na telefonie wybór tematu chował menu. */
export default function LearnShell({ courseId, courseTitle, children, scroll, sidebar }: {
    courseId: string; courseTitle?: string; children: ReactNode; scroll?: boolean; sidebar?: (close: () => void) => ReactNode;
}) {
    const { setLanguage } = useLanguage();
    const lang = useLearnLang();
    const [open, setOpen] = useState(() => !mobile());
    useEffect(() => {
        const r = () => { if (!mobile()) setOpen(true); };
        addEventListener("resize", r);
        return () => removeEventListener("resize", r);
    }, []);
    const close = () => { if (mobile()) setOpen(false); };
    return (
        <div className={`lp lp-page ${sidebar ? "has-side" : ""} ${sidebar && open ? "side-open" : ""}`}>
            <header className="lp-bar">
                {sidebar && (
                    <button type="button" className="lp-menu" aria-label={ui("menu", lang)} aria-expanded={open} onClick={() => setOpen(o => !o)}>
                        <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">{open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}</svg>
                    </button>
                )}
                <Link to="/dashboard" className="home" aria-label={ui("dashboard", lang)}>
                    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
                    <span>{ui("dashboard", lang)}</span>
                </Link>
                <span className="sep">/</span>
                <Link to={`/lernen/${courseId}`} className="course">{courseTitle ?? ui("overview", lang)}</Link>
                <div className="lp-lang" role="group" aria-label="Sprache">
                    {LANGS.map(l => <button key={l} type="button" aria-pressed={l === lang} onClick={() => setLanguage(l)}>{l.toUpperCase()}</button>)}
                </div>
            </header>
            <div className="lp-body">
                {sidebar && <aside className="lp-side">{sidebar(close)}</aside>}
                {sidebar && <div className="lp-scrim" onClick={() => setOpen(false)} />}
                <main className="lp-main" style={{ overflowY: scroll ? "auto" : undefined, background: scroll ? "#eceef1" : undefined }}>{children}</main>
            </div>
        </div>
    );
}
