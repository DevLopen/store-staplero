/**
 * Lernhilfe w lekcji: kursant zaznacza fragment karty („Nicht verstanden? Erklären”) albo pyta o całą kartę.
 * Odpowiedź przychodzi z POST /explain (model widzi tylko tę lekcję). Na desktopie panel stoi obok lekcji,
 * na telefonie wysuwa się od dołu. W krokach testu nie ma ani przycisku, ani zaznaczania (blokada też na serwerze).
 */
import { FormEvent, Fragment, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { explainStep, TutorAnswer, tutorCheck } from "./api";
import { Lang } from "./types";
import { ui, UIKey } from "./ui";

export interface TutorConfig { courseId: string; lessonId: string; draft?: boolean; left: number; limit: number }
/** Prośba o wyjaśnienie: `n` rośnie przy każdym kliknięciu, więc ten sam fragment można otworzyć ponownie. */
export interface TutorRequest { n: number; stepId: string; selection?: string; cardTitle?: string }

const Ic = ({ d, children }: { d?: string; children?: ReactNode }) => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">{d ? <path d={d} /> : children}</svg>;
const Spark = () => <Ic d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8z" />;

/** **pogrubienie** z odpowiedzi modelu, reszta jako zwykły tekst (bez HTML). */
const rich = (s: string) => s.split(/\*\*(.+?)\*\*/g).map((p, i) => i % 2 ? <b key={i}>{p}</b> : <Fragment key={i}>{p.replace(/\*\*/g, "")}</Fragment>);

/* ── przycisk przy zaznaczonym tekście ── */
export function TutorPop({ screenRef, enabled, lang, onExplain }: { screenRef: RefObject<HTMLDivElement>; enabled: boolean; lang: Lang; onExplain: (text: string) => void }) {
    const [pos, setPos] = useState<{ x: number; y: number; below: boolean; text: string } | null>(null);
    useEffect(() => {
        if (!enabled) { setPos(null); return; }
        const coarse = matchMedia("(pointer: coarse)").matches;
        let raf = 0;
        const update = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const el = screenRef.current, s = getSelection();
                const text = s?.toString().replace(/\s+/g, " ").trim() ?? "";
                if (!el || !s || !s.rangeCount || text.length < 3 || !el.contains(s.anchorNode) || (s.anchorNode as Element)?.parentElement?.closest("input, textarea, button")) { setPos(null); return; }
                const r = s.getRangeAt(0).getBoundingClientRect(), box = el.getBoundingClientRect();
                const x = Math.min(Math.max(r.left + r.width / 2 - box.left, 130), box.width - 130);
                // na telefonie systemowe menu zaznaczenia jest nad tekstem, więc przycisk idzie pod spód
                setPos({ x, y: (coarse ? r.bottom : r.top) - box.top + el.scrollTop, below: coarse, text: text.slice(0, 600) });
            });
        };
        document.addEventListener("selectionchange", update);
        return () => { document.removeEventListener("selectionchange", update); cancelAnimationFrame(raf); };
    }, [enabled, screenRef]);
    if (!pos) return null;
    return <button type="button" className={`tu-pop ${pos.below ? "below" : ""}`} style={{ left: pos.x, top: pos.y }}
        onMouseDown={e => e.preventDefault()}
        onClick={() => { const t = pos.text; setPos(null); getSelection()?.removeAllRanges(); onExplain(t); }}>
        <Spark />{ui("tutorExplain", lang)}
    </button>;
}

/* ── wiersz pod kartą ── */
export function TutorHelpRow({ lang, onAsk }: { lang: Lang; onAsk: () => void }) {
    return <div className="tu-row">
        <p><Ic><path d="M9 11l-5 5v3h3l5-5" /><path d="M14.5 3.5l6 6-8 8-6-6z" /></Ic><span><b>{ui("tutorHint", lang)}</b> {ui("tutorHintB", lang)}</span></p>
        <button type="button" className="tu-btn" onClick={onAsk}>
            <Ic><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5v.7" /><path d="M12 17h.01" /></Ic>{ui("tutorCard", lang)}
        </button>
    </div>;
}

/* ── panel rozmowy ── */
type Item =
    | { k: "quote"; label: string; text: string }
    | { k: "intro" }
    | { k: "me"; text: string }
    | { k: "ans"; a: TutorAnswer; ask: string }
    | { k: "err"; text: string };

export function TutorPanel({ cfg, lang, request, open, onClose }: { cfg: TutorConfig; lang: Lang; request: TutorRequest | null; open: boolean; onClose: () => void }) {
    const t = (k: UIKey, v?: Record<string, string | number>) => ui(k, lang, v);
    const [items, setItems] = useState<Item[]>([]);
    const [busy, setBusy] = useState(false);
    const [left, setLeft] = useState(cfg.left);
    const [input, setInput] = useState("");
    const bodyRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const reqRef = useRef<TutorRequest | null>(null);
    const [checks, setChecks] = useState<Record<string, number>>({});

    useEffect(() => setLeft(cfg.left), [cfg.left]);
    useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" }); }, [items, busy, checks]);

    const send = async (question: string, base: Item[], selection?: string) => {
        if (busy) return;
        const r = reqRef.current;
        if (!r) return;
        const history = base.flatMap(it => it.k === "ans" ? [{ q: it.ask, a: [...it.a.paragraphs, it.a.example].filter(Boolean).join(" ") }] : []);
        setBusy(true);
        try {
            const a = await explainStep(cfg.courseId, cfg.lessonId, { stepId: r.stepId, lang, selection: r.selection, question: question || undefined, history }, cfg.draft);
            setLeft(a.left);
            setItems(cur => [...cur, { k: "ans", a, ask: question || selection || r.cardTitle || "" }]);
        } catch (e) {
            const body = (e as { body?: { limit?: boolean; burst?: boolean; testLocked?: boolean; message?: string } }).body;
            if (body?.limit) setLeft(0);
            setItems(cur => [...cur, { k: "err", text: body?.limit ? t("tutorLimit") : body?.burst ? t("tutorBurst") : body?.testLocked ? body.message ?? t("tutorError") : t("tutorError") }]);
        } finally { setBusy(false); }
    };

    // nowa prośba = nowa rozmowa
    useEffect(() => {
        if (!request || request.n === reqRef.current?.n) return;
        reqRef.current = request;
        setChecks({});
        if (request.selection) {
            const base: Item[] = [{ k: "quote", label: t("tutorMarked"), text: request.selection }];
            setItems(base);
            if (left > 0) send("", base, request.selection); else setItems([...base, { k: "err", text: t("tutorLimit") }]);
        } else {
            setItems([{ k: "quote", label: t("tutorCardLb"), text: request.cardTitle || "" }, { k: "intro" }]);
            setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 350);
        }
    }, [request]); // eslint-disable-line react-hooks/exhaustive-deps

    const ask = (q: string) => {
        const text = q.trim().slice(0, 400);
        if (!text || busy || left <= 0) return;
        const base = items.filter(it => it.k !== "intro");
        const next: Item[] = [...base, { k: "me", text }];
        setItems(next);
        send(text, next);
    };
    const submit = (e: FormEvent) => { e.preventDefault(); ask(input); setInput(""); };

    const lastAns = [...items].reverse().find(it => it.k === "ans") as Extract<Item, { k: "ans" }> | undefined;
    const intro = items.some(it => it.k === "intro");

    return <aside className="tu-panel" aria-label={t("tutorTitle")} aria-hidden={!open}>
        <div className="tu-hd">
            <div className="t"><b>{t("tutorTitle")}</b><span>{t("tutorSub")}</span></div>
            <button type="button" className="tu-x" aria-label={t("close")} onClick={onClose}><Ic d="M6 6l12 12M18 6L6 18" /></button>
        </div>
        <div className="tu-body" ref={bodyRef} aria-live="polite">
            {items.map((it, i) => {
                if (it.k === "quote") return <div key={i} className="tu-quote"><small>{it.label}</small>{it.label === t("tutorMarked") ? `„${it.text}“` : it.text}</div>;
                if (it.k === "intro") return <p key={i} className="tu-intro">{t("tutorWhat")}</p>;
                if (it.k === "me") return <div key={i} className="tu-me">{it.text}</div>;
                if (it.k === "err") return <p key={i} className="tu-err">{it.text}</p>;
                const a = it.a, picked = checks[a.id];
                return <div key={i} className="tu-ans">
                    {a.paragraphs.map((p, j) => <p key={j} style={{ animationDelay: `${j * .25}s` }}>{rich(p)}</p>)}
                    {a.example && <div className="tu-ex" style={{ animationDelay: `${a.paragraphs.length * .25}s` }}><b>{t("tutorEx")}</b>{rich(a.example)}</div>}
                    {a.check && <div className="tu-check" style={{ animationDelay: `${(a.paragraphs.length + 1) * .25}s` }}>
                        <p>{t("tutorCheck")}: {a.check.q}</p>
                        <div className="opts">{a.check.options.map((o, j) => <button key={j} type="button" disabled={picked !== undefined}
                            className={picked === j ? (j === a.check!.correct ? "ok" : "no") : ""}
                            onClick={() => { setChecks(c => ({ ...c, [a.id]: j })); if (!cfg.draft) tutorCheck(cfg.courseId, a.id, j === a.check!.correct); }}>{o}</button>)}</div>
                        {picked !== undefined && <div className={`tu-fb ${picked === a.check.correct ? "ok" : "no"}`}><b>{t(picked === a.check.correct ? "right" : "wrong")}</b><span>{a.check.why}</span></div>}
                    </div>}
                </div>;
            })}
            {busy && <p className="tu-wait">{t("tutorWait")}</p>}
            {!busy && left > 0 && (intro || lastAns?.a.followups.length) ? <div className="tu-chips">
                {(intro ? [t("tutorS1"), t("tutorS2"), t("tutorS3")] : lastAns!.a.followups).map(c => <button key={c} type="button" onClick={() => ask(c)}>{c}</button>)}
            </div> : null}
        </div>
        <div className="tu-ft">
            <form className="tu-ask" onSubmit={submit}>
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} maxLength={400} placeholder={left > 0 ? t("tutorAsk") : t("tutorLimit")} disabled={left <= 0} autoComplete="off" />
                <button type="submit" aria-label={t("tutorSend")} disabled={!input.trim() || busy || left <= 0}><Ic d="M5 12h14M13 6l6 6-6 6" /></button>
            </form>
            <div className="tu-limit"><span>{t("tutorNote")}</span><span>{t("tutorLeft", { n: left })}</span></div>
        </div>
    </aside>;
}

/* ── jednorazowe przedstawienie funkcji (pierwsza otwarta lekcja kursanta na tym urządzeniu) ── */
const INTRO_KEY = "lp-tutor-intro-seen";
export const tutorIntroSeen = () => { try { return localStorage.getItem(INTRO_KEY) === "1"; } catch { return true; } };
export function TutorIntro({ lang, onClose }: { lang: Lang; onClose: () => void }) {
    const close = () => { try { localStorage.setItem(INTRO_KEY, "1"); } catch { /* bez pamięci pokaże się jeszcze raz */ } onClose(); };
    const Li = ({ k, children }: { k: UIKey; children: ReactNode }) => <li><Ic>{children}</Ic><span>{ui(k, lang)}</span></li>;
    return <div className="tu-intro-scrim" role="dialog" aria-modal="true" aria-labelledby="tu-intro-t">
        <div className="tu-intro-card">
            <div className="tu-demo" aria-hidden="true">
                <span className="pop"><Spark />{ui("tutorExplain", lang)}</span>
                <p><mark>{ui("tuDemoText", lang)}</mark></p>
                <div className="ans"><i /><i /><i /></div>
            </div>
            <h2 id="tu-intro-t">{ui("tuIntroT", lang)}</h2>
            <ul>
                <Li k="tuIntro1"><path d="M9 11l-5 5v3h3l5-5" /><path d="M14.5 3.5l6 6-8 8-6-6z" /></Li>
                <Li k="tuIntro2"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5v.7" /><path d="M12 17h.01" /></Li>
                <Li k="tuIntro3"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Li>
            </ul>
            <button type="button" className="btn btn-p" onClick={close} autoFocus>{ui("tuIntroOk", lang)}</button>
        </div>
    </div>;
}
