import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarCheck, Mail, Phone, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import QuizQuestionView from "@/components/quiz/QuizQuestionView";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizeQuestions, PAGE_TEXT, QUIZ_LABELS } from "@/i18n/staplerQuiz.i18n";
import { cn } from "@/lib/utils";
import { CONTACT, OG_IMAGE, PAGE_URL, QUESTIONS, SEO, buildJsonLd } from "@/seo/staplerQuiz.seo";

const GRUND_COUNT = QUESTIONS.filter((q) => q.round === "grund").length;
const PROFI_COUNT = QUESTIONS.length - GRUND_COUNT;

type Phase = "question" | "interlude" | "result";

const StaplerQuiz = () => {
    const { language } = useLanguage();
    const t = PAGE_TEXT[language] ?? PAGE_TEXT.de;
    const labels = QUIZ_LABELS[language] ?? QUIZ_LABELS.de;
    const questions = localizeQuestions(language);
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>("question");
    const [score, setScore] = useState(0);
    const [scoreGrund, setScoreGrund] = useState(0);
    const [missed, setMissed] = useState<string[]>([]);
    const panelRef = useRef<HTMLDivElement>(null);

    const question = questions[index];
    const isLast = index === QUESTIONS.length - 1;
    const profi = phase === "result" ? false : phase === "interlude" || question.round === "profi";

    const scrollToPanel = () => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    const onAnswered = (allRight: boolean) => {
        if (allRight) {
            setScore((s) => s + 1);
            if (question.round === "grund") setScoreGrund((s) => s + 1);
        } else {
            setMissed((m) => [...m, question.id]);
        }
    };

    const next = () => {
        if (isLast) setPhase("result");
        else {
            if (QUESTIONS[index + 1].round === "profi" && question.round === "grund") setPhase("interlude");
            setIndex(index + 1);
        }
        scrollToPanel();
    };

    const restart = () => {
        setIndex(0);
        setScore(0);
        setScoreGrund(0);
        setMissed([]);
        setPhase("question");
        scrollToPanel();
    };

    const progress = phase === "result" ? 100 : (index / QUESTIONS.length) * 100;
    const [resultTitle, resultLead] = score >= 18 ? t.results.strong : score >= 12 ? t.results.solid : t.results.weak;

    return (
        <div className="min-h-screen bg-background">
            <Seo title={SEO.title} description={SEO.description} url={PAGE_URL} image={OG_IMAGE} jsonLd={buildJsonLd()} />
            <Navbar />

            {/* ── Hero ─────────────────────────────────────────────────────── */}
            <section className="bg-industrial pt-24 pb-10 md:pt-28 md:pb-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">
                        {t.eyebrow}
                    </span>
                    <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary-foreground mb-5">
                        {t.h1} <span className="text-gradient block">{t.h1Highlight}</span>
                    </h1>
                    <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mb-6">
                        {t.lead(QUESTIONS.length)}
                    </p>
                    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-foreground/70">
                        {t.facts(GRUND_COUNT, PROFI_COUNT).map((f) => <li key={f}>{f}</li>)}
                    </ul>
                </div>
            </section>

            {/* ── Quiz ─────────────────────────────────────────────────────── */}
            <section className="py-10 md:py-14 bg-muted/50">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div ref={panelRef} className="scroll-mt-24 rounded-md border-2 border-foreground bg-background" aria-live="polite">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground px-4 py-3 md:px-6 text-sm">
                            <span className={cn("rounded-sm px-2 py-0.5 text-xs font-semibold uppercase tracking-wider",
                                profi ? "bg-primary text-[hsl(var(--on-primary))]" : "bg-foreground text-background")}>
                                {phase === "result" ? t.roundDone : profi ? t.roundPro : t.roundBasic}
                            </span>
                            <span className="text-muted-foreground">
                                {phase === "result" ? t.resultLabel : phase === "interlude" ? t.pause : t.counter(index + 1, QUESTIONS.length)}
                            </span>
                        </div>
                        <div className="h-1.5 bg-border" aria-hidden>
                            <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
                        </div>

                        <div className="px-4 py-6 md:px-8 md:py-8">
                            {phase === "question" && (
                                <QuizQuestionView
                                    key={`${language}-${question.id}`}
                                    question={question}
                                    labels={labels}
                                    nextLabel={isLast ? t.showResult : t.next}
                                    onAnswered={onAnswered}
                                    onNext={next}
                                />
                            )}

                            {phase === "interlude" && (
                                <div>
                                    <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground mb-3">
                                        {t.interludeTitle(scoreGrund, GRUND_COUNT)}
                                    </h2>
                                    <p className="text-muted-foreground max-w-xl mb-6">
                                        {t.interludeText(PROFI_COUNT)}
                                    </p>
                                    <Button size="lg" autoFocus onClick={() => { setPhase("question"); scrollToPanel(); }}>
                                        {t.startPro}
                                    </Button>
                                </div>
                            )}

                            {phase === "result" && (
                                <div>
                                    <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
                                        <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border-[10px] border-primary">
                                            <span className="font-display text-5xl font-extrabold leading-none text-foreground">{score}/{QUESTIONS.length}</span>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{t.correctWord}</span>
                                        </div>
                                        <div>
                                            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground mb-2">{resultTitle}</h2>
                                            <p className="text-muted-foreground">{resultLead}</p>
                                        </div>
                                    </div>

                                    {missed.length > 0 && (
                                        <div className="mt-8">
                                            <h3 className="font-display text-2xl font-bold text-foreground mb-2">{t.rememberTitle}</h3>
                                            <ul className="divide-y divide-border border-y border-border">
                                                {questions.filter((q) => missed.includes(q.id)).map((q) => (
                                                    <li key={q.id} className="py-3">
                                                        <span className="block font-semibold text-foreground">{q.q}</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {q.answers.filter((a) => a.correct).map((a) => a.text).join(" · ")}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="mt-8 rounded-md bg-industrial p-6 md:p-8">
                                        <h3 className="font-display text-2xl md:text-3xl font-bold uppercase text-primary-foreground mb-2">
                                            {t.ctaTitle}
                                        </h3>
                                        <p className="text-primary-foreground/80 mb-6 max-w-xl">
                                            {t.ctaText}
                                        </p>
                                        <div className="grid gap-3 sm:grid-cols-2 mb-6">
                                            <Link to="/kursy">
                                                <Button variant="hero" size="lg" className="w-full"><CalendarCheck className="w-5 h-5" />{t.ctaCourses}</Button>
                                            </Link>
                                            <Link to="/firmenschulung-berlin">
                                                <Button size="lg" variant="outline" className="w-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:border-primary-foreground hover:bg-transparent">
                                                    <Building2 className="w-5 h-5" />{t.ctaCompany}
                                                </Button>
                                            </Link>
                                        </div>
                                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                            <a href={`tel:${CONTACT.phone.href}`} className="inline-flex items-center gap-2 text-primary-foreground hover:text-primary">
                                                <Phone className="w-4 h-4 text-primary" />{CONTACT.phone.display}
                                            </a>
                                            <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2 text-primary-foreground hover:text-primary">
                                                <Mail className="w-4 h-4 text-primary" />{CONTACT.email}
                                            </a>
                                        </div>
                                    </div>

                                    <Button variant="outline" size="lg" className="mt-6" onClick={restart}>
                                        <RotateCcw className="w-4 h-4" />{t.restart}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── O szkoleniu + zastrzeżenie ─────────────────────────────── */}
            <section className="py-14 md:py-16 bg-background">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="grid gap-8 md:grid-cols-3">
                        {t.about.map((item) => (
                            <div key={item.title}>
                                <h3 className="font-display text-xl font-bold uppercase text-foreground mb-2">{item.title}</h3>
                                <p className="text-sm text-muted-foreground">{item.text}</p>
                            </div>
                        ))}
                    </div>
                    <p className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">{t.disclaimer}</p>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default StaplerQuiz;
