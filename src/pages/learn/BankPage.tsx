/**
 * Katalog pytań: nauka z odpowiedziami (płatny produkt). Start z postępem i tematami, potem runda pytań:
 * po odpowiedzi od razu widać, czy dobrze i która odpowiedź jest poprawna. Serwer sprawdza i zapisuje każdą odpowiedź.
 */
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import LearnShell, { useLearnLang } from "@/learning/LearnShell";
import { answerBank, BankQuestion, resetBank, submitBankTest, useBank } from "@/learning/api";
import { Lang, tx } from "@/learning/types";
import { permOf } from "@/learning/shuffle";
import "@/learning/player.css";
import "@/learning/bank.css";

type L4 = Record<Lang, string>;
const S = {
    title: { de: "Lernen mit Lösungen", en: "Learn with answers", pl: "Nauka z odpowiedziami", uk: "Навчання з відповідями" },
    lead: { de: "Beantworte eine Frage, danach siehst du sofort, ob es richtig war und welche Antwort stimmt.", en: "Answer a question and you immediately see whether you were right and which answer is correct.", pl: "Odpowiedz na pytanie, a od razu zobaczysz, czy dobrze, i która odpowiedź jest poprawna.", uk: "Дай відповідь на питання, і одразу побачиш, чи правильно, та яка відповідь правильна." },
    answered: { de: "Beantwortet", en: "Answered", pl: "Odpowiedziano", uk: "Відповіли" },
    right: { de: "Richtig", en: "Correct", pl: "Dobrze", uk: "Правильно" },
    toRepeat: { de: "Zu wiederholen", en: "To repeat", pl: "Do powtórki", uk: "Повторити" },
    start: { de: "Starten", en: "Start", pl: "Zacznij", uk: "Почати" },
    cont: { de: "Weiterlernen", en: "Continue", pl: "Ucz się dalej", uk: "Продовжити" },
    again: { de: "Alle noch einmal", en: "All again", pl: "Wszystkie jeszcze raz", uk: "Усі ще раз" },
    wrong: { de: "Fehler wiederholen ({n})", en: "Repeat mistakes ({n})", pl: "Powtórz błędy ({n})", uk: "Повторити помилки ({n})" },
    byTopic: { de: "Nach Thema", en: "By topic", pl: "Według tematu", uk: "За темою" },
    byTopicLead: { de: "Nur die Fragen eines Moduls üben.", en: "Practise only one module's questions.", pl: "Ćwicz tylko pytania z jednego modułu.", uk: "Тренуй лише питання одного модуля." },
    resetAll: { de: "Fortschritt zurücksetzen", en: "Reset progress", pl: "Wyzeruj postęp", uk: "Скинути прогрес" },
    resetSure: { de: "Alle Antworten löschen und von vorn beginnen?", en: "Delete all answers and start over?", pl: "Usunąć wszystkie odpowiedzi i zacząć od nowa?", uk: "Видалити всі відповіді й почати спочатку?" },
    yes: { de: "Ja, zurücksetzen", en: "Yes, reset", pl: "Tak, wyzeruj", uk: "Так, скинути" },
    cancel: { de: "Abbrechen", en: "Cancel", pl: "Anuluj", uk: "Скасувати" },
    qOf: { de: "Frage {a} von {b}", en: "Question {a} of {b}", pl: "Pytanie {a} z {b}", uk: "Питання {a} з {b}" },
    back: { de: "Übersicht", en: "Overview", pl: "Przegląd", uk: "Огляд" },
    pickN: { de: "Wähle {n} Antworten.", en: "Choose {n} answers.", pl: "Wybierz {n} odpowiedzi.", uk: "Обери {n} відповіді." },
    yourAnswer: { de: "Deine Antwort", en: "Your answer", pl: "Twoja odpowiedź", uk: "Твоя відповідь" },
    check: { de: "Prüfen", en: "Check", pl: "Sprawdź", uk: "Перевірити" },
    nextQ: { de: "Nächste Frage", en: "Next question", pl: "Następne pytanie", uk: "Наступне питання" },
    finish: { de: "Zur Übersicht", en: "To overview", pl: "Do przeglądu", uk: "До огляду" },
    isRight: { de: "Richtig", en: "Correct", pl: "Dobrze", uk: "Правильно" },
    isWrong: { de: "Leider falsch", en: "Unfortunately wrong", pl: "Niestety źle", uk: "На жаль, неправильно" },
    solution: { de: "Richtige Lösung: {v}", en: "Correct answer: {v}", pl: "Poprawna odpowiedź: {v}", uk: "Правильна відповідь: {v}" },
    multiSol: { de: "Grün markiert sind alle richtigen Antworten.", en: "All correct answers are marked green.", pl: "Na zielono zaznaczone są wszystkie poprawne odpowiedzi.", uk: "Зеленим позначено всі правильні відповіді." },
    tagRight: { de: "richtig", en: "correct", pl: "poprawna", uk: "правильна" },
    tagMissed: { de: "richtig, nicht gewählt", en: "correct, not chosen", pl: "poprawna, niewybrana", uk: "правильна, не обрана" },
    tagWrong: { de: "falsch", en: "wrong", pl: "błędna", uk: "неправильна" },
    doneTitle: { de: "Runde beendet", en: "Round finished", pl: "Runda zakończona", uk: "Раунд завершено" },
    doneText: { de: "{r} von {n} richtig.", en: "{r} of {n} correct.", pl: "{r} z {n} dobrze.", uk: "{r} з {n} правильно." },
    saveErr: { de: "Antwort konnte nicht gespeichert werden. Bitte erneut versuchen.", en: "The answer could not be saved. Please try again.", pl: "Nie udało się zapisać odpowiedzi. Spróbuj ponownie.", uk: "Не вдалося зберегти відповідь. Спробуй ще раз." },
    noAccess: { de: "Kein Zugriff auf diesen Fragenkatalog", en: "No access to this question bank", pl: "Brak dostępu do tego katalogu pytań", uk: "Немає доступу до цього каталогу питань" },
    testTitle: { de: "Test machen", en: "Take a test", pl: "Zrób test", uk: "Пройти тест" },
    testLead: { de: "Zufällige Fragen aus dem Katalog. Ob du richtig liegst, siehst du erst am Ende. Bestanden ab {p} %.", en: "Random questions from the catalogue. You only see whether you were right at the end. Pass mark {p} %.", pl: "Losowe pytania z katalogu. Czy odpowiedź jest dobra, zobaczysz dopiero na końcu. Zaliczenie od {p} %.", uk: "Випадкові питання з каталогу. Чи правильно, побачиш лише в кінці. Складено від {p} %." },
    howMany: { de: "Anzahl der Fragen", en: "Number of questions", pl: "Liczba pytań", uk: "Кількість питань" },
    allN: { de: "Alle ({n})", en: "All ({n})", pl: "Wszystkie ({n})", uk: "Усі ({n})" },
    module: { de: "Modul", en: "Module", pl: "Moduł", uk: "Модуль" },
    allModules: { de: "Alle Module", en: "All modules", pl: "Wszystkie moduły", uk: "Усі модулі" },
    startTest: { de: "Test starten", en: "Start test", pl: "Rozpocznij test", uk: "Почати тест" },
    history: { de: "Deine letzten Tests", en: "Your recent tests", pl: "Twoje ostatnie testy", uk: "Твої останні тести" },
    histRow: { de: "{r} von {n} richtig", en: "{r} of {n} correct", pl: "{r} z {n} dobrze", uk: "{r} з {n} правильно" },
    passed: { de: "Bestanden", en: "Passed", pl: "Zaliczony", uk: "Складено" },
    notPassed: { de: "Nicht bestanden", en: "Not passed", pl: "Niezaliczony", uk: "Не складено" },
    learnTitle: { de: "Lernen mit Lösungen", en: "Learn with answers", pl: "Nauka z odpowiedziami", uk: "Навчання з відповідями" },
    prev: { de: "Zurück", en: "Back", pl: "Wstecz", uk: "Назад" },
    next: { de: "Weiter", en: "Next", pl: "Dalej", uk: "Далі" },
    submit: { de: "Test abgeben", en: "Submit test", pl: "Oddaj test", uk: "Здати тест" },
    open: { de: "{n} Fragen noch offen. Offene Fragen zählen als falsch.", en: "{n} questions still open. Open questions count as wrong.", pl: "Bez odpowiedzi: {n}. Pytania bez odpowiedzi liczą się jako błędne.", uk: "Без відповіді: {n}. Вони зараховуються як неправильні." },
    quit: { de: "Test abbrechen", en: "Cancel test", pl: "Przerwij test", uk: "Перервати тест" },
    sending: { de: "Wird ausgewertet …", en: "Evaluating …", pl: "Sprawdzam …", uk: "Перевіряю …" },
    resultTitle: { de: "Testergebnis", en: "Test result", pl: "Wynik testu", uk: "Результат тесту" },
    resultText: { de: "{r} von {n} Fragen richtig, nötig sind {p} %.", en: "{r} of {n} questions correct, {p} % needed.", pl: "{r} z {n} pytań dobrze, potrzeba {p} %.", uk: "{r} з {n} питань правильно, потрібно {p} %." },
    byModule: { de: "Nach Modul", en: "By module", pl: "Według modułu", uk: "За модулем" },
    learnWrong: { de: "Fehler mit Lösungen ansehen ({n})", en: "Review mistakes with answers ({n})", pl: "Zobacz błędy z odpowiedziami ({n})", uk: "Переглянути помилки з відповідями ({n})" },
    newTest: { de: "Neuer Test", en: "New test", pl: "Nowy test", uk: "Новий тест" },
    activeUntil: { de: "Zugang aktiv bis {d}", en: "Access active until {d}", pl: "Dostęp aktywny do {d}", uk: "Доступ активний до {d}" },
    expired: { de: "Zugang abgelaufen am {d}", en: "Access expired on {d}", pl: "Dostęp wygasł {d}", uk: "Доступ закінчився {d}" },
    expiredText: { de: "Ihr Zugang zu diesem Fragenkatalog ist abgelaufen. Sie können ihn im Shop erneut kaufen.", en: "Your access to this question catalogue has expired. You can buy it again in the shop.", pl: "Dostęp do tego katalogu pytań wygasł. Możesz kupić go ponownie w sklepie.", uk: "Доступ до цього каталогу питань закінчився. Його можна знову придбати в магазині." },
    toShop: { de: "Zum Shop", en: "To the shop", pl: "Do sklepu", uk: "До магазину" },
    toPanel: { de: "Zum Kundenbereich", en: "To my account", pl: "Do panelu", uk: "До кабінету" },
    notFound: { de: "Fragenkatalog nicht gefunden", en: "Question bank not found", pl: "Nie znaleziono katalogu pytań", uk: "Каталог питань не знайдено" },
} satisfies Record<string, L4>;

const maskOf = (ks: number[]) => ks.reduce((m, k) => m | (1 << k), 0);
const LOC: Record<Lang, string> = { de: "de-DE", en: "en-GB", pl: "pl-PL", uk: "uk-UA" };
const COUNTS = [10, 20, 30];
const shuffled = <T,>(a: T[]) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
type Pick = number[] | string;
type Test = { ids: string[]; i: number; picks: Record<string, Pick>; topic?: string; sending: boolean; err: boolean };
type TestResult = { n: number; right: number; passed: boolean; results: Record<string, boolean>; passPercent: number };
type Round = { ids: string[]; i: number; sel: number[]; num: string; checked: boolean; ok: boolean; results: Record<string, boolean>; saving: boolean; err: boolean };

export default function BankPage() {
    const { bankId = "" } = useParams();
    const lang = useLearnLang();
    const T = (k: keyof typeof S, v: Record<string, string | number> = {}) => (S[k][lang] ?? S[k].de).replace(/\{(\w+)\}/g, (_, x) => String(v[x]));
    const { data, isLoading, error } = useBank(bankId);
    const qc = useQueryClient();
    const [round, setRound] = useState<Round | null>(null);
    const [confirm, setConfirm] = useState(false);
    const [count, setCount] = useState<number>(20);
    const [topicSel, setTopicSel] = useState("");
    const [test, setTest] = useState<Test | null>(null);
    const [result, setResult] = useState<TestResult | null>(null);
    const answers = data?.answers ?? {};
    const qs = data?.questions ?? [];
    const byId = useMemo(() => Object.fromEntries(qs.map(q => [q.id, q])), [qs]);

    if (isLoading) return <LearnShell courseId={bankId} homeHref={`/lernen/fragen/${bankId}`} scroll><p className="small" style={{ padding: 24 }}>…</p></LearnShell>;
    const fmt = (d: string | Date) => new Date(d).toLocaleDateString(LOC[lang], { day: "numeric", month: "long", year: "numeric" });
    if (error || !data) {
        const e = error as any;
        if (e?.body?.expired) return <LearnShell courseId={bankId} homeHref={`/lernen/fragen/${bankId}`} scroll><div className="bk">
            <section className="bk-card bk-done"><h2 className="q">{T("expired", { d: fmt(e.body.expiredAt) })}</h2><p className="small">{T("expiredText")}</p>
                <div className="bk-acts" style={{ justifyContent: "center" }}><Link className="btn btn-p" to="/schulungen">{T("toShop")}</Link><Link className="btn btn-o" to="/dashboard#kurse">{T("toPanel")}</Link></div></section>
        </div></LearnShell>;
        return <LearnShell courseId={bankId} homeHref={`/lernen/fragen/${bankId}`} scroll><div className="bk"><h2 className="q">{T(e?.status === 403 ? "noAccess" : "notFound")}</h2></div></LearnShell>;
    }

    const ans = qs.filter(q => answers[q.id]).length, ok = qs.filter(q => answers[q.id]?.ok).length, no = ans - ok;
    const nextIds = (topic?: string) => { const pool = qs.filter(q => !topic || q.topic === topic); const un = pool.filter(q => !answers[q.id]); return (un.length ? un : pool).map(q => q.id); };
    const wrongIds = () => qs.filter(q => answers[q.id] && !answers[q.id].ok).map(q => q.id);
    const start = (ids: string[]) => { if (ids.length) { setRound({ ids, i: 0, sel: [], num: "", checked: false, ok: false, results: {}, saving: false, err: false }); window.scrollTo(0, 0); } };
    const shell = (children: React.ReactNode) => <LearnShell courseId={bankId} courseTitle={tx(data.title, lang)} homeHref={`/lernen/fragen/${bankId}`} scroll>{children}</LearnShell>;

    const passP = data.passPercent ?? 80;
    const topicTitle = (k?: string) => { const t = data.topics.find(x => x.key === k); return t ? tx(t.title, lang) : ""; };
    const poolFor = (topic: string) => qs.filter(q => !topic || q.topic === topic);
    const startTest = () => {
        const pool = poolFor(topicSel);
        const n = count === 0 ? pool.length : Math.min(count, pool.length);
        if (!n) return;
        setResult(null); setRound(null);
        setTest({ ids: shuffled(pool.map(q => q.id)).slice(0, n), i: 0, picks: {}, topic: topicSel || undefined, sending: false, err: false });
        window.scrollTo(0, 0);
    };

    /* ── test: odpowiedzi bez podpowiedzi, ocena na końcu ── */
    if (test) {
        const tq = byId[test.ids[test.i]];
        const answerOf = (q: BankQuestion, pk?: Pick): number => {
            if (pk === undefined || pk === "" || (Array.isArray(pk) && !pk.length)) return -1;
            if (q.num !== undefined && q.num !== null) return Number(pk);
            return q.c.length > 1 ? maskOf(pk as number[]) : (pk as number[])[0];
        };
        const done = (q: BankQuestion) => {
            const v = test.picks[q.id];
            if (q.num !== undefined && q.num !== null) return typeof v === "string" && v !== "";
            return Array.isArray(v) && (q.c.length > 1 ? v.length === q.c.length : v.length === 1);
        };
        const openN = test.ids.filter(id => byId[id] && !done(byId[id])).length;
        const last = test.i === test.ids.length - 1;
        const go = (d: number) => { setTest(t => t && { ...t, i: Math.max(0, Math.min(t.ids.length - 1, t.i + d)) }); window.scrollTo(0, 0); };
        const send = async () => {
            setTest(t => t && { ...t, sending: true, err: false });
            const answers = Object.fromEntries(test.ids.filter(id => byId[id]).map(id => [id, answerOf(byId[id], test.picks[id])]));
            try {
                const r = await submitBankTest(bankId, answers, test.topic);
                setResult({ n: r.n, right: r.right, passed: r.passed, results: r.results, passPercent: r.passPercent });
                setTest(null); window.scrollTo(0, 0);
                qc.invalidateQueries({ queryKey: ["learning", "bank", bankId] }); qc.invalidateQueries({ queryKey: ["learning", "my"] });
            } catch { setTest(t => t && { ...t, sending: false, err: true }); }
        };
        if (!tq) return shell(<div className="bk"><button type="button" className="btn btn-p" onClick={() => (last ? send() : go(1))}>{T(last ? "submit" : "next")}</button></div>);
        const isNum = tq.num !== undefined && tq.num !== null, multi = !isNum && tq.c.length > 1;
        const pk = test.picks[tq.id];
        const sel = Array.isArray(pk) ? pk : [];
        const setPick = (v: Pick) => setTest(t => t && { ...t, picks: { ...t.picks, [tq.id]: v } });
        return shell(<div className="bk">
            <div className="bk-top"><button type="button" className="btn btn-g" onClick={() => setTest(null)}>{T("quit")}</button><span>{T("qOf", { a: test.i + 1, b: test.ids.length })}</span></div>
            <div className="bk-bar"><i className="ok" style={{ width: `${(test.ids.length - openN) / test.ids.length * 100}%` }} /></div>
            <article className="bk-card bk-q">
                <span className="bk-id">{tq.id}{tq.topic ? ` · ${topicTitle(tq.topic)}` : ""}</span>
                <p className="bk-qtext">{tx(tq.q, lang)}</p>
                {tq.media && (tq.media.type === "video"
                    ? <video className="bk-media" src={tq.media.src} controls playsInline preload="metadata" />
                    : <img className="bk-media" src={tq.media.src} alt="" />)}
                {isNum ? (
                    <label className="bk-num-l"><span className="small">{T("yourAnswer")}</span>
                        <span className="bk-num">
                            <input inputMode="numeric" autoComplete="off" value={typeof pk === "string" ? pk : ""} autoFocus
                                onChange={e => setPick(e.target.value.replace(/\D/g, "").slice(0, 7))}
                                onKeyDown={e => { if (e.key === "Enter" && !last) go(1); }} />
                            <b>{tq.unit}</b>
                        </span>
                    </label>
                ) : <>
                    {multi && <p className="bk-hint">{T("pickN", { n: tq.c.length })}</p>}
                    <div className="opts">{permOf(tq.o.length, tq.id).map(j => {
                        const on = sel.includes(j);
                        return <button key={j} type="button" className={`opt bk-opt ${on ? "sel" : ""} ${multi ? "multi" : ""}`}
                            role={multi ? "checkbox" : "radio"} aria-checked={on}
                            onClick={() => setPick(multi ? (on ? sel.filter(x => x !== j) : [...sel, j]) : [j])}>
                            <i className={multi ? "box" : "rad"} aria-hidden="true" /><span>{tx(tq.o[j], lang)}</span>
                        </button>;
                    })}</div>
                </>}
                {test.err && <p className="bk-err" role="alert">{T("saveErr")}</p>}
            </article>
            {last && openN > 0 && <p className="small bk-open">{T("open", { n: openN })}</p>}
            <div className="bk-nav bk-nav2">
                <button type="button" className="btn btn-o" disabled={test.i === 0} onClick={() => go(-1)}>{T("prev")}</button>
                {last
                    ? <button type="button" className="btn btn-p" disabled={test.sending} onClick={send}>{T(test.sending ? "sending" : "submit")}</button>
                    : <button type="button" className="btn btn-p" onClick={() => go(1)}>{T("next")}</button>}
            </div>
        </div>);
    }

    /* ── wynik testu ── */
    if (result && !round) {
        const pctR = result.n ? Math.round(result.right / result.n * 100) : 0;
        const wrong = Object.entries(result.results).filter(([, ok]) => !ok).map(([id]) => id);
        const groups = data.topics.map(t => { const ids = Object.keys(result.results).filter(id => byId[id]?.topic === t.key); return { t, n: ids.length, r: ids.filter(id => result.results[id]).length }; }).filter(g => g.n);
        return shell(<div className="bk">
            <section className={`bk-card bk-res ${result.passed ? "ok" : "no"}`}>
                <span className="bk-eyebrow">{T("resultTitle")}</span>
                <b className="bk-big">{pctR} %</b>
                <b className="bk-verdict">{T(result.passed ? "passed" : "notPassed")}</b>
                <p className="small">{T("resultText", { r: result.right, n: result.n, p: result.passPercent })}</p>
                <div className="bk-acts" style={{ justifyContent: "center" }}>
                    <button type="button" className="btn btn-p" onClick={startTest}>{T("newTest")}</button>
                    {wrong.length > 0 && <button type="button" className="btn btn-o" onClick={() => start(wrong)}>{T("learnWrong", { n: wrong.length })}</button>}
                    <button type="button" className="btn btn-g" onClick={() => setResult(null)}>{T("finish")}</button>
                </div>
            </section>
            {groups.length > 1 && <><h2 className="bk-h2">{T("byModule")}</h2>
                <section className="bk-card bk-topics">{groups.map(g => <div key={g.t.key} className="bk-topic">
                    <b>{tx(g.t.title, lang)}</b><em>{g.r} / {g.n}</em>
                    <div className="bk-bar"><i className="ok" style={{ width: `${g.r / g.n * 100}%` }} /><i className="no" style={{ width: `${(g.n - g.r) / g.n * 100}%` }} /></div>
                </div>)}</section></>}
        </div>);
    }

    if (!round) {
        const pct = (n: number) => `${qs.length ? n / qs.length * 100 : 0}%`;
        const pool = poolFor(topicSel).length;
        const hist = data.tests ?? [];
        return shell(<div className="bk">
            <div><p className="bk-eyebrow">{data.expiresAt ? T("activeUntil", { d: fmt(data.expiresAt) }) : T("learnTitle")}</p><h1 className="q">{tx(data.title, lang)}</h1></div>

            <section className="bk-card bk-hero bk-test">
                <div><h2 className="bk-h2">{T("testTitle")}</h2><p className="small">{T("testLead", { p: passP })}</p></div>
                <div className="bk-field"><span className="bk-lbl">{T("howMany")}</span>
                    <div className="bk-seg" role="radiogroup">
                        {COUNTS.filter(n => n < pool).map(n => <button key={n} type="button" role="radio" aria-checked={count === n} onClick={() => setCount(n)}>{n}</button>)}
                        <button type="button" role="radio" aria-checked={count === 0 || count >= pool} onClick={() => setCount(0)}>{T("allN", { n: pool })}</button>
                    </div>
                </div>
                <label className="bk-field"><span className="bk-lbl">{T("module")}</span>
                    <select className="bk-sel" value={topicSel} onChange={e => setTopicSel(e.target.value)}>
                        <option value="">{T("allModules")}</option>
                        {data.topics.filter(t => qs.some(q => q.topic === t.key)).map(t => <option key={t.key} value={t.key}>{tx(t.title, lang)}</option>)}
                    </select>
                </label>
                <div className="bk-acts"><button type="button" className="btn btn-p" disabled={!pool} onClick={startTest}>{T("startTest")}</button></div>
                {hist.length > 0 && <div className="bk-hist">
                    <span className="bk-lbl">{T("history")}</span>
                    {hist.slice(0, 5).map((h, k) => <div key={k} className="bk-hrow">
                        <span>{new Date(h.at).toLocaleDateString(LOC[lang])}{h.topic ? ` · ${topicTitle(h.topic)}` : ""}</span>
                        <span>{T("histRow", { r: h.right, n: h.n })}</span>
                        <b className={h.passed ? "ok" : "no"}>{Math.round(h.right / h.n * 100)} % · {T(h.passed ? "passed" : "notPassed")}</b>
                    </div>)}
                </div>}
            </section>

            <div><h2 className="bk-h2">{T("learnTitle")}</h2><p className="small">{T("lead")}</p></div>
            <section className="bk-card bk-hero">
                <div className="bk-stats">
                    <div><b>{ans} / {qs.length}</b><span>{T("answered")}</span></div>
                    <div><b>{ok}</b><span>{T("right")}</span></div>
                    <div><b>{no}</b><span>{T("toRepeat")}</span></div>
                </div>
                <div className="bk-bar"><i className="ok" style={{ width: pct(ok) }} /><i className="no" style={{ width: pct(no) }} /></div>
                <div className="bk-acts">
                    <button type="button" className="btn btn-p" onClick={() => start(nextIds())}>{T(ans === 0 ? "start" : ans === qs.length ? "again" : "cont")}</button>
                    {no > 0 && <button type="button" className="btn btn-o" onClick={() => start(wrongIds())}>{T("wrong", { n: no })}</button>}
                </div>
            </section>
            <div><h2 className="bk-h2">{T("byTopic")}</h2><p className="small">{T("byTopicLead")}</p></div>
            <section className="bk-card bk-topics">
                {data.topics.map(t => {
                    const tq = qs.filter(q => q.topic === t.key); if (!tq.length) return null;
                    const a = tq.filter(q => answers[q.id]).length, o = tq.filter(q => answers[q.id]?.ok).length;
                    return <button key={t.key} type="button" className="bk-topic" onClick={() => start(nextIds(t.key))}>
                        <b>{tx(t.title, lang)}</b><em>{o} / {tq.length}</em>
                        <div className="bk-bar"><i className="ok" style={{ width: `${o / tq.length * 100}%` }} /><i className="no" style={{ width: `${(a - o) / tq.length * 100}%` }} /></div>
                    </button>;
                })}
            </section>
            {ans > 0 && <div className="bk-reset">{confirm
                ? <><span>{T("resetSure")}</span><button type="button" className="btn btn-o" onClick={async () => { await resetBank(bankId); setConfirm(false); qc.invalidateQueries({ queryKey: ["learning", "bank", bankId] }); qc.invalidateQueries({ queryKey: ["learning", "my"] }); }}>{T("yes")}</button><button type="button" className="btn btn-g" onClick={() => setConfirm(false)}>{T("cancel")}</button></>
                : <button type="button" className="btn btn-g" onClick={() => setConfirm(true)}>{T("resetAll")}</button>}</div>}
        </div>);
    }

    if (round.i >= round.ids.length) {
        const r = Object.values(round.results).filter(Boolean).length;
        const w = wrongIds();
        return shell(<div className="bk"><section className="bk-card bk-done">
            <h2 className="q">{T("doneTitle")}</h2><p>{T("doneText", { r, n: round.ids.length })}</p>
            <div className="bk-acts" style={{ justifyContent: "center" }}>
                <button type="button" className="btn btn-p" onClick={() => setRound(null)}>{T("finish")}</button>
                {w.length > 0 && <button type="button" className="btn btn-o" onClick={() => start(w)}>{T("wrong", { n: w.length })}</button>}
            </div>
        </section></div>);
    }

    const q: BankQuestion | undefined = byId[round.ids[round.i]];
    // pytanie ukryte w panelu admina w trakcie rundy: pomijamy je
    if (!q) return shell(<div className="bk"><button type="button" className="btn btn-p" onClick={() => setRound(r => r && { ...r, i: r.i + 1 })}>{T("nextQ")}</button></div>);
    const isNum = q.num !== undefined && q.num !== null, multi = !isNum && q.c.length > 1, ck = round.checked;
    const order = permOf(q.o.length, q.id);
    const send = async (a: number) => {
        setRound(r => r && { ...r, saving: true, err: false });
        try {
            const res = await answerBank(bankId, q.id, a);
            setRound(r => r && { ...r, saving: false, checked: true, ok: res.ok, results: { ...r.results, [q.id]: res.ok } });
            qc.setQueryData(["learning", "bank", bankId], (d: any) => d && { ...d, answers: { ...d.answers, [q.id]: { ok: res.ok, n: (d.answers[q.id]?.n ?? 0) + 1 } } });
            qc.invalidateQueries({ queryKey: ["learning", "my"] });
        } catch { setRound(r => r && { ...r, saving: false, err: true }); }
    };
    const check = () => { if (isNum) send(Number(round.num)); else if (multi) send(maskOf(round.sel)); else send(round.sel[0]); };
    const canCheck = isNum ? round.num !== "" : multi ? round.sel.length === q.c.length : round.sel.length === 1;
    const topic = data.topics.find(t => t.key === q.topic);
    const sol = isNum ? T("solution", { v: `${q.num} ${q.unit ?? ""}`.trim() }) : multi ? T("multiSol") : T("solution", { v: tx(q.o[q.c[0]], lang) });

    return shell(<div className="bk">
        <div className="bk-top"><button type="button" className="btn btn-g" onClick={() => setRound(null)}>← {T("back")}</button><span>{T("qOf", { a: round.i + 1, b: round.ids.length })}</span></div>
        <div className="bk-bar"><i className="ok" style={{ width: `${round.i / round.ids.length * 100}%` }} /></div>
        <article className="bk-card bk-q">
            <span className="bk-id">{q.id}{topic ? ` · ${tx(topic.title, lang)}` : ""}</span>
            <p className="bk-qtext">{tx(q.q, lang)}</p>
            {q.media && (q.media.type === "video"
                ? <video className="bk-media" src={q.media.src} controls playsInline preload="metadata" />
                : <img className="bk-media" src={q.media.src} alt="" />)}
            {isNum ? (
                <label className="bk-num-l"><span className="small">{T("yourAnswer")}</span>
                    <span className={`bk-num ${ck ? (round.ok ? "ok" : "bad") : ""}`}>
                        <input inputMode="numeric" autoComplete="off" value={round.num} disabled={ck || round.saving} autoFocus
                            onChange={e => { const d = e.target.value.replace(/\D/g, "").slice(0, 7); setRound(r => r && { ...r, num: d }); }}
                            onKeyDown={e => { if (e.key === "Enter" && canCheck && !ck) check(); }} />
                        <b>{q.unit}</b>
                    </span>
                </label>
            ) : <>
                {multi && <p className="bk-hint">{T("pickN", { n: q.c.length })}</p>}
                <div className="opts">{order.map(j => {
                    const isC = q.c.includes(j), on = round.sel.includes(j);
                    let cls = on ? "sel" : "", tag = "";
                    if (ck) { cls = isC ? `right${on ? " picked" : ""}` : on ? "wrong" : ""; tag = isC ? (on || !multi ? T("tagRight") : T("tagMissed")) : on ? T("tagWrong") : ""; }
                    return <button key={j} type="button" className={`opt bk-opt ${cls} ${multi ? "multi" : ""}`} disabled={ck || round.saving}
                        role={multi ? "checkbox" : undefined} aria-checked={multi ? on : undefined}
                        onClick={() => {
                            if (multi) setRound(r => r && { ...r, sel: on ? r.sel.filter(x => x !== j) : [...r.sel, j] });
                            else { setRound(r => r && { ...r, sel: [j] }); send(j); }
                        }}>
                        {multi && <i className="box" aria-hidden="true" />}<span>{tx(q.o[j], lang)}</span>{tag && <span className="tag">{tag}</span>}
                    </button>;
                })}</div>
            </>}
            {round.err && <p className="bk-err" role="alert">{T("saveErr")}</p>}
            {ck && <div className={`bk-fb ${round.ok ? "ok" : "no"}`} aria-live="polite"><b>{T(round.ok ? "isRight" : "isWrong")}</b>{(!round.ok || multi || isNum) && <span>{sol}</span>}</div>}
        </article>
        <div className="bk-nav">
            {ck ? <button type="button" className="btn btn-p" onClick={() => { setRound(r => r && { ...r, i: r.i + 1, sel: [], num: "", checked: false, ok: false }); window.scrollTo(0, 0); }}>{T(round.i < round.ids.length - 1 ? "nextQ" : "finish")}</button>
                : (multi || isNum || round.err) && <button type="button" className="btn btn-p" disabled={!canCheck || round.saving} onClick={check}>{T("check")}</button>}
        </div>
    </div>);
}
