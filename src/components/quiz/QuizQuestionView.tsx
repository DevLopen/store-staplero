import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/seo/staplerQuiz.seo";
import QuizFigure from "./QuizFigure";

export interface QuizLabels {
    /** np. (n) => `${n} richtige Antwort${n > 1 ? "en" : ""}` */
    needCount: (n: number) => string;
    chooseHint: (n: number) => string;
    check: string;
    right: string;
    wrong: string;
    verdictRight: string;
    verdictWrong: string;
}


const shuffle = <T,>(arr: T[]) => {
    const a = [...arr];
    for (let j = a.length - 1; j > 0; j--) {
        const r = Math.floor(Math.random() * (j + 1));
        [a[j], a[r]] = [a[r], a[j]];
    }
    return a;
};

interface Props {
    question: QuizQuestion;
    labels: QuizLabels;
    /** Napis na przycisku po sprawdzeniu odpowiedzi ("Nächste Frage", "Ergebnis anzeigen"…) */
    nextLabel: string;
    onAnswered: (allRight: boolean) => void;
    onNext: () => void;
}

/**
 * Jedno pytanie: wybór odpowiedzi → "Antwort prüfen" → przy każdej odpowiedzi wyjaśnienie.
 * Kolor oznacza wyłącznie poprawność wyboru: zielony = trafione, przerywany zielony = pominięta
 * poprawna, czerwony = wybrana błędna. Rodzic powinien nadać `key={question.id}`.
 */
const QuizQuestionView = ({ question, labels, nextLabel, onAnswered, onNext }: Props) => {
    const order = useMemo(() => shuffle(question.answers.map((_, k) => k)), [question]);
    const need = question.answers.filter((a) => a.correct).length;
    const multi = need > 1;
    const [selected, setSelected] = useState<number[]>([]);
    const [checked, setChecked] = useState(false);

    const toggle = (k: number) => {
        if (checked) return;
        if (!multi) return setSelected([k]);
        setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : s.length < need ? [...s, k] : s));
    };

    const check = () => {
        const allRight = question.answers.every((a, k) => a.correct === selected.includes(k));
        setChecked(true);
        onAnswered(allRight);
    };

    const allRight = checked && question.answers.every((a, k) => a.correct === selected.includes(k));

    return (
        <div className="flex flex-1 flex-col">
            <h3 className="font-display text-2xl md:text-3xl font-bold leading-tight text-foreground text-balance mb-3">
                {question.q}
            </h3>
            <span className="inline-block self-start rounded-sm border border-primary px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-foreground mb-5">
                {labels.needCount(need)}
            </span>

            {question.figure && (
                <div className="mb-5 overflow-x-auto">
                    <QuizFigure figure={question.figure} />
                </div>
            )}

            <fieldset className="grid gap-2.5 mb-5">
                {/* Po sprawdzeniu werdykt zastępuje podpowiedź: "Das wussten Sie noch nicht:" prowadzi do wyjaśnień poniżej */}
                {checked ? (
                    <legend className={cn("font-display text-xl md:text-2xl font-bold leading-tight mb-2", allRight ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>
                        {allRight ? labels.verdictRight : labels.verdictWrong}
                    </legend>
                ) : (
                    <legend className="text-sm text-muted-foreground mb-2">{labels.chooseHint(need)}</legend>
                )}
                {order.map((k) => {
                    const a = question.answers[k];
                    const on = selected.includes(k);
                    const state = !checked ? (on ? "sel" : "") : a.correct ? (on ? "ok" : "miss") : on ? "wrong" : "";
                    return (
                        <label
                            key={k}
                            className={cn(
                                "grid grid-cols-[22px_1fr] gap-3 items-start rounded-md border-2 px-4 py-3 transition-colors",
                                checked ? "cursor-default" : "cursor-pointer hover:border-foreground/40",
                                state === "" && "border-border bg-background",
                                state === "sel" && "border-foreground bg-background",
                                state === "ok" && "border-success bg-success/10",
                                state === "miss" && "border-success border-dashed bg-background",
                                state === "wrong" && "border-destructive bg-destructive/10",
                            )}
                        >
                            <input
                                type={multi ? "checkbox" : "radio"}
                                name={`q-${question.id}`}
                                checked={on}
                                disabled={checked}
                                onChange={() => toggle(k)}
                                className="mt-1 h-[18px] w-[18px] accent-[hsl(var(--primary))]"
                            />
                            <span className="min-w-0 text-foreground">
                                {a.text}
                                {checked && (
                                    <span className="mt-1.5 block text-sm text-muted-foreground">
                                        <span className={cn("inline-flex items-center gap-1 font-semibold", a.correct ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}>
                                            {a.correct ? <Check className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
                                            {a.correct ? labels.right : labels.wrong}:
                                        </span>{" "}
                                        {a.why}
                                    </span>
                                )}
                            </span>
                        </label>
                    );
                })}
            </fieldset>

            <div>
                {checked ? (
                    <Button size="lg" onClick={onNext} autoFocus>{nextLabel}</Button>
                ) : (
                    <Button size="lg" variant="industrial" onClick={check} disabled={selected.length !== need}>{labels.check}</Button>
                )}
            </div>
        </div>
    );
};

export default QuizQuestionView;
