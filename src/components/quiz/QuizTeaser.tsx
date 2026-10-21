import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/i18n/translations";
import { localizeQuestions, QUIZ_LABELS } from "@/i18n/staplerQuiz.i18n";
import { PAGE_PATH, TEASER_IDS } from "@/seo/staplerQuiz.seo";
import QuizQuestionView from "./QuizQuestionView";

// ─── Teksty sekcji ────────────────────────────────────────────────────────────

const UI: Record<Language, {
    eyebrow: string; title: string; titleHighlight: string; subtitle: string;
    facts: string[]; fullQuiz: string; book: string;
    counter: (i: number, n: number) => string; next: string; showResult: string;
    resultTitle: (score: number, n: number) => string; resultText: string; restart: string;
}> = {
    de: {
        eyebrow: "Kostenloser Staplerschein-Test",
        title: "Wie fit sind Sie",
        titleHighlight: "am Stapler?",
        subtitle: "So sehen die Fragen in unserer Theorieprüfung aus. Beantworten Sie drei Beispielfragen direkt hier, mit Erklärung nach jeder Antwort. Das komplette Quiz hat 20 Fragen.",
        facts: ["20 Fragen", "ca. 5 Minuten", "ohne Anmeldung"],
        fullQuiz: "Komplettes Quiz starten",
        book: "Kurstermine ansehen",
        counter: (i, n) => `Beispielfrage ${i} von ${n}`,
        next: "Nächste Frage",
        showResult: "Ergebnis anzeigen",
        resultTitle: (s, n) => `${s} von ${n} richtig.`,
        resultText: "Im kompletten Quiz warten noch 17 weitere Fragen, darunter eine Profi-Runde zu Tragfähigkeit, Lkw-Verladung und Treibgas.",
        restart: "Neu starten",
    },
    en: {
        eyebrow: "Free forklift licence test",
        title: "How fit are you",
        titleHighlight: "on a forklift?",
        subtitle: "This is what the questions in our theory exam look like. Answer three sample questions right here, with an explanation after each answer. The full quiz has 20 questions.",
        facts: ["20 questions", "approx. 5 minutes", "no sign-up"],
        fullQuiz: "Start the full quiz",
        book: "View course dates",
        counter: (i, n) => `Sample question ${i} of ${n}`,
        next: "Next question",
        showResult: "Show result",
        resultTitle: (s, n) => `${s} of ${n} correct.`,
        restart: "Restart",
        resultText: "The full quiz has 17 more questions, including an expert round on load capacity, truck loading and LPG.",
    },
    pl: {
        eyebrow: "Darmowy test na wózki widłowe",
        title: "Jak dobrze znasz",
        titleHighlight: "wózek widłowy?",
        subtitle: "Tak wyglądają pytania z naszego egzaminu teoretycznego. Odpowiedz tutaj na trzy przykładowe pytania, po każdej odpowiedzi zobaczysz wyjaśnienie. Pełny quiz ma 20 pytań.",
        facts: ["20 pytań", "ok. 5 minut", "bez rejestracji"],
        fullQuiz: "Rozwiąż pełny quiz",
        book: "Zobacz terminy kursów",
        counter: (i, n) => `Przykładowe pytanie ${i} z ${n}`,
        next: "Następne pytanie",
        showResult: "Pokaż wynik",
        resultTitle: (s, n) => `${s} z ${n} poprawnie.`,
        restart: "Od nowa",
        resultText: "W pełnym quizie czeka jeszcze 17 pytań, w tym runda dla profesjonalistów: udźwig, załadunek ciężarówki i gaz LPG.",
    },
    uk: {
        eyebrow: "Безкоштовний тест на права навантажувача",
        title: "Наскільки добре ви знаєте",
        titleHighlight: "навантажувач?",
        subtitle: "Так виглядають питання нашого теоретичного іспиту. Дайте відповідь на три приклади питань прямо тут, після кожної відповіді ви побачите пояснення. Повний тест містить 20 питань.",
        facts: ["20 питань", "бл. 5 хвилин", "без реєстрації"],
        fullQuiz: "Пройти повний тест",
        book: "Переглянути дати курсів",
        counter: (i, n) => `Приклад питання ${i} з ${n}`,
        next: "Наступне питання",
        showResult: "Показати результат",
        resultTitle: (s, n) => `${s} з ${n} правильно.`,
        restart: "Почати знову",
        resultText: "У повному тесті на вас чекають ще 17 питань, серед них професійний раунд: вантажопідйомність, завантаження вантажівки та зріджений газ.",
    },
};

/** Sekcja na stronie głównej: 3 przykładowe pytania + przejście do pełnego quizu i do kursów. */
const QuizTeaser = () => {
    const { language } = useLanguage();
    const ui = UI[language] ?? UI.de;
    const questions = localizeQuestions(language, TEASER_IDS);
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [done, setDone] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const next = () => {
        if (index === questions.length - 1) setDone(true);
        else setIndex(index + 1);
        // przewijamy tylko, gdy góra karty uciekła z ekranu (długie wyjaśnienia na telefonie)
        const top = cardRef.current?.getBoundingClientRect().top ?? 0;
        if (top < 0) cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const restart = () => { setIndex(0); setScore(0); setDone(false); };

    return (
        <section id="quiz" className="relative scroll-mt-16 overflow-hidden bg-industrial py-16 md:py-24">
            <div className="container mx-auto px-4">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 items-start">
                    {/* ── Tekst + CTA ── */}
                    <div className="lg:sticky lg:top-28">
                        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3">
                            {ui.eyebrow}
                        </span>
                        <h2 className="font-display text-4xl md:text-6xl font-extrabold text-primary-foreground mb-5">
                            {ui.title} <span className="text-gradient block">{ui.titleHighlight}</span>
                        </h2>
                        <p className="text-primary-foreground/80 mb-6 max-w-md">{ui.subtitle}</p>
                        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-primary-foreground/70 mb-8">
                            {ui.facts.map((f) => <li key={f}>{f}</li>)}
                        </ul>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 max-w-lg">
                            <Link to={PAGE_PATH}>
                                <Button variant="hero" size="lg" className="w-full">{ui.fullQuiz}<ArrowRight className="w-5 h-5" /></Button>
                            </Link>
                            <Link to="/kursy">
                                <Button size="lg" variant="outline" className="w-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:border-primary-foreground hover:bg-transparent">
                                    <CalendarCheck className="w-5 h-5" />{ui.book}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* ── Mini-quiz ── */}
                    <div ref={cardRef} className="scroll-mt-24 rounded-md bg-background" aria-live="polite">
                        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 md:px-6 text-sm text-muted-foreground">
                            <span>{done ? ui.resultTitle(score, questions.length) : ui.counter(index + 1, questions.length)}</span>
                        </div>
                        <div className="h-1.5 bg-border" aria-hidden>
                            <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${((done ? questions.length : index) / questions.length) * 100}%` }} />
                        </div>
                        {/* Wysokość według treści: pytania bez ilustracji mają podobną długość, karta rośnie tylko po sprawdzeniu odpowiedzi */}
                        <div className="flex flex-col px-4 py-6 md:px-8 md:py-8">
                            {!done ? (
                                <QuizQuestionView
                                    key={`${language}-${questions[index].id}`}
                                    question={questions[index]}
                                    labels={QUIZ_LABELS[language] ?? QUIZ_LABELS.de}
                                    nextLabel={index === questions.length - 1 ? ui.showResult : ui.next}
                                    onAnswered={(ok) => ok && setScore((s) => s + 1)}
                                    onNext={next}
                                />
                            ) : (
                                <div className="flex min-h-[460px] flex-col justify-center">
                                    <p className="font-display text-6xl font-extrabold text-foreground mb-3">{score}/{questions.length}</p>
                                    <p className="text-muted-foreground mb-6 max-w-lg">{ui.resultText}</p>
                                    <div className="flex flex-wrap gap-3">
                                        <Link to={PAGE_PATH}>
                                            <Button size="lg">{ui.fullQuiz}<ArrowRight className="w-5 h-5" /></Button>
                                        </Link>
                                        <Button size="lg" variant="outline" onClick={restart} aria-label={ui.restart}><RotateCcw className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default QuizTeaser;
