import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PasswordInput from "@/components/auth/PasswordInput";
import { Mail, Loader2, Ticket, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/i18n/translations";
import { getToken } from "@/utils/auth";
import { fill, fmtDate } from "@/components/dashboard/panelUtils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Strona zaproszenia na miejsce: /einladung/:token. Warianty: nowe konto, logowanie, zalogowany
// właściwą osobą, zalogowany kimś innym, link nieważny. Pełny e-mail nie trafia do przeglądarki.

type Info =
    | { status: "valid"; kind: "online" | "practical"; course: string; buyer: { name: string; company?: string; label: string };
        maskedEmail: string; language: Language; accountExists: boolean; viewer: "anonymous" | "match" | "other";
        practical: { startDate: string; endDate: string; location: string; address: string } | null;
        onlineExpiresAt: string | null; linkExpiresAt: string }
    | { status: "used"; mine: boolean }
    | { status: "expired" | "invalid" };

const T = {
    title:       { de: "Ihr Platz bei STAPLERO", en: "Your place at STAPLERO", uk: "Ваше місце в STAPLERO", pl: "Twoje miejsce w STAPLERO" },
    bookedBy:    { de: "{buyer} hat für Sie einen Platz gebucht.", en: "{buyer} has booked a place for you.", uk: "{buyer} має для вас місце на курсі.", pl: "{buyer} ma dla Ciebie miejsce na kursie." },
    course:      { de: "Kurs", en: "Course", uk: "Курс", pl: "Kurs" },
    date:        { de: "Termin", en: "Date", uk: "Дата", pl: "Termin" },
    place:       { de: "Ort", en: "Location", uk: "Місце", pl: "Miejsce" },
    access:      { de: "Online-Zugang", en: "Online access", uk: "Онлайн-доступ", pl: "Dostęp online" },
    until:       { de: "bis {d}", en: "until {d}", uk: "до {d}", pl: "do {d}" },
    accessNote:  { de: "Der Zugang läuft seit dem Kauf. Aktivieren Sie ihn jetzt, dann bleibt Ihnen die volle Lernzeit.", en: "Access started with the purchase. Activate it now to keep the full learning time.", uk: "Доступ діє з моменту покупки. Активуйте його зараз, щоб мати весь час на навчання.", pl: "Dostęp liczy się od zakupu. Aktywuj go teraz, żeby mieć cały czas na naukę." },
    linkValid:   { de: "Dieser Link ist bis {d} gültig und funktioniert einmal.", en: "This link is valid until {d} and works once.", uk: "Це посилання дійсне до {d} і спрацьовує один раз.", pl: "Ten link jest ważny do {d} i działa jeden raz." },
    forEmail:    { de: "Einladung für", en: "Invitation for", uk: "Запрошення для", pl: "Zaproszenie dla" },
    newTitle:    { de: "Konto anlegen und Zugang aktivieren", en: "Create an account and activate access", uk: "Створіть акаунт і активуйте доступ", pl: "Załóż konto i aktywuj dostęp" },
    newSub:      { de: "Ein Schritt: Name und Passwort. Die E-Mail-Adresse steht schon fest.", en: "One step: name and password. The email address is already set.", uk: "Один крок: ім’я та пароль. Електронна адреса вже вказана.", pl: "Jeden krok: imię i hasło. Adres e-mail jest już ustawiony." },
    newSubmit:   { de: "Konto anlegen und aktivieren", en: "Create account and activate", uk: "Створити акаунт і активувати", pl: "Załóż konto i aktywuj" },
    loginTitle:  { de: "Anmelden und Zugang aktivieren", en: "Log in and activate access", uk: "Увійдіть і активуйте доступ", pl: "Zaloguj się i aktywuj dostęp" },
    loginSub:    { de: "Zu dieser E-Mail-Adresse gibt es schon ein Konto.", en: "There is already an account for this email address.", uk: "Для цієї адреси вже є акаунт.", pl: "Dla tego adresu e-mail istnieje już konto." },
    loginSubmit: { de: "Anmelden und aktivieren", en: "Log in and activate", uk: "Увійти й активувати", pl: "Zaloguj się i aktywuj" },
    forgotSent:  { de: "Wir haben einen Link zum Zurücksetzen an {e} geschickt. Danach öffnen Sie diese Einladung erneut.", en: "We sent a reset link to {e}. Afterwards, open this invitation again.", uk: "Ми надіслали посилання для скидання на {e}. Після цього знову відкрийте це запрошення.", pl: "Wysłaliśmy link do zmiany hasła na {e}. Potem otwórz to zaproszenie ponownie." },
    matchTitle:  { de: "Zugang aktivieren", en: "Activate access", uk: "Активувати доступ", pl: "Aktywuj dostęp" },
    matchSub:    { de: "Sie sind mit der eingeladenen E-Mail-Adresse angemeldet.", en: "You are logged in with the invited email address.", uk: "Ви увійшли з адресою, на яку надіслано запрошення.", pl: "Jesteś zalogowany adresem, na który wysłano zaproszenie." },
    otherTitle:  { de: "Andere Anmeldung", en: "Different account", uk: "Інший акаунт", pl: "Inne konto" },
    otherSub:    { de: "Diese Einladung ist für {e}. Sie sind gerade mit {me} angemeldet. Melden Sie sich ab und öffnen Sie die Einladung mit der richtigen E-Mail-Adresse.", en: "This invitation is for {e}. You are logged in as {me}. Log out and open the invitation with the right email address.", uk: "Це запрошення для {e}. Зараз ви увійшли як {me}. Вийдіть і відкрийте запрошення з правильною адресою.", pl: "To zaproszenie jest dla {e}. Jesteś zalogowany jako {me}. Wyloguj się i otwórz zaproszenie właściwym adresem." },
    logout:      { de: "Abmelden", en: "Log out", uk: "Вийти", pl: "Wyloguj się" },
    activated:   { de: "Zugang aktiviert", en: "Access activated", uk: "Доступ активовано", pl: "Dostęp aktywowany" },
    activatedTx: { de: "Ihr Platz ist jetzt in Ihrem Kundenkonto.", en: "Your place is now in your account.", uk: "Ваше місце тепер у вашому кабінеті.", pl: "Twoje miejsce jest teraz w Twoim panelu." },
    toAccount:   { de: "Zum Kundenkonto", en: "Go to my account", uk: "До кабінету", pl: "Do panelu" },
    usedTitle:   { de: "Einladung bereits angenommen", en: "Invitation already accepted", uk: "Запрошення вже прийнято", pl: "Zaproszenie zostało już przyjęte" },
    usedTx:      { de: "Dieser Link wurde schon verwendet. Melden Sie sich mit dem Konto an, mit dem Sie die Einladung angenommen haben.", en: "This link has already been used. Log in with the account you used to accept the invitation.", uk: "Це посилання вже використано. Увійдіть з акаунтом, яким ви прийняли запрошення.", pl: "Ten link został już użyty. Zaloguj się kontem, którym przyjęto zaproszenie." },
    toLogin:     { de: "Zur Anmeldung", en: "Go to login", uk: "До входу", pl: "Do logowania" },
    badTitle:    { de: "Dieser Link funktioniert nicht mehr", en: "This link no longer works", uk: "Це посилання більше не працює", pl: "Ten link już nie działa" },
    expiredTx:   { de: "Die Einladung ist abgelaufen. Bitten Sie die Person, die gebucht hat, Ihnen eine neue Einladung zu schicken.", en: "The invitation has expired. Ask the person who booked to send you a new invitation.", uk: "Термін дії запрошення минув. Попросіть особу, яка бронювала, надіслати нове запрошення.", pl: "Zaproszenie wygasło. Poproś osobę, która dokonała rezerwacji, o nowe zaproszenie." },
    invalidTx:   { de: "Der Link ist ungültig oder wurde durch eine neuere Einladung ersetzt. Nutzen Sie den Link aus der neuesten E-Mail oder fragen Sie die Person, die gebucht hat.", en: "The link is invalid or has been replaced by a newer invitation. Use the link from the latest email or ask the person who booked.", uk: "Посилання недійсне або його замінило новіше запрошення. Скористайтеся посиланням з останнього листа або зверніться до особи, яка бронювала.", pl: "Link jest nieprawidłowy albo zastąpiło go nowsze zaproszenie. Użyj linku z najnowszej wiadomości albo zapytaj osobę, która dokonała rezerwacji." },
    contact:     { de: "Fragen? Schreiben Sie uns an", en: "Questions? Write to us at", uk: "Є питання? Напишіть нам на", pl: "Masz pytania? Napisz do nas na" },
    errWrong:    { de: "Diese Einladung ist für eine andere E-Mail-Adresse.", en: "This invitation is for a different email address.", uk: "Це запрошення для іншої адреси.", pl: "To zaproszenie jest dla innego adresu e-mail." },
    errExists:   { de: "Zu dieser E-Mail-Adresse gibt es schon ein Konto. Bitte melden Sie sich an.", en: "An account already exists for this email address. Please log in.", uk: "Для цієї адреси вже є акаунт. Будь ласка, увійдіть.", pl: "Dla tego adresu istnieje już konto. Zaloguj się." },
} as const;
type Key = keyof typeof T;

// kod błędu z backendu → tekst (wspólne klucze z logowaniem i rejestracją)
const ERR: Record<string, string> = {
    MISSING_FIELDS: "register.errMissing",
    NAME_TOO_LONG: "register.errName",
    PASSWORD_LENGTH: "register.errPassword",
    LOGIN_FAILED: "login.errFailed",
    RATE_LIMITED: "login.errRate",
};

const Invitation = () => {
    const { token = "" } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const auth = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const L = (k: Key, v: Record<string, string | number> = {}) => fill(T[k][language] ?? T[k].de, v);

    const [info, setInfo] = useState<Info | null>(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [forgotSent, setForgotSent] = useState(false);
    const [done, setDone] = useState(false);
    const [form, setForm] = useState({ firstName: "", lastName: "", password: "" });
    const passwordRef = useRef<HTMLInputElement>(null);
    const langApplied = useRef(false);

    const load = useCallback(async () => {
        setLoadFailed(false);
        try {
            const tk = getToken();
            const res = await fetch(`${API_URL}/invitations/${encodeURIComponent(token)}`, {
                headers: tk && localStorage.getItem("isLoggedIn") === "true" ? { Authorization: `Bearer ${tk}` } : {},
            });
            if (res.status === 429) { setError("login.errRate"); setLoadFailed(true); return; }
            const data = await res.json();
            setInfo(data);
            // Język zaproszenia przy pierwszym otwarciu; potem działa przełącznik języka strony
            if (data.status === "valid" && !langApplied.current) {
                langApplied.current = true;
                const flag = `invite-lang-${token.slice(0, 12)}`;
                try {
                    if (!sessionStorage.getItem(flag)) {
                        sessionStorage.setItem(flag, "1");
                        if (data.language && data.language !== language) setLanguage(data.language);
                    }
                } catch { /* prywatne okno */ }
            }
        } catch {
            setLoadFailed(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    useEffect(() => { load(); }, [load]);

    const finish = (data: any) => {
        if (data?.token && data?.user) auth.login(data.user, data.token);
        setDone(true);
        toast({ title: L("activated"), description: L("activatedTx") });
        navigate(data?.redirect || "/dashboard#kurse");
    };

    const fail = (code?: string) => {
        if (code === "EXPIRED") return setInfo({ status: "expired" });
        if (code === "INVALID") return setInfo({ status: "invalid" });
        if (code === "USED") return setInfo({ status: "used", mine: false });
        if (code === "WRONG_ACCOUNT") return setError("__wrong");
        if (code === "ACCOUNT_EXISTS") { setError("__exists"); load(); return; }
        setError(ERR[code || ""] || "register.errServer");
    };

    const post = async (path: string, body?: object, withAuth = false) => {
        const tk = getToken();
        const res = await fetch(`${API_URL}/invitations/${encodeURIComponent(token)}/${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(withAuth && tk ? { Authorization: `Bearer ${tk}` } : {}) },
            body: JSON.stringify(body || {}),
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data };
    };

    const submit = async (e: React.FormEvent, mode: "register" | "login" | "claim") => {
        e.preventDefault();
        if (busy) return;
        setError(null);
        if (mode === "register" && (!form.firstName.trim() || !form.lastName.trim() || !form.password)) return setError("register.errMissing");
        if (mode === "register" && form.password.length < 6) return setError("register.errPassword");
        if (mode === "login" && !form.password) return setError("login.errMissing");
        setBusy(true);
        try {
            const r = mode === "register"
                ? await post("register", { firstName: form.firstName.trim(), lastName: form.lastName.trim(), password: form.password, language })
                : mode === "login"
                    ? await post("login", { password: form.password })
                    : await post("claim", {}, true);
            if (!r.ok) {
                fail(r.data?.code || (r.status === 429 ? "RATE_LIMITED" : ""));
                if (mode === "login") passwordRef.current?.focus();
                return;
            }
            finish(r.data);
        } catch {
            setError("register.errServer");
        } finally {
            setBusy(false);
        }
    };

    const forgot = async () => {
        setError(null);
        const r = await post("forgot").catch(() => null);
        if (r?.ok) setForgotSent(true);
        else fail(r?.data?.code || (r?.status === 429 ? "RATE_LIMITED" : ""));
    };

    const logout = () => {
        auth.logout();
        setError(null);
        load();
    };

    const errorText = error === "__wrong" ? L("errWrong") : error === "__exists" ? L("errExists") : error ? t(error) : "";
    const errorBox = error && (
        <div id="invite-error" role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-3.5 py-3 text-sm text-destructive">{errorText}</div>
    );
    const contactLine = (
        <p className="mt-6 text-center text-sm text-muted-foreground">
            {L("contact")} <a href="mailto:info@staplero.de" className="text-primary font-medium hover:underline">info@staplero.de</a>
        </p>
    );

    const shell = (children: React.ReactNode) => (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-start sm:items-center justify-center pt-24 pb-16 md:py-24 px-4">{children}</main>
            <Footer />
        </div>
    );

    if (!info) {
        return shell(loadFailed
            ? <Card className="w-full max-w-md"><CardContent className="pt-6 text-center space-y-4"><p className="text-muted-foreground">{error ? t(error) : t("register.errServer")}</p><Button onClick={load}>OK</Button></CardContent></Card>
            : <p className="text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />{t("checkoutSuccess.loading").replace(/\.\.\.$/, "")}</p>);
    }

    // ── Nieważny / wygasły / już użyty link ─────────────────────────────────
    if (info.status !== "valid") {
        const used = info.status === "used";
        const mine = used && info.mine;
        return shell(
            <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-xl">
                <CardHeader className="text-center px-0 pt-2 sm:px-6 sm:pt-6">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${mine ? "bg-success/10" : "bg-muted"}`} aria-hidden="true">
                        {mine ? <CheckCircle className="w-8 h-8 text-success" /> : <AlertCircle className="w-8 h-8 text-muted-foreground" />}
                    </div>
                    <CardTitle className="font-display text-2xl">{mine ? L("activated") : used ? L("usedTitle") : L("badTitle")}</CardTitle>
                    <CardDescription className="text-base">{mine ? L("activatedTx") : used ? L("usedTx") : info.status === "expired" ? L("expiredTx") : L("invalidTx")}</CardDescription>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                    {(mine || used) && (
                        <Button asChild className="w-full" size="lg">
                            <Link to={mine ? "/dashboard#kurse" : "/login"}>{mine ? L("toAccount") : L("toLogin")}</Link>
                        </Button>
                    )}
                    {contactLine}
                </CardContent>
            </Card>
        );
    }

    // ── Ważne zaproszenie ───────────────────────────────────────────────────
    const lang = language as Language;
    const p = info.practical;
    const courseDate = p
        ? p.endDate && p.endDate !== p.startDate
            ? `${fmtDate(p.startDate, lang, { day: "numeric", month: "long" })} – ${fmtDate(p.endDate, lang, { day: "numeric", month: "long", year: "numeric" })}`
            : fmtDate(p.startDate, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
        : "";
    const viewer = auth.isLoggedIn ? info.viewer : "anonymous";

    const lockedEmail = (
        <div className="space-y-2">
            <Label htmlFor="invite-email">{t("login.email")}</Label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input id="invite-email" value={info.maskedEmail} readOnly aria-readonly="true" tabIndex={-1} className="h-11 pl-10 pr-10 bg-muted/60 text-foreground" />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </div>
        </div>
    );

    const legal = t("register.legal").split(/(\{terms\}|\{privacy\})/).map((part, i) =>
        part === "{terms}" ? <Link key={i} to="/agb" target="_blank" className="underline underline-offset-2 hover:text-foreground">{t("register.terms")}</Link>
            : part === "{privacy}" ? <Link key={i} to="/datenschutz" target="_blank" className="underline underline-offset-2 hover:text-foreground">{t("register.privacy")}</Link>
                : part);

    let action: React.ReactNode;
    if (viewer === "match") {
        action = (
            <form onSubmit={(e) => submit(e, "claim")} className="space-y-4" noValidate>
                <div>
                    <h2 className="font-display text-xl font-bold text-foreground">{L("matchTitle")}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{L("matchSub")}</p>
                </div>
                {errorBox}
                <Button type="submit" className="w-full" size="lg" disabled={busy || done} aria-busy={busy}>
                    {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : null}{L("matchTitle")}
                </Button>
            </form>
        );
    } else if (viewer === "other") {
        action = (
            <div className="space-y-4">
                <div>
                    <h2 className="font-display text-xl font-bold text-foreground">{L("otherTitle")}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{L("otherSub", { e: info.maskedEmail, me: auth.userEmail })}</p>
                </div>
                <Button type="button" variant="outline" className="w-full" size="lg" onClick={logout}>{L("logout")}</Button>
            </div>
        );
    } else if (info.accountExists) {
        action = (
            <form onSubmit={(e) => submit(e, "login")} className="space-y-4" noValidate>
                <div>
                    <h2 className="font-display text-xl font-bold text-foreground">{L("loginTitle")}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{L("loginSub")}</p>
                </div>
                {lockedEmail}
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="invite-password">{t("login.password")}</Label>
                        <button type="button" onClick={forgot} className="text-sm text-primary hover:underline font-medium min-h-[44px] sm:min-h-0">{t("login.forgot")}</button>
                    </div>
                    <PasswordInput id="invite-password" ref={passwordRef} autoComplete="current-password" value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-11"
                        aria-invalid={!!error || undefined} aria-describedby={error ? "invite-error" : undefined} />
                </div>
                {forgotSent && <p role="status" className="rounded-md border border-border bg-muted/50 px-3.5 py-3 text-sm text-foreground">{L("forgotSent", { e: info.maskedEmail })}</p>}
                {errorBox}
                <Button type="submit" className="w-full" size="lg" disabled={busy || done} aria-busy={busy}>
                    {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />{t("login.loading")}</> : L("loginSubmit")}
                </Button>
            </form>
        );
    } else {
        action = (
            <form onSubmit={(e) => submit(e, "register")} className="space-y-4" noValidate>
                <div>
                    <h2 className="font-display text-xl font-bold text-foreground">{L("newTitle")}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{L("newSub")}</p>
                </div>
                {lockedEmail}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="invite-first">{t("register.firstName")}</Label>
                        <Input id="invite-first" autoComplete="given-name" value={form.firstName} maxLength={50}
                            onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="h-11" placeholder={t("register.firstNamePlaceholder")} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="invite-last">{t("register.lastName")}</Label>
                        <Input id="invite-last" autoComplete="family-name" value={form.lastName} maxLength={50}
                            onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="h-11" placeholder={t("register.lastNamePlaceholder")} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="invite-new-password">{t("register.password")}</Label>
                    <PasswordInput id="invite-new-password" autoComplete="new-password" value={form.password} minLength={6}
                        onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-11" aria-describedby="invite-pw-hint" />
                    <p id="invite-pw-hint" className="text-xs text-muted-foreground">{t("register.passwordHint")}</p>
                </div>
                {errorBox}
                <Button type="submit" className="w-full" size="lg" disabled={busy || done} aria-busy={busy}>
                    {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />{t("register.loading")}</> : L("newSubmit")}
                </Button>
                <p className="text-xs text-muted-foreground text-center">{legal}</p>
            </form>
        );
    }

    return shell(
        <Card className="w-full max-w-lg border-0 shadow-none sm:border sm:shadow-xl">
            <CardHeader className="text-center px-0 pt-2 sm:px-6 sm:pt-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center" aria-hidden="true">
                    <Ticket className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="font-display text-2xl">{L("title")}</CardTitle>
                <CardDescription className="text-base">{L("bookedBy", { buyer: info.buyer.label })}</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6 space-y-6">
                <dl className="rounded-lg border border-border divide-y divide-border text-sm">
                    <div className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:gap-4">
                        <dt className="text-muted-foreground sm:w-32 shrink-0">{L("course")}</dt>
                        <dd className="font-semibold text-foreground">{info.course}</dd>
                    </div>
                    {p && <>
                        <div className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:gap-4">
                            <dt className="text-muted-foreground sm:w-32 shrink-0">{L("date")}</dt>
                            <dd className="font-semibold text-foreground">{courseDate}</dd>
                        </div>
                        <div className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:gap-4">
                            <dt className="text-muted-foreground sm:w-32 shrink-0">{L("place")}</dt>
                            <dd className="text-foreground"><span className="font-semibold">{p.location}</span>{p.address && <span className="block text-muted-foreground">{p.address}</span>}</dd>
                        </div>
                    </>}
                    {info.onlineExpiresAt && (
                        <div className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:gap-4">
                            <dt className="text-muted-foreground sm:w-32 shrink-0">{L("access")}</dt>
                            <dd className="font-semibold text-foreground">{L("until", { d: fmtDate(info.onlineExpiresAt, lang, { day: "numeric", month: "long", year: "numeric" }) })}</dd>
                        </div>
                    )}
                    <div className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:gap-4">
                        <dt className="text-muted-foreground sm:w-32 shrink-0">{L("forEmail")}</dt>
                        <dd className="font-semibold text-foreground break-all">{info.maskedEmail}</dd>
                    </div>
                </dl>
                {info.onlineExpiresAt && <p className="text-sm text-muted-foreground -mt-2">{L("accessNote")}</p>}

                {action}

                <p className="text-xs text-muted-foreground text-center">
                    {L("linkValid", { d: fmtDate(info.linkExpiresAt, lang, { day: "numeric", month: "long", year: "numeric" }) })}
                </p>
                {contactLine}
            </CardContent>
        </Card>
    );
};

export default Invitation;
