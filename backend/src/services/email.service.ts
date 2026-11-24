import { Resend } from "resend";
import fs from "fs";
import os from "os";
import path from "path";
import {
    escapeHtml,
    renderEmail,
    LayoutOptions,
    p,
    strong,
    sectionLabel,
    button,
    infoTable,
    callout,
    twoColumns,
    sectionTitle,
    checklist,
    photoSteps,
    numberedList,
    labeledPill,
    timelineItem,
    heroText,
    heroTicket,
    heroButtons,
    heroButton,
    steps,
    seatList,
} from "./emailTemplates";
import { Content, MailLang, MAIL_LOCALES } from "./mailTemplateCatalog";
import { defaultContent, fmt, fmtPlain, getTemplate, pickLanguage, resolveBookingTemplateKey, resolveContent } from "./mailTemplates.service";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "STAPLERO <noreply@staplero.com>";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://staplero.de";
// Obrazki w mailach (logo, zdjęcia dojazdu) muszą być pod publicznym adresem z ważnym SSL —
// przy FRONTEND_URL=localhost (testy) albo staplero.com (zły certyfikat) klient pocztowy ich nie pokaże.
const EMAIL_ASSETS_URL = (process.env.EMAIL_ASSETS_URL || "https://staplero.de").replace(/\/$/, "");

type SendPayload = Parameters<typeof resend.emails.send>[0];

/**
 * Resend nie rzuca wyjątków — błąd (np. rate limit, zły adres) wraca w `{ error }`.
 * Bez sprawdzenia maile ginęły po cichu. Tu: ponawiamy przy rate limit / 5xx, inaczej rzucamy.
 */
const sendMail = async (payload: SendPayload, attempts = 4): Promise<void> => {
    // MAIL_DRY_RUN=1 (tylko poza produkcją): nic nie wysyłamy, HTML ląduje w pliku do obejrzenia
    if (process.env.MAIL_DRY_RUN === "1" && process.env.NODE_ENV !== "production") {
        const dir = process.env.MAIL_DRY_RUN_DIR || os.tmpdir();
        const file = path.join(dir, `mail-${Date.now()}-${String(payload.to).replace(/[^a-z0-9@.+-]/gi, "_")}.html`);
        await fs.promises.mkdir(dir, { recursive: true });
        await fs.promises.writeFile(file, String((payload as any).html ?? ""));
        console.log(`✉️  [MAIL_DRY_RUN] an ${payload.to} "${payload.subject}" → ${file}`);
        return;
    }
    for (let attempt = 1; ; attempt++) {
        let error: any;
        try {
            ({ error } = await resend.emails.send(payload));
        } catch (err: any) {
            error = err;
        }
        if (!error) return;

        const status = error.statusCode ?? error.status;
        const retryable = error.name === "rate_limit_exceeded" || status === 429 || (status ?? 500) >= 500;
        console.error(`❌ Resend (${attempt}/${attempts}) an ${payload.to} "${payload.subject}":`, error.name || "", error.message || error);
        if (!retryable || attempt >= attempts) {
            throw new Error(`E-Mail an ${payload.to} fehlgeschlagen: ${error.message || error.name || "unbekannter Fehler"}`);
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
};

const layout = (o: Omit<LayoutOptions, "baseUrl">) =>
    renderEmail({ baseUrl: FRONTEND_URL, assetsUrl: EMAIL_ASSETS_URL, ...o });

const deDate = (d: Date | string, opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }) =>
    new Date(d).toLocaleDateString("de-DE", opts);

// ─── Zertyfikat ────────────────────────────────────────────────────────────────

interface CertificateEmailOptions {
    to: string;
    userName: string;
    certId: string;
    verificationCode: string;
    certType: "online" | "practical";
    trainingDate: Date;
    trainingLocation?: string;
    pdfBuffer: Buffer;
    instructorName?: string;
}

export const sendCertificateEmail = async (opts: CertificateEmailOptions): Promise<void> => {
    const {
        to, userName, certId, verificationCode,
        certType, trainingDate, trainingLocation, pdfBuffer, instructorName,
    } = opts;

    const verifyUrl = `${FRONTEND_URL}/verify/${verificationCode}`;
    // Trasy Wallet wymagają zalogowania, więc z maila prowadzimy do zakładki z certyfikatem w panelu
    const certTabUrl = `${FRONTEND_URL}/dashboard#zertifikate`;

    const typeLabel = certType === "practical"
        ? "Praxiskurs: Gabelstapler-Fahrausweis"
        : "Online-Theoriekurs";

    const rows: Array<[string, string]> = [
        ["Name", escapeHtml(userName)],
        ["Kurs", typeLabel],
        ["Ausbildungsdatum", deDate(trainingDate)],
    ];
    if (trainingLocation) rows.push(["Ausbildungsort", escapeHtml(trainingLocation)]);
    if (instructorName) rows.push(["Ausbilder", escapeHtml(instructorName)]);
    rows.push(["Zertifikat-Nr.", `<span style="font-family:'Courier New',monospace;letter-spacing:1px;">${escapeHtml(verificationCode)}</span>`]);

    const bodyHtml = `
      ${p(`Sie haben Ihre Ausbildung zum Gabelstaplerfahrer erfolgreich abgeschlossen. Im Anhang dieser E-Mail finden Sie Ihren ${strong("Staplerschein als PDF")}.`)}
      ${sectionLabel("Befähigungsnachweis")}
      ${infoTable(rows)}
      ${callout(`${strong("DGUV Vorschrift 68")} für Flurförderzeuge<br>${strong("DGUV Grundsatz 308-001")} für Ausbildung und Beauftragung`, "gray")}
      ${sectionLabel("Zertifikat speichern")}
      ${button(certTabUrl, "Zertifikat im Kundenbereich öffnen", "primary")}
      ${p("Dort können Sie das PDF herunterladen und den Staplerschein zu Apple Wallet oder Google Wallet hinzufügen.", { small: true, muted: true })}
      ${sectionLabel("Echtheitsprüfung für Arbeitgeber")}
      ${p(`Der Code ${strong(escapeHtml(verificationCode))} kann von jedem Arbeitgeber ohne Anmeldung geprüft werden unter:<br><a href="${verifyUrl}" style="color:#111111;">${verifyUrl}</a>`)}
      ${callout(`${strong("Wichtig:")} Bitte bewahren Sie dieses Zertifikat sorgfältig auf.`)}
    `;

    const html = layout({
        title: "Ihr Staplerschein",
        preheader: `Herzlichen Glückwunsch, ${userName}! Ihr Staplerschein liegt als PDF bei.`,
        eyebrow: "Zertifikat ausgestellt",
        headline: `Herzlichen Glückwunsch, ${escapeHtml(userName)}!`,
        bodyHtml,
    });

    await sendMail({
        from: FROM_EMAIL,
        to,
        subject: `STAPLERO: Ihr Staplerschein ist ausgestellt (${verificationCode})`,
        html,
        attachments: [
            {
                filename: `Staplerschein-${verificationCode}.pdf`,
                content: pdfBuffer,
            },
        ],
    });
};

// ─── Konto: Willkommen, Passwort zurücksetzen ──────────────────────────────────

/** Mail powitalny z szablonu „account-welcome” (edytowalny w panelu) */
export const renderWelcomeEmail = (T: Content, lang: MailLang, o: { to: string; name: string }): { subject: string; html: string } => {
    const vars = { name: o.name, email: o.to, coursesUrl: `${FRONTEND_URL}/schulungen`, resetUrl: `${FRONTEND_URL}/forgot-password` };
    const F = (t: unknown) => fmt(t, vars);
    const stepsList: any[] = Array.isArray(T.steps) ? T.steps : [];
    const bodyHtml = `
      ${p(F(T.intro))}
      ${button(`${FRONTEND_URL}/dashboard`, F(T.cta))}
      ${stepsList.length ? `${sectionTitle(F(T.stepsTitle))}${steps(stepsList.map((s) => ({ title: F(s.title), text: F(s.text) })))}` : ""}
      ${String(T.forgot || "").trim() ? p(F(T.forgot), { small: true, muted: true }) : ""}
      ${p(F(T.closing))}
    `;
    return {
        subject: fmtPlain(T.subject, vars),
        html: layout({
            title: fmtPlain(T.headline, vars),
            preheader: fmtPlain(T.preheader, vars),
            eyebrow: String(T.eyebrow || "").trim() ? F(T.eyebrow) : undefined,
            eyebrowTone: "success",
            headline: F(T.headline),
            bodyHtml,
            lang,
        }),
    };
};

/** Po rejestracji (także bez zakupu) i po założeniu konta w checkoucie. Język: strona przy rejestracji. */
export const sendWelcomeEmail = async (to: string, name: string, language?: string | null): Promise<void> => {
    const lang = pickLanguage(language);
    const T = await resolveContent("account-welcome", lang);
    const { subject, html } = renderWelcomeEmail(T, lang, { to, name });
    await sendMail({ from: FROM_EMAIL, to, subject, html });
};

export const sendPasswordResetEmail = async (to: string, name: string, resetUrl: string): Promise<void> => {
    const bodyHtml = `
      ${p(`Hallo ${strong(escapeHtml(name))},`)}
      ${p("wir haben eine Anfrage erhalten, das Passwort für Ihr STAPLERO Konto zurückzusetzen. Klicken Sie auf die Schaltfläche, um ein neues Passwort festzulegen:")}
      ${button(resetUrl, "Neues Passwort festlegen")}
      ${callout(`Dieser Link ist ${strong("1 Stunde")} gültig und kann nur einmal verwendet werden.<br>Wenn Sie kein neues Passwort angefordert haben, können Sie diese E-Mail ignorieren. Ihr Passwort bleibt dann unverändert.`)}
      ${p(`Falls die Schaltfläche nicht funktioniert, kopieren Sie diesen Link in die Adresszeile Ihres Browsers:<br><a href="${resetUrl}" style="color:#111111;word-break:break-all;">${resetUrl}</a>`, { small: true, muted: true })}
      ${p(strong("Ihr STAPLERO Team"))}
    `;

    await sendMail({
        from: FROM_EMAIL,
        to,
        subject: "Passwort zurücksetzen: STAPLERO",
        html: layout({
            title: "Passwort zurücksetzen",
            preheader: "Legen Sie jetzt ein neues Passwort fest. Der Link ist 1 Stunde gültig.",
            eyebrow: "Sicherheit",
            headline: "Passwort zurücksetzen",
            bodyHtml,
        }),
    });
};

export const sendPasswordChangedEmail = async (to: string, name: string): Promise<void> => {
    const bodyHtml = `
      ${p(`Hallo ${strong(escapeHtml(name))},`)}
      ${p("das Passwort für Ihr STAPLERO Konto wurde soeben geändert. Sie können sich ab sofort mit dem neuen Passwort anmelden.")}
      ${button(`${FRONTEND_URL}/login`, "Zum Login")}
      ${callout(`${strong("Das waren nicht Sie?")} Setzen Sie Ihr Passwort bitte sofort erneut zurück oder schreiben Sie uns an <a href="mailto:info@staplero.de" style="color:#111111;">info@staplero.de</a>.`)}
      ${p(strong("Ihr STAPLERO Team"))}
    `;

    await sendMail({
        from: FROM_EMAIL,
        to,
        subject: "Ihr Passwort wurde geändert: STAPLERO",
        html: layout({
            title: "Passwort geändert",
            preheader: "Ihr Passwort wurde erfolgreich geändert.",
            eyebrow: "Sicherheit",
            headline: "Passwort geändert",
            bodyHtml,
        }),
    });
};

// ─── Bestellungen und Kurse ────────────────────────────────────────────────────

// ─── Maile z szablonów (teksty edytowane w panelu: Admin → E-Mail-Vorlagen) ───

const BERLIN_TZ = "Europe/Berlin";
const COURSE_HOURS = { from: "09:00", to: "17:00" };
const PHONE_1 = { href: "tel:+4916092490070", label: "+49 160 92490070" };
const PHONE_2 = { href: "tel:+4917622067783", label: "+49 176 22067783" };
const WHATSAPP_URL = "https://wa.me/4917622067783";

// Zdjęcia kolejnych kroków dojazdu do NLND Berlin (public/); teksty w szablonie „gemeinsame Texte”
const berlinArrivalImages = [
    { image: "anfahrt-berlin-1.jpg", alt: "Neuköllnische Allee" },
    { image: "anfahrt-berlin-2.jpg", alt: "Gebäude NLND Berlin" },
    { image: "anfahrt-berlin-3.jpg", alt: "Tor mit Hausnummer 80" },
    { image: "anfahrt-berlin-4.jpg", alt: "Wartebereich am Eingang" },
];

const addDays = (d: Date, days: number) => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
};

const berlinDate = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("de-DE", { timeZone: BERLIN_TZ, ...opts });

// yyyymmdd w strefie Berlina (do linku Google Kalendarza)
const calendarDay = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: BERLIN_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d).replace(/-/g, "");

/** Formatery dat w języku maila */
const dateFmt = (lang: MailLang) => {
    const f = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString(MAIL_LOCALES[lang], { timeZone: BERLIN_TZ, ...o });
    const long = (d: Date) => f(d, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    // bez dnia tygodnia — po „bis / do / до” (np. „do 29 listopada 2026”)
    const plain = (d: Date) => f(d, { year: "numeric", month: "long", day: "numeric" });
    const short = (d: Date) => f(d, { weekday: "short", day: "numeric", month: "short" });
    // krótka data do tematu: "12.11." (de/pl/uk) albo "12 Nov" (en)
    const tiny = (d: Date) => (lang === "en" ? f(d, { day: "numeric", month: "short" }) : berlinDate(d, { day: "2-digit", month: "2-digit" }));
    const range = (a: Date, b: Date) => {
        if (calendarDay(a) === calendarDay(b)) return tiny(a);
        if (lang === "en") return `${f(a, { day: "numeric" })}–${tiny(b)}`;
        return berlinDate(a, { month: "2-digit" }) === berlinDate(b, { month: "2-digit" })
            ? `${berlinDate(a, { day: "2-digit" })}.–${tiny(b)}`
            : `${tiny(a)}–${tiny(b)}`;
    };
    return { long, plain, short, tiny, range };
};

const cityOf = (locationName: string) => locationName.split(/[(\-–]/)[0].trim() || locationName;
const smallLabel = (text: string, color: string) =>
    `<span style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${color};">${text}</span>`;
const helpBox = (title: string, whatsapp: string) => callout(
    `${smallLabel(escapeHtml(title), "#c25e00")}<br>${strong(`<a href="${PHONE_1.href}" style="color:#111111;text-decoration:none;">${PHONE_1.label}</a>`)}<br>${strong(`<a href="${PHONE_2.href}" style="color:#111111;text-decoration:none;">${PHONE_2.label}</a>`)}<br><a href="${WHATSAPP_URL}" target="_blank" style="color:#111111;font-weight:700;">${escapeHtml(whatsapp)}</a>`,
    "orange",
);

// ─── Blok „Ihre Plätze” (szablon „seat-block”) ────────────────────────────────

/** Miejsce do pokazania w mailu kupującego. you = kupujący sam; invited = e-mail podany (zaproszenie wychodzi). */
export interface SeatMailLine {
    seatIndex: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    state: "you" | "claimed" | "invited" | "open";
}
export interface SeatBlockData {
    kind: "online" | "practical" | "package";
    seats: SeatMailLine[];
    onlineUntil?: Date | string; // online i pakiet: koniec dostępu liczony od płatności
    courseDay?: Date | string; // praktyka i pakiet: pierwszy dzień kursu
}

const SEAT_TONE: Record<SeatMailLine["state"], "green" | "orange" | "gray"> = { you: "green", claimed: "green", invited: "orange", open: "gray" };

/** Lista miejsc z imieniem, e-mailem i statusem + krótki tekst o późniejszym wpisywaniu i przycisk do panelu */
export const renderSeatBlock = (S: Content, lang: MailLang, b: SeatBlockData, opts: { first?: boolean; noButton?: boolean; noIntro?: boolean } = {}): string => {
    const D = dateFmt(lang);
    const vars = {
        until: b.kind === "practical"
            ? (b.courseDay ? D.plain(new Date(b.courseDay)) : "")
            : (b.onlineUntil ? D.plain(new Date(b.onlineUntil)) : ""),
        courseDay: b.courseDay ? D.plain(new Date(b.courseDay)) : "",
    };
    const F = (t: unknown, extra: Record<string, any> = {}) => fmt(t, { ...vars, ...extra });
    const intro = b.kind === "online" ? S.introOnline : b.kind === "practical" ? S.introPractical : S.introPackage;
    const rows = b.seats.map((seat) => ({
        label: F(S.seatLabel, { n: seat.seatIndex + 1 }),
        name: escapeHtml([seat.firstName, seat.lastName].filter(Boolean).join(" ")),
        email: seat.email ? escapeHtml(seat.email) : F(S.noEmail),
        status: F(S[seat.state]),
        tone: SEAT_TONE[seat.state],
    }));
    const note = b.kind !== "online" && String(S.participantsNote || "").trim() ? p(F(S.participantsNote), { small: true, muted: true }) : "";
    return `
      ${sectionTitle(F(S.title), opts.noIntro ? undefined : F(intro), { first: opts.first })}
      ${seatList(rows)}
      ${note}
      ${opts.noButton ? "" : button(`${FRONTEND_URL}/dashboard#bestellungen`, F(S.button), "outline")}`;
};

/** Blok pokazujemy przy kilku miejscach albo gdy kupujący sam nie uczestniczy */
const showSeatBlock = (b: SeatBlockData | undefined, buyerParticipates: boolean | undefined, S?: Content): b is SeatBlockData =>
    !!b && !!S && b.seats.length > 0 && (b.seats.length > 1 || buyerParticipates === false);

// ─── Potwierdzenie rezerwacji kursu na miejscu ───────────────────────────────

export interface PracticalCourseBookingEmailOptions {
    to: string;
    name: string;
    orderNumber: string;
    locationName: string; // nazwa terminu/miejsca, np. "Berlin (auf Englisch) Stufe 2 - Schubmaststapler"
    locationAddress: string;
    startDate: Date | string; // pierwszy dzień
    endDate?: Date | string; // ostatni dzień
    participants?: string[]; // uczestnicy wg kolejności; pierwsza osoba to zamawiający, gdy buyerParticipates !== false
    buyerParticipates?: boolean; // false = zamawiający sam nie uczestniczy (lista bez dopisku „Besteller”)
    language?: string; // język strony przy zakupie (de/en/uk/pl)
    productId?: string; // produkt → wybrany w panelu szablon
    locationId?: string; // gdy brak productId: produkt z terminu
    dateId?: string;
    templateKey?: string; // wymuszony szablon (podgląd/test)
    // Pakiet z teorią online: dostęp do kursu (nadany przy zapłacie) — krótki dopisek, szczegóły w osobnym mailu
    onlineAccess?: { courseName: string; expiresAt: Date | string; days?: number };
    time?: string; // godziny z terminu, np. "09:00 - 17:30"
    seatBlock?: SeatBlockData; // miejsca z zamówienia (blok „Ihre Plätze”)
    // Potwierdzenie dla osoby, która przyjęła zaproszenie: do niej, bez listy uczestników, bloku miejsc i storna
    seatHolder?: boolean;
}

type BookingData = Omit<PracticalCourseBookingEmailOptions, "language" | "productId" | "locationId" | "dateId" | "templateKey">;

/** Renderuje potwierdzenie rezerwacji z tekstów szablonu (C) i tekstów wspólnych (K) */
export const renderBookingEmail = (C: Content, K: Content, lang: MailLang, o: BookingData, S?: Content): { subject: string; html: string } => {
    const D = dateFmt(lang);
    const start = new Date(o.startDate);
    const end = o.endDate ? new Date(o.endDate) : start;
    const spanDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
    const ticket: Array<{ day: number; label: string }> = Array.isArray(C.ticket) ? C.ticket : [];
    const schedule: any[] = Array.isArray(C.schedule) ? C.schedule : [];
    const courseDays = Math.max(spanDays, ...ticket.map((t) => Number(t.day) || 1), ...schedule.map((s) => Number(s.day) || 1));
    const dayDate = (n: number) => addDays(start, Math.max(0, (Number(n) || 1) - 1));
    const lastDay = dayDate(courseDays);

    const m = (o.time || "").match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
    const from = m ? m[1].padStart(5, "0") : COURSE_HOURS.from;
    const to = m ? m[2].padStart(5, "0") : COURSE_HOURS.to;

    const people = o.participants?.length ? o.participants : [o.name];
    const city = cityOf(o.locationName);
    const isBerlin = /berlin/i.test(o.locationName) || /neuk[öo]llnische\s+allee/i.test(o.locationAddress);
    const access = o.onlineAccess;
    const vars: Record<string, string | number | undefined> = {
        name: o.name, course: C.courseName, city, location: o.locationName, address: o.locationAddress,
        dateRange: D.range(start, lastDay), startDate: D.long(start), endDate: D.long(lastDay),
        from, to, orderNumber: o.orderNumber, cancelUntil: D.long(addDays(start, -7)), count: people.length,
        days: access?.days, expires: access ? D.long(new Date(access.expiresAt)) : undefined,
        dashboardUrl: `${FRONTEND_URL}/dashboard`,
    };
    const F = (t: unknown, extra: Record<string, any> = {}) => fmt(t, { ...vars, ...extra });
    const hours = fmtPlain(K.hours, vars);

    const calendarUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE"
        + `&text=${encodeURIComponent(`STAPLERO ${fmtPlain(C.courseName)}`)}`
        + `&dates=${calendarDay(start)}T${from.replace(":", "")}00/${calendarDay(start)}T${to.replace(":", "")}00`
        + `&ctz=${encodeURIComponent(BERLIN_TZ)}`
        + (courseDays > 1 ? `&recur=${encodeURIComponent(`RRULE:FREQ=DAILY;COUNT=${courseDays}`)}` : "")
        + `&location=${encodeURIComponent(o.locationAddress)}`
        + `&details=${encodeURIComponent(o.seatHolder ? `STAPLERO ${fmtPlain(C.courseName)}` : `${o.orderNumber}`)}`;
    const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(o.locationAddress)}`;

    // Kupujący sam nie uczestniczy: teksty dla zamawiającego zamiast „Ihr Platz ist reserviert … wir freuen uns auf Sie”
    // Wariant „Buyer” mówi o uczestnikach („die Teilnehmenden …”), nie o zamawiającym („Sie … Ihr Staplerschein”).
    const seat = !!o.seatHolder;
    const buyerFirst = seat || o.buyerParticipates !== false;
    const filled = (v: unknown) => (Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== "");
    const pick = (key: string) => (!buyerFirst && filled(C[`${key}Buyer`]) ? C[`${key}Buyer`] : !buyerFirst && filled(K[`${key}Buyer`]) ? K[`${key}Buyer`] : C[key]);
    const pickK = (key: string) => (!buyerFirst && filled(K[`${key}Buyer`]) ? K[`${key}Buyer`] : K[key]);
    const ticketFooter = seat && filled(K.ticketFooterSeat) ? K.ticketFooterSeat : K.ticketFooter;

    const heroHtml = `
      ${heroText(F(pick("intro")).replace(/<strong>/g, '<strong style="color:#ffffff;">'))}
      ${heroTicket(
          (ticket.length ? ticket : [{ day: 1, label: "" }]).map((t) => ({ label: F(t.label), title: D.short(dayDate(t.day)), note: escapeHtml(hours) })),
          `<strong style="color:#ffffff;">${escapeHtml(o.locationName)}</strong> &middot; ${escapeHtml(o.locationAddress)}<br><span style="color:#b5b5b5;">${F(ticketFooter)}</span>`,
      )}
      ${heroButtons({ href: calendarUrl, label: escapeHtml(K.calendarButton) }, { href: routeUrl, label: escapeHtml(K.routeButton) })}
    `;

    const stepsK = pickK("arrivalSteps");
    const arrivalSteps: any[] = Array.isArray(stepsK) ? stepsK : [];
    const arrivalHtml = isBerlin
        ? `
      ${sectionTitle(F(K.findUsTitle), F(pickK("findUsText")))}
      ${photoSteps(berlinArrivalImages.map((img, i) => ({
          imageUrl: `${EMAIL_ASSETS_URL}/${img.image}`, alt: img.alt,
          title: F(arrivalSteps[i]?.title), text: F(arrivalSteps[i]?.text),
      })), escapeHtml(K.stepLabel || "Schritt"))}`
        : `
      ${sectionTitle(F(K.arrivalTitle))}
      ${p(F(pickK("arrivalText")))}`;

    // Kilka osób albo kupujący bez udziału: blok miejsc (imię, e-mail, status, link do panelu).
    // Bez danych o miejscach (stare zamówienie) — sama lista nazwisk.
    const participantsHtml = seat
        ? ""
        : showSeatBlock(o.seatBlock, o.buyerParticipates, S)
        ? renderSeatBlock(S!, lang, o.seatBlock!)
        : people.length > 1 || !buyerFirst
        ? `
      ${sectionTitle(F(K.participantsTitle))}
      ${numberedList(people.map((n, i) => i === 0 && buyerFirst ? `${escapeHtml(n)} <span style="font-weight:400;color:#707072;font-size:13px;">&middot; ${escapeHtml(K.buyer)}</span>` : escapeHtml(n)))}`
        : "";

    // Osoba z zaproszenia nie dostaje osobnego maila z dostępem: data końca i link do konta są tutaj
    const onlineNote = seat && filled(K.onlineNoteSeat) ? K.onlineNoteSeat : C.onlineNote;
    const onlineHtml = access && filled(onlineNote)
        ? callout(`${smallLabel(escapeHtml(K.onlineTitle), "#c25e00")}<br>${F(onlineNote)}`, "orange")
        : "";

    const seenDays = new Set<number>();
    const timelineHtml = schedule.map((s, i) => {
        const day = Number(s.day) || 1;
        const firstOfLaterDay = day > 1 && !seenDays.has(day);
        seenDays.add(day);
        const meta = String(s.meta || "").trim() ? F(s.meta, { date: D.short(dayDate(day)) }) : `${D.short(dayDate(day))} &middot; ${from}–${to}`;
        const text = F(s.text) + (isBerlin && firstOfLaterDay && K.berlinMeetAgain ? ` ${F(K.berlinMeetAgain)}` : "");
        return timelineItem({
            title: F(s.title), meta, text,
            extraHtml: filled(s.exam) ? labeledPill(escapeHtml(K.examLabel), F(!buyerFirst && filled(s.examBuyer) ? s.examBuyer : s.exam), s.highlight ? "orange" : "gray") : undefined,
            accent: s.highlight ? "orange" : undefined,
            last: i === schedule.length - 1,
        });
    }).join("");

    const bring: any[] = Array.isArray(C.bring) ? C.bring : [];
    // Storno to sprawa zamawiającego (umowa, opłata), nie osoby z zaproszenia
    const cancellation = seat ? "" : String(C.cancellation || "").trim();
    const help = helpBox(K.helpTitle, K.whatsapp);

    const bodyHtml = `
      ${filled(pick("requirement")) ? callout(F(pick("requirement")).replace(/^<strong>(.+?)<\/strong>(<br>)?/, (_m, t) => `${smallLabel(t, "#c25e00")}<br>`), "orange") : ""}

      ${sectionTitle(F(!buyerFirst && String(K.bringTitleBuyer || "").trim() ? K.bringTitleBuyer : K.bringTitle), undefined, { first: !filled(pick("requirement")) })}
      ${checklist(bring.map((b) => ({ title: F(b.title), note: String(b.note || "").trim() ? F(b.note) : undefined, tag: b.required ? escapeHtml(K.required) : undefined, strong: !!b.required })))}

      ${onlineHtml}

      ${arrivalHtml}

      ${participantsHtml}

      ${sectionTitle(F(C.scheduleTitle), String(C.scheduleLead || "").trim() ? F(C.scheduleLead) : undefined)}
      ${timelineHtml}
      ${filled(pick("afterSchedule")) ? p(F(pick("afterSchedule")), { small: true, muted: true }) : ""}

      ${cancellation
          ? twoColumns(callout(`${smallLabel(escapeHtml(K.cancellationTitle), "#707072")}<br>${F(cancellation)}`, "gray"), help)
          : help}

      ${p(F(pick("closing")))}
    `;

    return {
        subject: fmtPlain(pick("subject"), vars),
        html: layout({
            title: fmtPlain(K.docTitle),
            preheader: fmtPlain(pick("preheader"), vars),
            eyebrow: escapeHtml(K.eyebrow),
            eyebrowTone: "success",
            headline: escapeHtml(fmtPlain(pick("headline"), vars)),
            heroHtml,
            bodyHtml,
            lang,
        }),
    };
};

export const sendPracticalCourseBookingEmail = async (opts: PracticalCourseBookingEmailOptions): Promise<void> => {
    const key = opts.templateKey || await resolveBookingTemplateKey(opts);
    const lang = pickLanguage(opts.language, opts.locationName);
    const [C, K, S] = await Promise.all([resolveContent(key, lang), resolveContent("booking-common", lang), resolveContent("seat-block", lang)]);
    const { subject, html } = renderBookingEmail(C, K, lang, opts, S);
    console.log(`✉️  Buchung [${key}/${lang}] → ${opts.to}`);
    await sendMail({ from: FROM_EMAIL, to: opts.to, subject, html });
};

// ─── Pakiet: dostęp do teorii online przed kursem (osobny mail) ───────────────

export interface OnlineTheoryAccessEmailOptions {
    to: string;
    name: string;
    courseName: string; // kurs online, np. "Staplerschein Theorie"
    expiresAt: Date | string;
    days?: number; // długość dostępu z pakietu (np. 14)
    courseStart: Date | string; // pierwszy dzień kursu praktycznego
    locationName: string;
    participantsCount?: number;
    language?: string;
    seatBlock?: SeatBlockData; // pakiet dla kilku osób: kto ma już zaproszenie, które miejsca są wolne
}

export const renderOnlineTheoryAccessEmail = (T: Content, lang: MailLang, o: Omit<OnlineTheoryAccessEmailOptions, "language">, S?: Content): { subject: string; html: string } => {
    const D = dateFmt(lang);
    const expires = new Date(o.expiresAt);
    const start = new Date(o.courseStart);
    const city = cityOf(o.locationName);
    const dashboardUrl = `${FRONTEND_URL}/dashboard`;
    const vars = {
        name: o.name, email: o.to, course: o.courseName, days: o.days ?? "",
        expires: D.long(expires), expiresShort: D.short(expires), start: D.long(start), startShort: D.short(start),
        date: D.tiny(start), city, resetUrl: `${FRONTEND_URL}/forgot-password`,
    };
    const F = (t: unknown) => fmt(t, vars);
    const quoted = lang === "de" ? `„${escapeHtml(o.courseName)}“` : `“${escapeHtml(o.courseName)}”`;
    const stepsList: any[] = Array.isArray(T.steps) ? T.steps : [];

    const heroHtml = `
      ${heroText(F(T.intro).replace(/<strong>/g, '<strong style="color:#ffffff;">'))}
      ${heroTicket(
          [
              { label: F(T.accessLabel), title: o.days ? F(T.daysValue) : "Online", note: F(T.validUntil) },
              { label: F(T.courseLabel), title: D.short(start), note: escapeHtml(city) },
          ],
          `<strong style="color:#ffffff;">${quoted}</strong><br><span style="color:#b5b5b5;">${F(T.device)}</span>`,
      )}
      ${heroButton(dashboardUrl, F(T.cta))}
    `;

    const bodyHtml = `
      ${expires < start ? callout(F(T.endsBefore), "orange") : ""}

      ${sectionTitle(F(T.startTitle), undefined, { first: expires >= start })}
      ${steps(stepsList.map((s) => ({ title: F(s.title), text: F(s.text) })))}
      ${p(F(T.forgot), { small: true, muted: true })}

      ${sectionTitle(F(T.pathTitle), F(T.pathLead))}
      ${timelineItem({ title: F(T.nowTitle), meta: F(T.nowMeta), text: F(T.nowText), accent: "orange" })}
      ${timelineItem({
          title: F(T.courseTitle),
          meta: `${D.short(start)} &middot; ${escapeHtml(city)}`,
          text: F(T.courseText),
          extraHtml: labeledPill(lang === "de" ? "Prüfung" : lang === "en" ? "Exam" : lang === "uk" ? "Іспит" : "Egzamin", F(T.examText)),
          last: true,
      })}

      <div style="height:20px;line-height:20px;font-size:0;">&nbsp;</div>
      ${button(dashboardUrl, F(T.cta))}

      ${showSeatBlock(o.seatBlock, true, S) ? renderSeatBlock(S!, lang, o.seatBlock!) : ""}

      ${twoColumns(
          callout(`${smallLabel(F(T.goodToKnowTitle), "#707072")}<br>${F(T.notes)}`, "gray"),
          helpBox(fmtPlain(T.helpTitle), lang === "de" ? "Per WhatsApp schreiben" : lang === "en" ? "Message us on WhatsApp" : lang === "uk" ? "Написати у WhatsApp" : "Napisz na WhatsApp"),
      )}

      ${p(F(T.closing))}
    `;

    return {
        subject: fmtPlain(T.subject, vars),
        html: layout({
            title: fmtPlain(T.eyebrow),
            preheader: fmtPlain(T.preheader, vars),
            eyebrow: F(T.eyebrow),
            eyebrowTone: "success",
            headline: F(T.headline),
            heroHtml,
            bodyHtml,
            lang,
        }),
    };
};

/**
 * Osobny mail do pakietu „kurs + teoria online”: dostęp do kursu online jest aktywny od razu,
 * żeby kursant uczył się jeszcze przed terminem. Wysyłany zaraz po potwierdzeniu rezerwacji.
 */
export const sendOnlineTheoryAccessEmail = async (opts: OnlineTheoryAccessEmailOptions): Promise<void> => {
    const lang = pickLanguage(opts.language, opts.locationName);
    const [T, S] = await Promise.all([resolveContent("online-access", lang), resolveContent("seat-block", lang)]);
    const { subject, html } = renderOnlineTheoryAccessEmail(T, lang, opts, S);
    await sendMail({ from: FROM_EMAIL, to: opts.to, subject, html });
};

// ─── Zakup kursu online (szablon „online-purchase”, w języku zamówienia) ─────

export interface OnlinePurchaseMailData {
    name: string;
    courseName: string;
    orderNumber: string;
    expiresAt: Date | string;
    buyerParticipates?: boolean; // false = kupujący kupił dostępy dla innych (inna einleitung, bez „Sie haben Zugang”)
    count?: number; // liczba dostępów
    seatBlock?: SeatBlockData;
}

export const renderOnlinePurchaseEmail = (T: Content, lang: MailLang, o: OnlinePurchaseMailData, S?: Content): { subject: string; html: string } => {
    const D = dateFmt(lang);
    const exp = new Date(o.expiresAt);
    const vars = { name: o.name, course: o.courseName, orderNumber: o.orderNumber, expires: D.long(exp), count: o.count ?? 1 };
    const F = (t: unknown) => fmt(t, vars);
    const forOthers = o.buyerParticipates === false;
    const pick = (key: string) => (forOthers && String(T[`${key}Buyer`] || "").trim() ? T[`${key}Buyer`] : T[key]);
    const seatsHtml = showSeatBlock(o.seatBlock, o.buyerParticipates, S) ? renderSeatBlock(S!, lang, o.seatBlock!) : "";
    const bodyHtml = `
      ${p(F(pick("intro")))}
      ${infoTable([
          [F(T.courseLabel), escapeHtml(o.courseName)],
          [F(T.orderLabel), escapeHtml(o.orderNumber)],
          [F(T.validLabel), `<span style="color:#F97706;">${escapeHtml(D.long(exp))}</span>`],
      ])}
      ${forOthers ? "" : button(`${FRONTEND_URL}/dashboard`, F(T.button))}
      ${seatsHtml}
      ${p(F(T.closing))}`;
    return {
        subject: fmtPlain(pick("subject"), vars),
        html: layout({
            title: fmtPlain(pick("headline"), vars),
            preheader: fmtPlain(pick("preheader"), vars),
            eyebrow: fmt(T.eyebrow, vars),
            eyebrowTone: "success",
            headline: fmt(pick("headline"), vars),
            bodyHtml,
            lang,
        }),
    };
};

export const sendOnlineCoursePurchaseEmail = async (to: string, data: OnlinePurchaseMailData, language?: string | null): Promise<void> => {
    const lang = pickLanguage(language);
    const [T, S] = await Promise.all([resolveContent("online-purchase", lang), resolveContent("seat-block", lang)]);
    const { subject, html } = renderOnlinePurchaseEmail(T, lang, data, S);
    await sendMail({ from: FROM_EMAIL, to, subject, html });
};

// ─── Erinnerung an den Käufer: freie Plätze (Szablon „seats-reminder”) ──────

export interface SeatsReminderMailData {
    name: string;
    course: string;
    orderNumber: string;
    last: boolean; // drugie przypomnienie: 7 dni przed końcem ważności / dniem kursu
    until: Date | string; // do kiedy można przydzielić miejsca
    seatBlock: SeatBlockData;
}

export const renderSeatsReminderEmail = (T: Content, S: Content, lang: MailLang, d: SeatsReminderMailData): { subject: string; html: string } => {
    const D = dateFmt(lang);
    const open = d.seatBlock.seats.filter((x) => x.state === "open").length;
    const vars = { name: d.name, course: d.course, orderNumber: d.orderNumber, open, total: d.seatBlock.seats.length, until: D.plain(new Date(d.until)) };
    const F = (t: unknown) => fmt(t, vars);
    const k = (key: string) => (d.last && String(T[`${key}Last`] || "").trim() ? T[`${key}Last`] : T[key]);
    const bodyHtml = `
      ${p(F(k("intro")))}
      ${button(`${FRONTEND_URL}/dashboard#bestellungen`, F(T.cta))}
      ${renderSeatBlock(S, lang, d.seatBlock, { noButton: true, noIntro: true })}
      ${p(F(T.closing))}
    `;
    return {
        subject: fmtPlain(k("subject"), vars),
        html: layout({ title: fmtPlain(k("headline"), vars), preheader: fmtPlain(T.preheader, vars), headline: F(k("headline")), bodyHtml, lang }),
    };
};

export const sendSeatsReminderEmail = async (to: string, data: SeatsReminderMailData, language?: string | null): Promise<void> => {
    const lang = pickLanguage(language);
    const [T, S] = await Promise.all([resolveContent("seats-reminder", lang), resolveContent("seat-block", lang)]);
    const { subject, html } = renderSeatsReminderEmail(T, S, lang, data);
    await sendMail({ from: FROM_EMAIL, to, subject, html });
};

// ─── Einladung für einen Platz (Szablon „seat-invite”) ───────────────────────

export interface SeatInviteMailData {
    to: string;
    buyer: string; // imię i nazwisko kupującego, przy firmie z nazwą firmy
    course: string;
    practical?: { startDate: string; endDate: string; location: string; address: string };
    onlineExpiresAt?: Date; // koniec dostępu online liczony od płatności (online i pakiet)
    linkExpiresAt: Date;
    url: string;
}

/** Zaproszenie dla osoby, której kupujący przypisał miejsce. Wartości od kupującego są escapowane (fmt / escapeHtml). */
export const renderSeatInviteEmail = (T: Content, lang: MailLang, d: SeatInviteMailData): { subject: string; html: string } => {
    const locale = MAIL_LOCALES[lang];
    const longDate = (x: Date | string) => new Date(x).toLocaleDateString(locale, { timeZone: BERLIN_TZ, day: "numeric", month: "long", year: "numeric" });
    const date = d.practical
        ? d.practical.startDate === d.practical.endDate || !d.practical.endDate
            ? longDate(d.practical.startDate)
            : `${longDate(d.practical.startDate)} – ${longDate(d.practical.endDate)}`
        : undefined;
    const vars = {
        buyer: d.buyer, email: d.to, course: d.course, date, place: d.practical?.location,
        expires: d.onlineExpiresAt ? longDate(d.onlineExpiresAt) : undefined, validUntil: longDate(d.linkExpiresAt),
    };
    const F = (t: unknown) => fmt(t, vars);
    const rows: Array<[string, string]> = [[F(T.courseLabel), escapeHtml(d.course)]];
    if (d.practical) {
        rows.push([F(T.dateLabel), escapeHtml(date || "")]);
        rows.push([F(T.placeLabel), `${escapeHtml(d.practical.location)}${d.practical.address ? `<br><span style="font-size:14px;font-weight:400;color:#707072;">${escapeHtml(d.practical.address)}</span>` : ""}`]);
    }
    if (d.onlineExpiresAt) rows.push([F(T.accessLabel), F(T.accessValue)]);
    const safeUrl = escapeHtml(d.url);
    const bodyHtml = `
      ${p(F(T.intro))}
      ${String(T.renewed || "").trim() ? p(F(T.renewed), { small: true, muted: true }) : ""}
      ${infoTable(rows, 170)}
      ${d.onlineExpiresAt && String(T.accessNote || "").trim() ? p(F(T.accessNote)) : ""}
      ${button(safeUrl, F(T.cta))}
      ${p(F(T.validity), { small: true, muted: true })}
      ${p(`${F(T.fallback)}<br><a href="${safeUrl}" style="color:#111111;word-break:break-all;">${safeUrl}</a>`, { small: true, muted: true })}
      ${String(T.ignore || "").trim() ? p(F(T.ignore), { small: true, muted: true }) : ""}
      ${p(F(T.closing))}
    `;
    return {
        subject: fmtPlain(T.subject, vars),
        html: layout({
            title: fmtPlain(T.headline, vars),
            preheader: fmtPlain(T.preheader, vars),
            headline: F(T.headline),
            bodyHtml,
            lang,
        }),
    };
};

/** Zaproszenie; `reminder` = przypomnienie po 5 dniach (szablon „seat-invite-reminder”, zawsze z nowym linkiem) */
export const sendSeatInviteEmail = async (data: SeatInviteMailData, language?: string | null, opts: { reminder?: boolean } = {}): Promise<void> => {
    const lang = pickLanguage(language);
    const T = await resolveContent(opts.reminder ? "seat-invite-reminder" : "seat-invite", lang);
    const { subject, html } = renderSeatInviteEmail(T, lang, data);
    await sendMail({ from: FROM_EMAIL, to: data.to, subject, html });
};

// ─── Podgląd i test z panelu ─────────────────────────────────────────────────

/** Przykładowe miejsca do podglądu: kupujący + zaproszona osoba + wolne miejsce (albo bez kupującego) */
const sampleSeatBlock = (kind: SeatBlockData["kind"], buyerIn: boolean, start: Date): SeatBlockData => ({
    kind,
    onlineUntil: kind === "practical" ? undefined : addDays(new Date(), kind === "package" ? 14 : 30),
    courseDay: kind === "online" ? undefined : start,
    seats: [
        ...(buyerIn ? [{ seatIndex: 0, firstName: "Max", lastName: "Muster", email: "max.muster@example.com", state: "you" as const }] : []),
        { seatIndex: buyerIn ? 1 : 0, firstName: kind === "online" ? undefined : "Erika", lastName: kind === "online" ? undefined : "Beispiel", email: "erika.beispiel@example.com", state: "invited" as const },
        { seatIndex: buyerIn ? 2 : 1, firstName: kind === "online" ? undefined : "Jan", lastName: kind === "online" ? undefined : "Kowalski", state: "open" as const },
        ...(buyerIn ? [] : [{ seatIndex: 2, firstName: kind === "online" ? undefined : "Olena", lastName: kind === "online" ? undefined : "Koval", state: "open" as const }]),
    ],
});

/**
 * Przykładowe dane do podglądu szablonu; `content` = niezapisane teksty z edytora.
 * Buchung: kupujący + 2 osoby (blok miejsc). Gemeinsame Texte i „Plätze”: wariant „Käufer nimmt nicht teil”.
 */
export const renderTemplatePreview = async (key: string, lang: MailLang, content?: Content, to = "max.muster@example.com"): Promise<{ subject: string; html: string }> => {
    const t = await getTemplate(key);
    if (!t) throw new Error("Vorlage nicht gefunden");
    const l = t.languages.includes(lang) ? lang : "de";
    const merged = async (k: string, ll: MailLang) => (k === key && ll === l && content ? { ...defaultContent(t, ll), ...content } : resolveContent(k, ll));
    const start = addDays(new Date(), 14);
    start.setHours(12, 0, 0, 0);
    const S = await merged("seat-block", l);
    const sample = {
        to, name: "Max Muster", orderNumber: "ORD-VORSCHAU-1", locationName: "Berlin", locationAddress: "Neuköllnische Allee 80",
        time: "09:00 - 17:00",
    };
    if (t.kind === "booking" || t.kind === "common" || t.kind === "seat-block") {
        const bookingKey = t.kind === "booking" ? key : "booking-stufe1";
        const buyerIn = t.kind === "booking";
        const C = await merged(bookingKey, l);
        const K = await merged("booking-common", l);
        const days = Math.max(1, ...((C.ticket || []) as any[]).map((x) => Number(x.day) || 1), ...((C.schedule || []) as any[]).map((x) => Number(x.day) || 1));
        const withOnline = String(C.onlineNote || "").trim() !== "";
        const block = sampleSeatBlock(withOnline ? "package" : "practical", buyerIn, start);
        return renderBookingEmail(C, K, l, {
            ...sample, startDate: start, endDate: addDays(start, days - 1),
            participants: block.seats.map((x) => [x.firstName, x.lastName].filter(Boolean).join(" ")),
            buyerParticipates: buyerIn,
            onlineAccess: buyerIn && withOnline ? { courseName: "Staplerschein Theorie", expiresAt: addDays(new Date(), 14), days: 14 } : undefined,
            seatBlock: block,
        }, S);
    }
    if (t.kind === "online-access") {
        return renderOnlineTheoryAccessEmail(await merged(key, l), l, {
            to, name: sample.name, courseName: "Staplerschein Theorie", expiresAt: addDays(new Date(), 14), days: 14,
            courseStart: start, locationName: "Berlin", participantsCount: 3, seatBlock: sampleSeatBlock("package", true, start),
        }, S);
    }
    if (t.kind === "account-welcome") {
        return renderWelcomeEmail(await merged(key, l), l, { to, name: sample.name });
    }
    if (t.kind === "seat-invite" || t.kind === "seat-invite-reminder") {
        return renderSeatInviteEmail(await merged(key, l), l, {
            to, buyer: "Erika Beispiel (Beispiel Logistik GmbH)", course: "Staplerschein Stufe 1 mit Online-Theorie",
            practical: { startDate: start.toISOString().slice(0, 10), endDate: addDays(start, 1).toISOString().slice(0, 10), location: "Berlin", address: "Neuköllnische Allee 80, 12057 Berlin" },
            onlineExpiresAt: addDays(new Date(), 30), linkExpiresAt: addDays(new Date(), 30),
            url: `${FRONTEND_URL}/einladung/VORSCHAU`,
        });
    }
    if (t.kind === "seats-reminder") {
        return renderSeatsReminderEmail(await merged(key, l), S, l, {
            name: sample.name, course: "Staplerschein Theorie", orderNumber: sample.orderNumber, last: false,
            until: addDays(new Date(), 28), seatBlock: sampleSeatBlock("online", true, start),
        });
    }
    return renderOnlinePurchaseEmail(await merged(key, l), l, {
        name: sample.name, courseName: "Staplerschein Theorie", orderNumber: sample.orderNumber, expiresAt: addDays(new Date(), 30),
        buyerParticipates: true, count: 3, seatBlock: sampleSeatBlock("online", true, start),
    }, S);
};

export const sendTemplateTest = async (key: string, lang: MailLang, to: string, content?: Content): Promise<string> => {
    const { subject, html } = await renderTemplatePreview(key, lang, content, to);
    await sendMail({ from: FROM_EMAIL, to, subject: `[TEST] ${subject}`, html });
    return subject;
};

// ─── Nowy termin (lista oczekujących "Benachrichtigen") ────────────────────────

interface NewDatesEmailOptions {
    to: string;
    productTitle: string;
    productUrl: string;
    dates: Array<{ city: string; address: string; startDate: string; endDate: string; time: string; availableSpots: number }>;
}

export const sendNewCourseDatesEmail = async (opts: NewDatesEmailOptions): Promise<void> => {
    const { to, productTitle, productUrl, dates } = opts;
    const range = (a: string, b: string) => {
        const from = berlinDate(new Date(a), { day: "2-digit", month: "2-digit" });
        const to = berlinDate(new Date(b), { day: "2-digit", month: "2-digit", year: "numeric" });
        return a === b ? to : `${from}–${to}`;
    };
    const cities = [...new Set(dates.map((d) => d.city))];

    const rows: Array<[string, string]> = dates.map((d) => [
        `${escapeHtml(d.city)}`,
        `${strong(range(d.startDate, d.endDate))}${d.time ? ` &middot; ${escapeHtml(d.time)}` : ""}<br><span style="font-size:13px;color:#707072;">${escapeHtml(d.address)} &middot; ${d.availableSpots} ${d.availableSpots === 1 ? "Platz" : "Plätze"} frei</span>`,
    ]);

    const bodyHtml = `
      ${p("Hallo,")}
      ${p(`Sie wollten informiert werden, sobald es neue Termine für ${strong(escapeHtml(productTitle))} gibt. Jetzt ist es so weit:`)}
      ${infoTable(rows, 140)}
      ${button(productUrl, "Jetzt Platz sichern")}
      ${p("Die Plätze werden in der Reihenfolge der Buchung vergeben. Wer zuerst bucht, ist dabei.", { small: true, muted: true })}
      ${p(`Viele Grüße<br>${strong("Ihr STAPLERO Team")}`)}
    `;

    await sendMail({
        from: FROM_EMAIL,
        to,
        subject: `Neuer Termin: ${productTitle} in ${cities.join(", ")}`,
        html: layout({
            title: "Neuer Termin verfügbar",
            preheader: `Neue Termine in ${cities.join(", ")}: jetzt buchen, solange Plätze frei sind.`,
            eyebrow: "Neuer Termin",
            headline: "Ein neuer Termin ist da",
            bodyHtml,
        }),
    });
};

export const sendExpiryReminderEmail = async (
    to: string,
    name: string,
    courseName: string,
    expiresAt: Date
): Promise<void> => {
    const bodyHtml = `
      ${p(`Hallo ${strong(escapeHtml(name))},`)}
      ${callout(`${strong("Wichtige Erinnerung:")}<br>Ihr Zugang zum Kurs ${strong(`"${escapeHtml(courseName)}"`)} läuft am ${strong(deDate(expiresAt))} ab.`)}
      ${button(`${FRONTEND_URL}/dashboard`, "Zum Kurs")}
      ${p(strong("Ihr STAPLERO Team"))}
    `;

    await sendMail({
        from: FROM_EMAIL,
        to,
        subject: `Ihr Kurs "${courseName}" läuft in 3 Tagen ab`,
        html: layout({
            title: "Ihr Kurs läuft bald ab",
            preheader: `Ihr Zugang zu "${courseName}" endet am ${deDate(expiresAt)}.`,
            eyebrow: "Erinnerung",
            headline: "Ihr Kurs läuft bald ab",
            bodyHtml,
        }),
    });
};

export const sendInvoiceEmail = async (
    to: string,
    name: string,
    orderNumber: string,
    invoiceNumber: string,
    pdfBuffer: Buffer
): Promise<void> => {
    const bodyHtml = `
      ${p(`Hallo ${strong(escapeHtml(name))},`)}
      ${p("vielen Dank für Ihren Kauf bei STAPLERO.")}
      ${infoTable([
          ["Bestellnummer", escapeHtml(orderNumber)],
          ["Rechnungsnummer", `<span style="color:#F97706;">${escapeHtml(invoiceNumber)}</span>`],
          ["Ausstellungsdatum", new Date().toLocaleDateString("de-DE")],
      ])}
      ${p("Im Anhang dieser E-Mail finden Sie Ihre Rechnung als PDF-Dokument.")}
      ${p(`Bei Fragen kontaktieren Sie uns bitte unter ${strong("info@staplero.de")}.`, { muted: true })}
      ${p(`Mit freundlichen Grüßen,<br>${strong("Ihr STAPLERO Team")}`)}
    `;

    await sendMail({
        from: FROM_EMAIL,
        to,
        subject: `Ihre Rechnung ${invoiceNumber} - STAPLERO`,
        html: layout({
            title: "Ihre Rechnung",
            preheader: `Rechnung ${invoiceNumber} zu Ihrer Bestellung ${orderNumber}.`,
            eyebrow: "Rechnung",
            headline: "Ihre Rechnung",
            bodyHtml,
        }),
        attachments: [
            {
                filename: `Rechnung_${invoiceNumber}.pdf`,
                content: pdfBuffer,
            },
        ],
    });
};

// ─── Kontakt ───────────────────────────────────────────────────────────────────

export const sendContactFormEmail = async (
    name: string,
    email: string,
    phone: string,
    company: string,
    message: string
): Promise<void> => {
    const rows: Array<[string, string]> = [
        ["Name", escapeHtml(name)],
        ["E-Mail", `<a href="mailto:${escapeHtml(email)}" style="color:#111111;">${escapeHtml(email)}</a>`],
    ];
    if (phone) rows.push(["Telefon", `<a href="tel:${escapeHtml(phone)}" style="color:#111111;">${escapeHtml(phone)}</a>`]);
    if (company) rows.push(["Firma", escapeHtml(company)]);

    const bodyHtml = `
      ${p("Sie haben eine neue Nachricht über das Kontaktformular erhalten.")}
      ${infoTable(rows)}
      ${sectionLabel("Nachricht")}
      ${callout(escapeHtml(message).replace(/\n/g, "<br>"), "gray")}
      ${p(`Gesendet am ${new Date().toLocaleString("de-DE")}`, { small: true, muted: true })}
    `;

    await sendMail({
        from: FROM_EMAIL,
        to: "info@staplero.de",
        replyTo: email,
        subject: `Neue Kontaktanfrage von ${name}`,
        html: layout({
            title: "Neue Kontaktanfrage",
            preheader: `${name}: ${message.slice(0, 90)}`,
            eyebrow: "Kontaktformular",
            headline: "Neue Kontaktanfrage",
            bodyHtml,
        }),
    });

    // Wiadomość do nas już poszła — brak potwierdzenia dla klienta nie powinien zwracać błędu w formularzu
    await sendContactConfirmationEmail(email, name).catch((err) =>
        console.error("❌ Contact confirmation email failed:", err.message)
    );
};

export const sendContactConfirmationEmail = async (
    to: string,
    name: string
): Promise<void> => {
    const bodyHtml = `
      ${p(`Hallo ${strong(escapeHtml(name))},`)}
      ${p("vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und werden uns schnellstmöglich bei Ihnen melden.")}
      ${callout("In der Regel antworten wir innerhalb von 24 Stunden.")}
      ${p(`Mit freundlichen Grüßen,<br>${strong("Ihr STAPLERO Team")}`)}
    `;

    await sendMail({
        from: FROM_EMAIL,
        to,
        subject: "Wir haben Ihre Nachricht erhalten: STAPLERO",
        html: layout({
            title: "Nachricht erhalten",
            preheader: "Wir melden uns in der Regel innerhalb von 24 Stunden.",
            eyebrow: "Kontakt",
            headline: "Nachricht erhalten",
            bodyHtml,
        }),
    });
};

export default {
    sendCertificateEmail,
    sendWelcomeEmail,
    sendSeatInviteEmail,
    sendSeatsReminderEmail,
    sendPasswordResetEmail,
    sendPasswordChangedEmail,
    sendOnlineCoursePurchaseEmail,
    sendPracticalCourseBookingEmail,
    sendOnlineTheoryAccessEmail,
    sendTemplateTest,
    renderTemplatePreview,
    sendExpiryReminderEmail,
    sendNewCourseDatesEmail,
    sendInvoiceEmail,
    sendContactFormEmail,
    sendContactConfirmationEmail,
};
