import { Link, useParams } from "react-router-dom";
import Denied from "@/learning/Denied";
import LearnShell, { useLearnLang } from "@/learning/LearnShell";
import { useCourseOutline, useMyCourses } from "@/learning/api";
import { Lang, tx } from "@/learning/types";
import { ui } from "@/learning/ui";

// Widok samych testów kursanta: /lernen/:courseId/tests — testy modułów i egzamin końcowy z wynikiem, start od razu od pytań.
const T = {
    title:     { de: "Tests und Prüfung", en: "Tests and exam", pl: "Testy i egzamin", uk: "Тести та іспит" },
    lead:      { de: "Alle Modul-Checks und die Abschlussprüfung an einem Ort. Ein bestandener Modul-Check schaltet das nächste Modul frei.", en: "All module checks and the final exam in one place. Passing a module check unlocks the next module.", pl: "Wszystkie testy modułów i egzamin końcowy w jednym miejscu. Zaliczony test modułu odblokowuje kolejny moduł.", uk: "Усі тести модулів і підсумковий іспит в одному місці. Складений тест модуля відкриває наступний модуль." },
    passedOf:  { de: "{a} von {b} Modul-Checks bestanden", en: "{a} of {b} module checks passed", pl: "Zaliczone testy modułów: {a} z {b}", uk: "Складено тестів модулів: {a} з {b}" },
    progress:  { de: "Testfortschritt", en: "Test progress", pl: "Postęp testów", uk: "Прогрес тестів" },
    modules:   { de: "Modul-Checks", en: "Module checks", pl: "Testy modułów", uk: "Тести модулів" },
    exam:      { de: "Abschlussprüfung", en: "Final exam", pl: "Egzamin końcowy", uk: "Підсумковий іспит" },
    meta:      { de: "{n} Fragen · bestanden ab {p} %", en: "{n} questions · pass mark {p} %", pl: "{n} pytań · zaliczenie od {p} %", uk: "{n} питань · складено від {p} %" },
    metaExam:  { de: "{n} Fragen · {m} Minuten · bestanden ab {p} %", en: "{n} questions · {m} minutes · pass mark {p} %", pl: "{n} pytań · {m} minut · zaliczenie od {p} %", uk: "{n} питань · {m} хвилин · складено від {p} %" },
    passed:    { de: "Bestanden · {s} von {t}", en: "Passed · {s} of {t}", pl: "Zaliczony · {s} z {t}", uk: "Складено · {s} з {t}" },
    failed:    { de: "Noch nicht bestanden · bisher {s} von {t}", en: "Not passed yet · best {s} of {t}", pl: "Jeszcze niezaliczony · najlepiej {s} z {t}", uk: "Ще не складено · найкраще {s} з {t}" },
    open:      { de: "Noch nicht gemacht", en: "Not taken yet", pl: "Jeszcze nie rozwiązany", uk: "Ще не складався" },
    done:      { de: "Abgeschlossen", en: "Completed", pl: "Ukończony", uk: "Завершено" },
    lockedRow: { de: "Gesperrt, bis das vorherige Modul bestanden ist", en: "Locked until the previous module is passed", pl: "Zablokowany do zaliczenia poprzedniego modułu", uk: "Заблоковано, доки не складено попередній модуль" },
    start:     { de: "Test starten", en: "Start test", pl: "Rozpocznij test", uk: "Почати тест" },
    retry:     { de: "Wiederholen", en: "Retake", pl: "Powtórz", uk: "Повторити" },
    startExam: { de: "Prüfung starten", en: "Start exam", pl: "Rozpocznij egzamin", uk: "Почати іспит" },
    bank:      { de: "Fragenkatalog üben", en: "Practise the question catalogue", pl: "Ćwicz katalog pytań", uk: "Тренувати каталог питань" },
    bankTxt:   { de: "Alle Prüfungsfragen mit Lösungen, ohne Wertung.", en: "All exam questions with answers, not scored.", pl: "Wszystkie pytania egzaminacyjne z odpowiedziami, bez oceny.", uk: "Усі екзаменаційні питання з відповідями, без оцінки." },
    toCourse:  { de: "Zur Kursübersicht", en: "Course overview", pl: "Przegląd kursu", uk: "Огляд курсу" },
} satisfies Record<string, Record<Lang, string>>;
const f = (k: keyof typeof T, lang: Lang, v: Record<string, string | number> = {}) => T[k][lang].replace(/\{(\w+)\}/g, (_, x) => String(v[x] ?? ""));
const clean = (s: string) => s.replace(/&amp;/g, "&");

const CheckIc = <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const LockIc = <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
const ExamIc = <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M9 3h6v3H9zM8.5 13l2.5 2.5 4.5-5" /></svg>;
const CardsIc = <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h13a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM7 4h13a2 2 0 0 1 2 2v9M6.5 13.5h8M6.5 16.5h5" /></svg>;

export default function TestsPage() {
    const { courseId = "" } = useParams();
    const lang = useLearnLang();
    const { data, error, isLoading } = useCourseOutline(courseId);
    const my = useMyCourses();

    if (isLoading) return <LearnShell courseId={courseId} scroll><p className="small" style={{ padding: 24 }}>…</p></LearnShell>;
    if (error || !data) return <LearnShell courseId={courseId} scroll><Denied error={error} lang={lang} /></LearnShell>;

    const rows = data.chapters.map((c, i) => ({ c, i, t: c.test })).filter(r => r.t);
    const gates = rows.filter(r => r.t!.kind === "gate");
    const exam = rows.find(r => r.t!.kind === "exam");
    const prog = (id: string) => data.progress[id];
    const passed = gates.filter(r => prog(r.t!.lessonId)?.passed).length;
    const pct = gates.length ? Math.round(passed / gates.length * 100) : 0;
    const banks = (my.data ?? []).filter(c => c.kind === "bank");
    const href = (lessonId: string) => `/lernen/${courseId}/${lessonId}?test=1`;

    const examP = exam && prog(exam.t!.lessonId);
    return (
        <LearnShell courseId={courseId} courseTitle={tx(data.title, lang)} scroll>
            <div className="co-page ts-page">
                <div className="co-hd">
                    <div className="co-intro">
                        <h1 className="h1">{f("title", lang)}</h1>
                        <p className="txt">{f("lead", lang)}</p>
                    </div>
                    <div className="co-card co-stat">
                        <span className="co-lt">{f("progress", lang)}</span>
                        <b className="co-big">{passed} / {gates.length}</b>
                        <div className="co-bar"><i style={{ width: `${Math.max(2, pct)}%` }} /></div>
                        <span className="small">{f("passedOf", lang, { a: passed, b: gates.length })}</span>
                    </div>
                </div>

                {exam && <div className={`co-card ts-exam ${exam.c.locked ? "locked" : ""} ${examP?.completed ? "done" : ""}`}>
                    <span className="ts-ic">{ExamIc}</span>
                    <div className="t">
                        <b>{f("exam", lang)}</b>
                        <span>{f("metaExam", lang, { n: exam.t!.count, m: exam.t!.minutes ?? 45, p: exam.t!.passPercent })}</span>
                        <span className={`ts-res ${exam.c.locked ? "" : examP?.completed ? "ok" : ""}`}>
                            {exam.c.locked ? f("lockedRow", lang) : examP?.completed ? f("done", lang) : f("open", lang)}
                        </span>
                    </div>
                    {exam.c.locked
                        ? <span className="ts-lock" title={ui("locked", lang)}>{LockIc}</span>
                        : <Link className="btn btn-p" to={href(exam.t!.lessonId)}>{examP?.completed ? f("retry", lang) : f("startExam", lang)}</Link>}
                </div>}

                <section className="ts-sec">
                    <h2 className="co-lt">{f("modules", lang)}</h2>
                    <div className="co-card ts-list">
                        {gates.map(({ c, i, t }) => {
                            const p = prog(t!.lessonId);
                            const st = c.locked ? "locked" : p?.passed ? "done" : p?.total ? "fail" : "";
                            return (
                                <div key={c.id} className={`ts-row ${st}`}>
                                    <span className="n">{st === "done" ? CheckIc : i + 1}</span>
                                    <div className="t">
                                        <b>{clean(tx(c.title, lang))}</b>
                                        <span>{f("meta", lang, { n: t!.count, p: t!.passPercent })}</span>
                                        <span className={`ts-res ${st === "done" ? "ok" : st === "fail" ? "bad" : ""}`}>
                                            {st === "locked" ? f("lockedRow", lang)
                                                : st === "done" ? f("passed", lang, { s: p!.score ?? 0, t: p!.total ?? t!.count })
                                                    : st === "fail" ? f("failed", lang, { s: p!.score ?? 0, t: p!.total ?? t!.count })
                                                        : f("open", lang)}
                                        </span>
                                    </div>
                                    {st === "locked"
                                        ? <span className="ts-lock" title={ui("locked", lang)}>{LockIc}</span>
                                        : <Link className={`btn ${st === "done" ? "btn-o" : "btn-p"}`} to={href(t!.lessonId)}>{st === "done" || st === "fail" ? f("retry", lang) : f("start", lang)}</Link>}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {banks.length > 0 && <section className="ts-sec">
                    {banks.map(b => (
                        <Link key={b.id} to={`/lernen/fragen/${b.id}`} className="co-card ts-exam ts-bank">
                            <span className="ts-ic">{CardsIc}</span>
                            <div className="t"><b>{f("bank", lang)}</b><span>{f("bankTxt", lang)}</span></div>
                            <svg className="ic chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                        </Link>
                    ))}
                </section>}

                <Link to={`/lernen/${courseId}`} className="small" style={{ textDecoration: "none" }}>← {f("toCourse", lang)}</Link>
            </div>
        </LearnShell>
    );
}
