import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getDashboard } from "@/api/dashboard.api";
import { DashboardCourse, DashboardData } from "@/types/dashboard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Language } from "@/i18n/translations";
import { API, authHeaders, Booking, PanelCertificate, bookingsFromOrders, calendarUrl, fill, fmtDate, fmtMoney, routeUrl, verifyUrl } from "@/components/dashboard/panelUtils";
import { clearUserSession } from "@/utils/auth";
import logo from "@/assets/staplero-white-cropped.svg";
import { MyCourse, useMyCourses } from "@/learning/api";
import { Lang, tx } from "@/learning/types";
import WalletCard from "@/components/dashboard/WalletCard";
import "@/learning/panel.css";

// Panel kursanta v2 według zaakceptowanej makiety: Übersicht, Meine Kurse, Zertifikate, Bestellungen, Profil.
// Dane: /api/dashboard (zamówienia, terminy praktyki), /api/certificates/my, /api/learning/my (kursy v2).

type Tab = "home" | "kurse" | "zert" | "best" | "profil";
const HASH: Record<Tab, string> = { home: "", kurse: "#kurse", zert: "#zertifikate", best: "#bestellungen", profil: "#profil" };
const tabOf = (h: string): Tab => (Object.entries(HASH).find(([, v]) => v && v === h)?.[0] as Tab) || "home";
const COVER = "/img/kurs/cover-linie.webp";

const P = {
    resume:     { de: "Weiterlernen", en: "Continue learning", pl: "Kontynuuj naukę", uk: "Продовжити навчання" },
    start:      { de: "Kurs starten", en: "Start course", pl: "Rozpocznij kurs", uk: "Почати курс" },
    resumeLt:   { de: "Weiterlernen · {c}", en: "Continue · {c}", pl: "Kontynuuj · {c}", uk: "Продовжити · {c}" },
    topicsOf:   { de: "{a} von {b} Themen", en: "{a} of {b} topics", pl: "{a} z {b} tematów", uk: "{a} з {b} тем" },
    until:      { de: "Zugang bis {d}", en: "Access until {d}", pl: "Dostęp do {d}", uk: "Доступ до {d}" },
    daysLeft:   { de: "Zugang noch {n} Tage", en: "Access for {n} more days", pl: "Dostęp jeszcze {n} dni", uk: "Доступ ще {n} дн." },
    road:       { de: "Ihr Weg zum Staplerschein", en: "Your path to the forklift licence", pl: "Twoja droga do Staplerscheinu", uk: "Ваш шлях до Staplerschein" },
    stepOf:     { de: "Schritt {a} von 4", en: "Step {a} of 4", pl: "Krok {a} z 4", uk: "Крок {a} з 4" },
    rTheory:    { de: "Online-Theorie", en: "Online theory", pl: "Teoria online", uk: "Онлайн-теорія" },
    rExam:      { de: "Theorieprüfung", en: "Theory exam", pl: "Egzamin teoretyczny", uk: "Теоретичний іспит" },
    rExamTxt:   { de: "online, nach allen Kapiteln", en: "online, after all chapters", pl: "online, po wszystkich rozdziałach", uk: "онлайн, після всіх розділів" },
    rPractice:  { de: "Praxistag", en: "Practical day", pl: "Dzień praktyczny", uk: "Практичний день" },
    rNoDate:    { de: "noch kein Termin gebucht", en: "no date booked yet", pl: "brak zarezerwowanego terminu", uk: "дату ще не заброньовано" },
    rLicence:   { de: "Staplerschein", en: "Forklift licence", pl: "Staplerschein", uk: "Staplerschein" },
    rLicTxt:    { de: "als PDF und im Handy-Wallet", en: "as PDF and in the phone wallet", pl: "jako PDF i w portfelu w telefonie", uk: "як PDF і в гаманці телефону" },
    rIssued:    { de: "ausgestellt am {d}", en: "issued on {d}", pl: "wydany {d}", uk: "видано {d}" },
    toCourse:   { de: "Zum Kurs", en: "Go to course", pl: "Do kursu", uk: "До курсу" },
    bookDate:   { de: "Termin buchen", en: "Book a date", pl: "Zarezerwuj termin", uk: "Забронювати дату" },
    myCourses:  { de: "Meine Kurse", en: "My courses", pl: "Moje kursy", uk: "Мої курси" },
    orders:     { de: "Bestellungen", en: "Orders", pl: "Zamówienia", uk: "Замовлення" },
    certs:      { de: "Zertifikate", en: "Certificates", pl: "Certyfikaty", uk: "Сертифікати" },
    profile:    { de: "Profil", en: "Profile", pl: "Profil", uk: "Профіль" },
    overview:   { de: "Übersicht", en: "Overview", pl: "Przegląd", uk: "Огляд" },
    all:        { de: "Alle", en: "All", pl: "Wszystkie", uk: "Усі" },
    running:    { de: "Läuft", en: "In progress", pl: "W toku", uk: "Триває" },
    notStarted: { de: "Neu", en: "New", pl: "Nowy", uk: "Новий" },
    finished:   { de: "Abgeschlossen", en: "Completed", pl: "Ukończony", uk: "Завершено" },
    booked:     { de: "Gebucht", en: "Booked", pl: "Zarezerwowany", uk: "Заброньовано" },
    practicalDay: { de: "Praxistag Gabelstapler", en: "Forklift practical day", pl: "Dzień praktyczny na wózku", uk: "Практичний день на навантажувачі" },
    invoice:    { de: "Rechnung", en: "Invoice", pl: "Faktura", uk: "Рахунок" },
    invoicesHint: { de: "Rechnungen als PDF unter Bestellungen", en: "Invoices as PDF under Orders", pl: "Faktury PDF w zakładce Zamówienia", uk: "Рахунки PDF у розділі Замовлення" },
    overviewC:  { de: "Kursübersicht", en: "Course overview", pl: "Przegląd kursu", uk: "Огляд курсу" },
    noCourses:  { de: "Noch kein Kurs", en: "No course yet", pl: "Brak kursów", uk: "Курсів ще немає" },
    certTheory: { de: "Theorienachweis Gabelstapler", en: "Forklift theory certificate", pl: "Zaświadczenie z teorii", uk: "Сертифікат з теорії" },
    certPract:  { de: "Staplerschein (Befähigungsnachweis)", en: "Forklift licence (certificate of competence)", pl: "Staplerschein (zaświadczenie kwalifikacji)", uk: "Staplerschein (посвідчення)" },
    pending:    { de: "Ausstehend", en: "Pending", pl: "Oczekuje", uk: "Очікується" },
    valid:      { de: "Gültig", en: "Valid", pl: "Ważny", uk: "Дійсний" },
    pendingTxt: { de: "Wird nach bestandener Prüfungsfahrt am Praxistag ausgestellt. Sie bekommen eine E-Mail.", en: "Issued after you pass the driving test on the practical day. You will receive an email.", pl: "Zostanie wydany po zdaniu jazdy egzaminacyjnej w dniu praktycznym. Dostaniesz e-mail.", uk: "Видається після складання практичного іспиту. Ви отримаєте лист." },
    theoryNote: { de: "Nur Theorieteil, kein Fahrausweis. Zum Führen eines Staplers brauchen Sie zusätzlich den Praxistag mit Prüfung.", en: "Theory part only, not a forklift licence. To operate a forklift you also need the practical day with an exam.", pl: "Tylko część teoretyczna, to nie są uprawnienia. Do prowadzenia wózka potrzebny jest jeszcze dzień praktyczny z egzaminem.", uk: "Лише теоретична частина, не посвідчення. Щоб керувати навантажувачем, потрібен ще практичний день з іспитом." },
    eyePract:   { de: "Befähigungsnachweis · DGUV Vorschrift 68", en: "Certificate of competence · DGUV Regulation 68", pl: "Zaświadczenie kwalifikacji · DGUV Vorschrift 68", uk: "Посвідчення · DGUV Vorschrift 68" },
    eyeTheory:  { de: "Theorieteil · DGUV Grundsatz 308-001", en: "Theory part · DGUV Principle 308-001", pl: "Część teoretyczna · DGUV Grundsatz 308-001", uk: "Теоретична частина · DGUV Grundsatz 308-001" },
    holder:     { de: "Inhaber", en: "Holder", pl: "Posiadacz", uk: "Власник" },
    issuedOn:   { de: "Ausgestellt", en: "Issued", pl: "Wydano", uk: "Видано" },
    place:      { de: "Ausbildungsort", en: "Training location", pl: "Miejsce szkolenia", uk: "Місце навчання" },
    result:     { de: "Prüfungsergebnis", en: "Exam result", pl: "Wynik egzaminu", uk: "Результат іспиту" },
    certNo:     { de: "Zertifikat-Nr.", en: "Certificate no.", pl: "Nr certyfikatu", uk: "№ сертифіката" },
    copy:       { de: "Kopieren", en: "Copy", pl: "Kopiuj", uk: "Копіювати" },
    copied:     { de: "Kopiert", en: "Copied", pl: "Skopiowano", uk: "Скопійовано" },
    verifyTxt:  { de: "Echtheit online prüfbar:", en: "Verify authenticity online:", pl: "Autentyczność do sprawdzenia online:", uk: "Перевірка справжності онлайн:" },
    verify:     { de: "prüfbar unter", en: "verifiable at", pl: "do sprawdzenia na", uk: "перевірка на" },
    apple:      { de: "Zu Apple Wallet hinzufügen", en: "Add to Apple Wallet", pl: "Dodaj do Apple Wallet", uk: "Додати в Apple Wallet" },
    google:     { de: "Zu Google Wallet hinzufügen", en: "Add to Google Wallet", pl: "Dodaj do Google Wallet", uk: "Додати в Google Wallet" },
    score:      { de: "bestanden mit {s} %", en: "passed with {s} %", pl: "zdane z wynikiem {s} %", uk: "складено з результатом {s} %" },
    account:    { de: "Konto", en: "Account", pl: "Konto", uk: "Обліковий запис" },
    language:   { de: "Sprache", en: "Language", pl: "Język", uk: "Мова" },
} satisfies Record<string, Record<Lang, string>>;

const LANG_NAMES: Record<Lang, string> = { de: "Deutsch", en: "English", pl: "Polski", uk: "Українська" };
const Icon = ({ d }: { d: string }) => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
const ICONS = {
    home: "M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    kurse: "M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM4 19V5",
    zert: "M12 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM8.5 14L7 21l5-3 5 3-1.5-7",
    best: "M3 4h2l2.5 11h11L21 8H7M9 19.5a1 1 0 1 0 0-.01M18 19.5a1 1 0 1 0 0-.01",
    profil: "M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c1-4 4-6 8-6s7 2 8 6",
    next: "M9 6l6 6-6 6",
};
const APPLE = <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" /></svg>;
const GOOGLE = <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>;
const INFO = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.01" /></svg>;
const COPY = <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></svg>;
const SHIELD = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>;
const DOWNLOAD = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" /></svg>;
const CAL = <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>;
const CHECK = <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="4"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;

export default function Panel() {
    const { t, language, setLanguage } = useLanguage();
    const lang = language as Lang;
    const p = (k: keyof typeof P, v: Record<string, string | number> = {}) => fill(P[k][lang] ?? P[k].de, v);
    const nav = useNavigate();
    const loc = useLocation();
    const { toast } = useToast();
    const [data, setData] = useState<DashboardData | null>(null);
    const [certs, setCerts] = useState<PanelCertificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [menu, setMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const my = useMyCourses();
    const tab = tabOf(loc.hash);

    useEffect(() => {
        if (!localStorage.getItem("token")) { nav("/login"); return; }
        Promise.all([
            getDashboard(),
            fetch(`${API}/certificates/my`, { headers: authHeaders() }).then(r => (r.ok ? r.json() : [])).catch(() => []),
        ])
            .then(([d, list]) => { setData(d); setCerts(Array.isArray(list) ? list : []); })
            .catch(err => {
                if (err?.status === 401) { localStorage.removeItem("token"); nav("/login"); return; }
                toast({ title: t("panel.loadError"), variant: "destructive" });
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);
    useEffect(() => {
        const close = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
        addEventListener("mousedown", close);
        return () => removeEventListener("mousedown", close);
    }, []);

    const bookings: Booking[] = useMemo(() => (data ? bookingsFromOrders(data.orders, data.user.name) : []), [data]);
    if (loading) return <div className="pn" style={{ display: "grid", placeItems: "center" }}><p className="pn-muted">{t("panel.loading")}</p></div>;
    if (!data) return <div className="pn" style={{ display: "grid", placeItems: "center" }}><p className="pn-muted">{t("panel.loadError")}</p></div>;

    const { user, orders } = data;
    const courses = my.data ?? [];
    // kursy ze starego systemu (/course/...), żeby po przełączeniu panelu nikomu nic nie zniknęło
    const legacy = (data.courses ?? []) as DashboardCourse[];
    const main = courses[0] as MyCourse | undefined;
    const practicalCert = certs.find(c => c.type === "practical");
    const theoryCert = certs.find(c => c.type === "online");
    const nextBooking = bookings.find(b => !b.finished);
    const firstName = user.name.split(" ")[0];
    const initials = user.name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const coursePct = (c: MyCourse) => (c.lessonCount ? Math.round(c.lessonsDone / c.lessonCount * 100) : 0);
    const daysTo = (d: string) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 864e5));
    const lessonHref = (c: MyCourse) => (c.lastLessonId ? `/lernen/${c.id}/${c.lastLessonId}` : `/lernen/${c.id}`);
    const subtitle = practicalCert ? t("panel.subCert")
        : nextBooking ? (nextBooking.daysLeft > 1 ? fill(t("panel.subDays"), { n: nextBooking.daysLeft }) : nextBooking.daysLeft === 1 ? t("panel.subTomorrow") : t("panel.subToday"))
            : t("panel.subDefault");
    const statusPill = (s: string) => (s === "paid" ? "ok" : s === "pending" ? "warn" : "draft");
    const orderTitle = (o: any) => (o.items || []).filter((it: any) => it.type !== "practical-addon").map((it: any) => it.courseName).join(", ") || "—";

    const tabs: { id: Tab; label: string }[] = [
        { id: "home", label: p("overview") }, { id: "kurse", label: p("myCourses") }, { id: "zert", label: p("certs") },
        { id: "best", label: p("orders") }, { id: "profil", label: p("profile") },
    ];
    const href = (id: Tab) => `/dashboard${HASH[id]}`;

    /* ───────── bloki ───────── */
    const LegacyRow = ({ c }: { c: DashboardCourse }) => (
        <Link className="pn-row" to={`/course/${c._id}`}>
            <div className="pn-thumb"><img src={c.thumbnailUrl || COVER} alt="" /></div>
            <div className="t"><b>{c.title}</b>
                <span className="s">{c.expiresAt ? p("daysLeft", { n: daysTo(c.expiresAt) }) : p("topicsOf", { a: c.completedTopics, b: c.totalTopics })}</span>
                <div className="pn-bar" style={{ marginTop: 8, maxWidth: 220 }}><i style={{ width: `${Math.max(2, c.progressPercent)}%` }} /></div>
            </div>
            <span className={`pn-pill ${c.progressPercent === 100 ? "ok" : c.completedTopics ? "warn" : "draft"}`}>{p(c.progressPercent === 100 ? "finished" : c.completedTopics ? "running" : "notStarted")}</span>
        </Link>
    );
    const CourseRow = ({ c }: { c: MyCourse }) => {
        const pct = coursePct(c);
        return (
            <Link className="pn-row" to={`/lernen/${c.id}`}>
                <div className="pn-thumb"><img src={c.coverUrl || COVER} alt="" /></div>
                <div className="t"><b>{tx(c.title, lang)}</b>
                    <span className="s">{c.expiresAt ? p("daysLeft", { n: daysTo(c.expiresAt) }) : p("topicsOf", { a: c.lessonsDone, b: c.lessonCount })}</span>
                    <div className="pn-bar" style={{ marginTop: 8, maxWidth: 220 }}><i style={{ width: `${Math.max(2, pct)}%` }} /></div>
                </div>
                <span className={`pn-pill ${pct === 100 ? "ok" : c.lessonsDone || c.lastStep ? "warn" : "draft"}`}>{p(pct === 100 ? "finished" : c.lessonsDone || c.lastStep ? "running" : "notStarted")}</span>
            </Link>
        );
    };
    const BookingRow = ({ b }: { b: Booking }) => (
        <Link className="pn-row" to={href("kurse")}>
            <div className="pn-date"><b>{b.start.getDate()}</b><span>{b.start.toLocaleDateString(lang, { month: "short" })}</span></div>
            <div className="t"><b>{p("practicalDay")}</b><span className="s">{b.city}</span></div>
            <span className={`pn-pill ${b.finished ? "ok" : "draft"}`}>{p(b.finished ? "finished" : "booked")}</span>
        </Link>
    );
    const Orders = ({ limit }: { limit?: number }) => (
        <table className="pn-table resp">
            <thead><tr><th>{t("panel.colOrder")}</th><th>{t("panel.colProduct")}</th><th>{t("panel.colStatus")}</th><th className="num">{t("panel.colAmount")}</th><th /></tr></thead>
            <tbody>{(limit ? orders.slice(0, limit) : orders).map((o: any) => (
                <tr key={o._id}>
                    <td><b style={{ color: "var(--g900)" }}>{o.orderNumber}</b><div className="pn-muted" style={{ fontSize: 12.5 }}>{fmtDate(o.createdAt, language as Language)}</div></td>
                    <td>{orderTitle(o)}{o.practicalCourseDetails && <div className="pn-muted" style={{ fontSize: 12.5 }}>{fill(t("panel.participants"), { n: 1 + (o.practicalCourseDetails.additionalParticipants?.length || 0) })} · {o.practicalCourseDetails.locationName}</div>}</td>
                    <td><span className={`pn-pill ${statusPill(o.status)}`}>{t(`panel.status_${o.status}`)}</span></td>
                    <td className="num">{fmtMoney(o.totalAmount, language as Language)}</td>
                    <td className="num">{o.invoicePdfUrl && <a className="pn-btn o s" href={o.invoicePdfUrl} target="_blank" rel="noopener noreferrer">{p("invoice")}</a>}</td>
                </tr>
            ))}</tbody>
        </table>
    );

    const roadStep = (state: "done" | "cur" | "", title: string, text: string, action?: React.ReactNode) => (
        <li className={state}><span className="dot">{state === "done" && CHECK}</span><b>{title}</b><span>{text}</span>{action}</li>
    );
    const theoryDone = !!theoryCert || (main ? coursePct(main) === 100 : false);
    const roadIndex = practicalCert ? 4 : nextBooking && theoryDone ? 3 : theoryDone ? 2 : 1;

    return (
        <div className="pn">
            <header className="pn-top">
                <Link to="/" className="pn-logo" aria-label="Staplero"><img src={logo} alt="Staplero" /></Link>
                <nav className="pn-nav" aria-label={t("panel.area")}>
                    {tabs.map(x => <Link key={x.id} to={href(x.id)} aria-current={tab === x.id ? "page" : undefined}>{x.label}</Link>)}
                </nav>
                <span className="pn-sp" />
                <div className="pn-lang" role="group" aria-label={p("language")}>
                    {(Object.keys(LANG_NAMES) as Lang[]).map(l => <button key={l} type="button" title={LANG_NAMES[l]} aria-pressed={l === lang} onClick={() => setLanguage(l as Language)}>{l.toUpperCase()}</button>)}
                </div>
                <div className="pn-me" ref={menuRef}>
                    <button type="button" className="pn-avatar" aria-haspopup="menu" aria-expanded={menu} aria-label={user.name} onClick={() => setMenu(m => !m)}>{initials}</button>
                    {menu && (
                        <div className="pn-menu" role="menu">
                            <div className="who"><b>{user.name}</b><span>{user.email}</span></div>
                            {user.isAdmin && <Link to="/admin" role="menuitem">{t("panel.adminPanel")}</Link>}
                            <Link to={href("profil")} role="menuitem" onClick={() => setMenu(false)}>{p("profile")}</Link>
                            <Link to="/" role="menuitem">{t("panel.website")}</Link>
                            <button type="button" role="menuitem" onClick={() => { clearUserSession(); nav("/login"); }}>{t("panel.logout")}</button>
                        </div>
                    )}
                </div>
            </header>

            <main className="pn-page">
                {tab === "home" && <>
                    <div className="pn-hello">
                        <p className="d">{new Date().toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" })}</p>
                        <h1>{fill(t("panel.hello"), { name: firstName })}</h1>
                        <p>{subtitle}</p>
                    </div>

                    {main && (
                        <section className="pn-card pn-resume" aria-label={p("resume")}>
                            <div className="vis"><img src={main.coverUrl || COVER} alt="" /></div>
                            <div className="body">
                                <span className="pn-lt">{p("resumeLt", { c: tx(main.title, lang) })}</span>
                                <h2>{tx(main.title, lang)}</h2>
                                <p className="pn-muted">{p("topicsOf", { a: main.lessonsDone, b: main.lessonCount })}{main.expiresAt ? ` · ${p("until", { d: fmtDate(main.expiresAt, language as Language) })}` : ""}</p>
                                <div className="row"><div className="pn-bar"><i style={{ width: `${Math.max(2, coursePct(main))}%` }} /></div><span className="pn-muted">{coursePct(main)} %</span></div>
                                <div><Link className="pn-btn p" to={lessonHref(main)}>{p(main.lessonsDone || main.lastStep ? "resume" : "start")}<Icon d={ICONS.next} /></Link></div>
                            </div>
                        </section>
                    )}

                    <section className="pn-card" aria-label={p("road")}>
                        <div className="pn-hd"><h3>{p("road")}</h3><span className="pn-muted">{p("stepOf", { a: roadIndex })}</span></div>
                        <ol className="pn-road">
                            {roadStep(theoryDone ? "done" : "cur", p("rTheory"),
                                main ? `${coursePct(main)} %${main.expiresAt ? ` · ${p("until", { d: fmtDate(main.expiresAt, language as Language) })}` : ""}` : p("noCourses"),
                                main ? <Link to={`/lernen/${main.id}`}>{p("toCourse")}</Link> : <Link to="/kursy">{t("panel.browse")}</Link>)}
                            {roadStep(theoryCert ? "done" : theoryDone ? "cur" : "", p("rExam"), theoryCert?.score !== undefined ? p("score", { s: theoryCert.score }) : p("rExamTxt"))}
                            {roadStep(practicalCert ? "done" : nextBooking && theoryDone ? "cur" : "", p("rPractice"),
                                practicalCert ? `${fmtDate(practicalCert.trainingDate, language as Language)}${practicalCert.trainingLocation ? ` · ${practicalCert.trainingLocation.split("–")[0].trim()}` : ""}`
                                    : nextBooking ? `${fmtDate(nextBooking.start, language as Language, { weekday: "short", day: "numeric", month: "long" })} · ${nextBooking.city}` : p("rNoDate"),
                                nextBooking ? <a href={routeUrl(nextBooking.address)} target="_blank" rel="noopener noreferrer">{t("panel.route")}</a> : !practicalCert ? <Link to="/kursy">{p("bookDate")}</Link> : undefined)}
                            {roadStep(practicalCert ? "done" : "", p("rLicence"), practicalCert ? p("rIssued", { d: fmtDate(practicalCert.issuedAt, language as Language) }) : p("rLicTxt"),
                                <Link to={href("zert")}>{p("certs")}</Link>)}
                        </ol>
                    </section>

                    <div className="pn-two">
                        <section className="pn-card">
                            <div className="pn-hd"><h3>{p("myCourses")}</h3><Link to={href("kurse")}>{p("all")}</Link></div>
                            {courses.map(c => <CourseRow key={c.id} c={c} />)}
                            {legacy.map(c => <LegacyRow key={c._id} c={c} />)}
                            {bookings.slice(0, 2).map(b => <BookingRow key={b.orderNumber} b={b} />)}
                            {!courses.length && !legacy.length && !bookings.length && <div className="pn-empty"><b>{t("panel.noCoursesTitle")}</b><Link className="pn-btn o s" to="/kursy">{t("panel.browse")}</Link></div>}
                        </section>
                        <section className="pn-card">
                            <div className="pn-hd"><h3>{p("orders")}</h3><Link to={href("best")}>{p("all")}</Link></div>
                            {orders.slice(0, 3).map((o: any) => (
                                <Link key={o._id} className="pn-row" to={href("best")}>
                                    <div className="t"><b>{orderTitle(o)}</b><span className="s">{o.orderNumber} · {fmtDate(o.createdAt, language as Language)}</span></div>
                                    <div className="r"><b style={{ fontSize: 14 }}>{fmtMoney(o.totalAmount, language as Language)}</b><span className={`pn-pill ${statusPill(o.status)}`}>{t(`panel.status_${o.status}`)}</span></div>
                                </Link>
                            ))}
                            {!orders.length && <div className="pn-empty"><b>{t("panel.noOrdersTitle")}</b></div>}
                            {orders.length > 0 && <div className="pn-ft">{p("invoicesHint")}</div>}
                        </section>
                    </div>
                </>}

                {tab === "kurse" && <>
                    <div className="pn-hello"><h1>{p("myCourses")}</h1></div>
                    {courses.map(c => (
                        <section key={c.id} className="pn-card pn-course">
                            <div className="vis"><img src={c.coverUrl || COVER} alt="" /></div>
                            <div className="body">
                                <h3>{tx(c.title, lang)}</h3>
                                <p className="pn-muted">{p("topicsOf", { a: c.lessonsDone, b: c.lessonCount })}{c.expiresAt ? ` · ${p("until", { d: fmtDate(c.expiresAt, language as Language) })}` : ""}</p>
                                <div className="pn-bar" style={{ maxWidth: 360 }}><i style={{ width: `${Math.max(2, coursePct(c))}%` }} /></div>
                                <div className="pn-acts">
                                    <Link className="pn-btn p" to={lessonHref(c)}>{p(c.lessonsDone || c.lastStep ? "resume" : "start")}</Link>
                                    <Link className="pn-btn o" to={`/lernen/${c.id}`}>{p("overviewC")}</Link>
                                </div>
                            </div>
                        </section>
                    ))}
                    {legacy.map(c => (
                        <section key={c._id} className="pn-card pn-course">
                            <div className="vis"><img src={c.thumbnailUrl || COVER} alt="" /></div>
                            <div className="body">
                                <h3>{c.title}</h3>
                                <p className="pn-muted">{p("topicsOf", { a: c.completedTopics, b: c.totalTopics })}{c.expiresAt ? ` · ${p("until", { d: fmtDate(c.expiresAt, language as Language) })}` : ""}</p>
                                <div className="pn-bar" style={{ maxWidth: 360 }}><i style={{ width: `${Math.max(2, c.progressPercent)}%` }} /></div>
                                <div className="pn-acts"><Link className="pn-btn p" to={`/course/${c._id}`}>{p(c.completedTopics ? "resume" : "start")}</Link></div>
                            </div>
                        </section>
                    ))}
                    {bookings.map(b => (
                        <section key={b.orderNumber} className="pn-card pn-ticket">
                            <div className="when">
                                <div className="pn-date"><b>{b.start.getDate()}</b><span>{b.start.toLocaleDateString(lang, { month: "short" })}</span></div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ fontSize: 16 }}>{p("practicalDay")} · {b.city}</h3>
                                    <p className="pn-muted">{fmtDate(b.start, language as Language, { weekday: "long", day: "numeric", month: "long" })} · {b.address}</p>
                                    <p className="pn-muted">{fill(t("panel.participants"), { n: b.participants.length })}: {b.participants.join(", ")}</p>
                                </div>
                                <span className={`pn-pill ${b.finished ? "ok" : "draft"}`}>{p(b.finished ? "finished" : "booked")}</span>
                            </div>
                            {!b.finished && <div className="pn-acts">
                                <a className="pn-btn o s" href={calendarUrl(b.start, b.address, b.orderNumber)} target="_blank" rel="noopener noreferrer">{t("panel.addCalendar")}</a>
                                <a className="pn-btn o s" href={routeUrl(b.address)} target="_blank" rel="noopener noreferrer">{t("panel.route")}</a>
                            </div>}
                        </section>
                    ))}
                    {!courses.length && !legacy.length && !bookings.length && <section className="pn-card pn-empty"><b>{t("panel.noCoursesTitle")}</b><p className="pn-muted">{t("panel.noCoursesText")}</p><Link className="pn-btn p" to="/kursy">{t("panel.browse")}</Link></section>}
                </>}

                {tab === "zert" && <>
                    <div className="pn-hello"><h1>{p("certs")}</h1></div>
                    {certs.map(c => <CertCard key={c._id} cert={c} p={p} language={language as Language} />)}
                    {!practicalCert && (
                        <PendingCert holder={user.name} booking={nextBooking} p={p} />
                    )}
                </>}

                {tab === "best" && <>
                    <div className="pn-hello"><h1>{p("orders")}</h1><p>{t("panel.ordersSub")}</p></div>
                    <section className="pn-card">{orders.length ? <Orders /> : <div className="pn-empty"><b>{t("panel.noOrdersTitle")}</b><p className="pn-muted">{t("panel.noOrdersText")}</p></div>}</section>
                </>}

                {tab === "profil" && <>
                    <div className="pn-hello"><h1>{p("profile")}</h1><p>{t("panel.profileSub")}</p></div>
                    <section className="pn-card">
                        <div className="pn-hd"><h3>{p("account")}</h3></div>
                        <dl className="pn-dl">
                            <div><dt>{t("panel.name")}</dt><dd>{user.name}</dd></div>
                            <div><dt>{t("panel.email")}</dt><dd>{user.email}</dd></div>
                            <div><dt>{p("language")}</dt><dd>{LANG_NAMES[lang] ?? "Deutsch"}</dd></div>
                        </dl>
                        <div className="pn-acts" style={{ padding: "0 20px 20px" }}>
                            <Link className="pn-btn o" to="/forgot-password">{t("panel.changePassword")}</Link>
                            <button type="button" className="pn-btn o" onClick={() => { clearUserSession(); nav("/login"); }}>{t("panel.logout")}</button>
                            {user.isAdmin && <Link className="pn-btn p" to="/admin">{t("panel.adminPanel")}</Link>}
                        </div>
                    </section>
                </>}
            </main>

            <nav className="pn-tabbar" aria-label={t("panel.area")}>
                {tabs.map(x => <Link key={x.id} to={href(x.id)} aria-current={tab === x.id ? "page" : undefined}><Icon d={ICONS[x.id]} /><span>{x.label.replace(/^Meine |^My |^Moje |^Мої /, "")}</span></Link>)}
            </nav>
        </div>
    );
}

/** Staplerschein jeszcze niewystawiony: podgląd karty i co trzeba zrobić. */
function PendingCert({ holder, booking, p }: { holder: string; booking?: Booking; p: PFn }) {
    const { language } = useLanguage();
    return (
        <section className="pn-card pn-cred pending">
            <div className="pn-pv"><WalletCard holder={holder} pendingDate={booking?.start} pendingCity={booking?.city} /></div>
            <div className="body">
                <p className="pn-eye">{p("eyePract")}</p>
                <h3>{p("certPract")}<span className="pn-pill draft">{p("pending")}</span></h3>
                <p className="pn-muted">{p("pendingTxt")}</p>
                {booking
                    ? <p className="pn-verify">{CAL}<span>{p("practicalDay")}: <b>{fmtDate(booking.start, language as Language, { weekday: "long", day: "numeric", month: "long" })} · {booking.city}</b></span></p>
                    : <div className="pn-acts"><Link className="pn-btn p" to="/kursy">{p("bookDate")}</Link></div>}
            </div>
        </section>
    );
}

/** Certyfikat: jasna karta, PDF + Apple/Google Wallet (te same endpointy co dotąd). */
type PFn = (k: keyof typeof P, v?: Record<string, string | number>) => string;
function CertCard({ cert, p, language }: { cert: PanelCertificate; p: PFn; language: Language }) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const [busy, setBusy] = useState("");
    const practical = cert.type === "practical";
    const fail = (m?: string) => toast({ title: m || t("panel.loadError"), variant: "destructive" });
    const save = (blob: Blob, name: string) => {
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    };
    const pdf = async () => {
        setBusy("pdf");
        try {
            const r = await fetch(`${API}/certificates/${cert._id}/download`, { headers: authHeaders() });
            if (!r.ok) throw new Error();
            save(await r.blob(), `${practical ? "Staplerschein" : "Theorienachweis"}-${cert.verificationCode}.pdf`);
        } catch { fail(); } finally { setBusy(""); }
    };
    const wallet = async (type: "apple" | "google") => {
        setBusy(type);
        try {
            const r = await fetch(`${API}/certificates/${cert._id}/wallet/${type}`, { headers: authHeaders() });
            if (r.status === 503) return fail(t("panel.walletUnavailable"));
            if (!r.ok) throw new Error();
            if (type === "apple") save(await r.blob(), `Staplerschein-${cert.verificationCode}.pkpass`);
            else window.location.href = (await r.json()).url;
        } catch { fail(); } finally { setBusy(""); }
    };
    const [copied, setCopied] = useState(false);
    const copy = () => navigator.clipboard?.writeText(cert.verificationCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => {});
    const place = cert.trainingLocation?.split("–")[0].trim();
    return (
        <section className="pn-card pn-cred">
            <div className="pn-pv"><WalletCard cert={cert} holder={cert.userName} /></div>
            <div className="body">
                <p className="pn-eye">{practical ? p("eyePract") : p("eyeTheory")}</p>
                <h3>{p(practical ? "certPract" : "certTheory")}<span className="pn-pill ok">{CHECK}{p("valid")}</span></h3>
                <dl className="pn-facts">
                    <div><dt>{p("holder")}</dt><dd>{cert.userName}</dd></div>
                    <div><dt>{p("issuedOn")}</dt><dd>{fmtDate(cert.issuedAt, language)}</dd></div>
                    {practical
                        ? <div><dt>{p("place")}</dt><dd>{place || "STAPLERO"}</dd></div>
                        : <div><dt>{p("result")}</dt><dd>{cert.score !== undefined ? p("score", { s: cert.score }) : "—"}</dd></div>}
                    <div><dt>{p("certNo")}</dt><dd className="mono">{cert.verificationCode}
                        <button type="button" className="pn-copy" onClick={copy} aria-label={p("copy")}>{copied ? CHECK : COPY}<span>{copied ? p("copied") : p("copy")}</span></button></dd></div>
                </dl>
                {!practical && <p className="pn-note">{INFO}{p("theoryNote")}</p>}
                <p className="pn-verify">{SHIELD}<span>{p("verifyTxt")} <a href={verifyUrl(cert.verificationCode)} target="_blank" rel="noopener noreferrer">{verifyUrl(cert.verificationCode).replace(/^https?:\/\//, "")}</a></span></p>
                <div className="pn-cacts">
                    <button type="button" className="pn-wbtn pdf" disabled={!!busy} onClick={pdf}>{DOWNLOAD}{t("panel.downloadPdf")}</button>
                    <div className="w">
                        <button type="button" className="pn-wbtn" disabled={!!busy} onClick={() => wallet("apple")}>{APPLE}{p("apple")}</button>
                        <button type="button" className="pn-wbtn" disabled={!!busy} onClick={() => wallet("google")}>{GOOGLE}{p("google")}</button>
                    </div>
                </div>
            </div>
        </section>
    );
}
