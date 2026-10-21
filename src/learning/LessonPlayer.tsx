import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Lang, Lesson, LText, tx } from "./types";
import { ui, UIKey } from "./ui";
import { StepView } from "./steps";
import "./player.css";

export interface SheetSpec {
    kind: "ok" | "no" | "neu";
    title: string;
    sub?: string;
    body: ReactNode;
    button: string;
    onButton?: () => void;              // domyślnie: zamknij panel
}

interface PlayerCtx {
    lang: Lang;
    t: (k: UIKey, vars?: Record<string, string | number>) => string;
    x: (t: LText | undefined) => string;
    stepIndex: number;
    stepCount: number;
    next: () => void;
    back: () => void;
    openSheet: (s: SheetSpec) => void;
    closeSheet: () => void;
    actionsEl: HTMLElement | null;
    /** Stan kroku, który przetrwa przejście dalej i powrót (np. udzielone odpowiedzi).
     *  `shared` = klucz wspólny dla kilku kroków (np. samoocena czytana później przez profil). */
    useStepState: <T>(init: T, shared?: string) => [T, (v: T | ((p: T) => T)) => void];
}
const Ctx = createContext<PlayerCtx | null>(null);
export const usePlayer = () => {
    const c = useContext(Ctx);
    if (!c) throw new Error("usePlayer outside LessonPlayer");
    return c;
};

const Chevron = ({ dir }: { dir: "l" | "r" }) => (
    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d={dir === "l" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} /></svg>
);
const Icon = ({ kind }: { kind: SheetSpec["kind"] }) => (
    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
        {kind === "ok" ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : kind === "no" ? <path d="M6 6l12 12M18 6L6 18" /> : <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>}
    </svg>
);

/** Przyciski akcji kroku, renderowane w dolnej strefie odtwarzacza. */
export function Actions({ children, hint }: { children: ReactNode; hint?: string }) {
    const { actionsEl } = usePlayer();
    if (!actionsEl) return null;
    return createPortal(<>{children}{hint ? <p className="gate-hint">{hint}</p> : null}</>, actionsEl);
}

/** Standardowa nawigacja: Zurück + Weiter (Weiter można wyłączyć z widoczną podpowiedzią). */
export function Nav({ label, disabled, hint, onNext }: { label?: string; disabled?: boolean; hint?: string; onNext?: () => void }) {
    const { t, next, back, stepIndex } = usePlayer();
    const nx = (
        <button className="btn btn-p" type="button" disabled={disabled} onClick={onNext ?? next}>
            {label ?? t("next")}<Chevron dir="r" />
        </button>
    );
    return (
        <Actions hint={disabled ? hint : undefined}>
            {stepIndex > 0
                ? <div className="nav2"><button className="btn btn-o" type="button" onClick={back}><Chevron dir="l" />{t("back")}</button>{nx}</div>
                : nx}
        </Actions>
    );
}

interface Props {
    lesson: Lesson;
    lang: Lang;
    title?: string;                     // nagłówek nad paskiem kroków, domyślnie tytuł tematu
    startStep?: number;
    onStep?: (i: number) => void;       // zapis postępu
    onFinish?: () => void;              // ostatni krok: „Weiter” na końcu tematu
    finishLabel?: string;
}

export default function LessonPlayer({ lesson, lang, title, startStep = 0, onStep, onFinish, finishLabel }: Props) {
    const steps = lesson.steps;
    const [step, setStep] = useState(() => Math.min(Math.max(0, startStep), Math.max(0, steps.length - 1)));
    const [dir, setDir] = useState(1);
    const [sheet, setSheet] = useState<SheetSpec | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [actionsEl, setActionsEl] = useState<HTMLElement | null>(null);
    const screenRef = useRef<HTMLDivElement>(null);
    const store = useRef(new Map<string, unknown>());
    const [, force] = useState(0);

    const closeSheet = useCallback(() => setSheetOpen(false), []);
    const go = useCallback((n: number) => {
        setSheetOpen(false);
        if (n < 0) return;
        if (n >= steps.length) { onFinish?.(); return; }
        setDir(n >= step ? 1 : -1);
        setStep(n);
    }, [steps.length, step, onFinish]);

    useEffect(() => { onStep?.(step); if (screenRef.current) screenRef.current.scrollTop = 0; }, [step]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        const k = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement).matches("input, textarea, select")) return;
            if (e.key === "Escape") setSheetOpen(false);
            if (e.key === "ArrowLeft" && step > 0) go(step - 1);
        };
        addEventListener("keydown", k);
        return () => removeEventListener("keydown", k);
    }, [go, step]);

    const current = steps[step];
    const ctx: PlayerCtx = {
        lang,
        t: (k, v) => ui(k, lang, v),
        x: t => tx(t, lang),
        stepIndex: step,
        stepCount: steps.length,
        next: () => go(step + 1),
        back: () => go(step - 1),
        openSheet: s => { setSheet(s); setSheetOpen(true); },
        closeSheet,
        actionsEl,
        useStepState: <T,>(init: T, shared?: string) => {
            const key = shared ? `shared:${shared}` : current?.id ?? "-";
            if (!store.current.has(key)) store.current.set(key, init);
            const set = (v: T | ((p: T) => T)) => {
                const prev = store.current.get(key) as T;
                store.current.set(key, typeof v === "function" ? (v as (p: T) => T)(prev) : v);
                force(n => n + 1);
            };
            return [store.current.get(key) as T, set];
        },
    };
    const last = step === steps.length - 1;

    return (
        <Ctx.Provider value={ctx}>
            <section className={`lp lp-lesson ${sheetOpen ? "sheet-open" : ""}`} lang={lang}>
                <div className="lp-top">
                    <div className="lp-row">
                        {step > 0 && <button className="lp-back" type="button" onClick={() => go(step - 1)}><Chevron dir="l" />{ui("back", lang)}</button>}
                        <div className="lp-title">{title ?? tx(lesson.title, lang)}</div>
                        <div className="lp-count">{step + 1} / {steps.length}</div>
                    </div>
                    <div className="lp-segs" aria-hidden="true">{steps.map((s, i) => <i key={s.id} className={i <= step ? "on" : ""} />)}</div>
                </div>
                <div className="lp-screen" ref={screenRef}>
                    {current && (
                        <div key={current.id} className={`lp-in ${dir < 0 ? "rev" : ""}`}>
                            <StepView step={current} last={last} finishLabel={finishLabel} />
                        </div>
                    )}
                </div>
                <div className="lp-actions" ref={setActionsEl} />
                <div className="lp-sheet-scrim" onClick={closeSheet} />
                <div className="lp-sheet" role="dialog" aria-live="polite" aria-hidden={!sheetOpen}>
                    {sheet && <>
                        <div className={`lp-sh-hd ${sheet.kind}`}><div className="bi"><Icon kind={sheet.kind} /></div><div><b>{sheet.title}</b>{sheet.sub && <span>{sheet.sub}</span>}</div></div>
                        <div className="lp-sh-body">{sheet.body}</div>
                        <div className="lp-sh-act"><button className="btn btn-p" type="button" onClick={sheet.onButton ?? closeSheet}>{sheet.button}</button></div>
                    </>}
                </div>
            </section>
        </Ctx.Provider>
    );
}
