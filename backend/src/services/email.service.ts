import { Resend } from "resend";
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

export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
    const bodyHtml = `
      ${p(`Hallo ${strong(escapeHtml(name))},`)}
      ${p("vielen Dank für Ihre Registrierung bei STAPLERO, Ihrem Partner für professionelle Staplerausbildung.")}
      ${p("Sie können sich jetzt einloggen und mit Ihrem Kurs beginnen:")}
      ${button(`${FRONTEND_URL}/login`, "Zum Login")}
      ${p("Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.", { muted: true })}
      ${p(strong("Ihr STAPLERO Team"))}
    `;

    await sendMail({
        from: FROM_EMAIL,
        to,
        subject: "Willkommen bei STAPLERO!",
        html: layout({
            title: "Willkommen bei STAPLERO",
            preheader: "Ihr Konto ist eingerichtet. Jetzt einloggen und starten.",
            eyebrow: "Konto erstellt",
            headline: "Willkommen bei STAPLERO!",
            bodyHtml,
        }),
    });
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
    return { long, short, tiny, range };
};

const cityOf = (locationName: string) => locationName.split(/[(\-–]/)[0].trim() || locationName;
const smallLabel = (text: string, color: string) =>
    `<span style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${color};">${text}</span>`;
const helpBox = (title: string, whatsapp: string) => callout(
    `${smallLabel(escapeHtml(title), "#c25e00")}<br>${strong(`<a href="${PHONE_1.href}" style="color:#111111;text-decoration:none;">${PHONE_1.label}</a>`)}<br>${strong(`<a href="${PHONE_2.href}" style="color:#111111;text-decoration:none;">${PHONE_2.label}</a>`)}<br><a href="${WHATSAPP_URL}" target="_blank" style="color:#111111;font-weight:700;">${escapeHtml(whatsapp)}</a>`,
    "orange",
);

// ─── Potwierdzenie rezerwacji kursu na miejscu ───────────────────────────────

export interface PracticalCourseBookingEmailOptions {
    to: string;
    name: string;
    orderNumber: string;
    locationName: string; // nazwa terminu/miejsca, np. "Berlin (auf Englisch) Stufe 2 - Schubmaststapler"
    locationAddress: string;
    startDate: Date | string; // pierwszy dzień
    endDate?: Date | string; // ostatni dzień
    participants?: string[]; // pierwsza osoba to zamawiający
    language?: string; // język strony przy zakupie (de/en/uk/pl)
    productId?: string; // produkt → wybrany w panelu szablon
    locationId?: string; // gdy brak productId: produkt z terminu
    dateId?: string;
    templateKey?: string; // wymuszony szablon (podgląd/test)
    // Pakiet z teorią online: dostęp do kursu (nadany przy zapłacie) — krótki dopisek, szczegóły w osobnym mailu
    onlineAccess?: { courseName: string; expiresAt: Date | string; days?: number };
    time?: string; // godziny z terminu, np. "09:00 - 17:30"
}

type BookingData = Omit<PracticalCourseBookingEmailOptions, "language" | "productId" | "locationId" | "dateId" | "templateKey">;

/** Renderuje potwierdzenie rezerwacji z tekstów szablonu (C) i tekstów wspólnych (K) */
export const renderBookingEmail = (C: Content, K: Content, lang: MailLang, o: BookingData): { subject: string; html: string } => {
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
    };
    const F = (t: unknown, extra: Record<string, any> = {}) => fmt(t, { ...vars, ...extra });
    const hours = fmtPlain(K.hours, vars);

    const calendarUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE"
        + `&text=${encodeURIComponent(`STAPLERO ${fmtPlain(C.courseName)}`)}`
        + `&dates=${calendarDay(start)}T${from.replace(":", "")}00/${calendarDay(start)}T${to.replace(":", "")}00`
        + `&ctz=${encodeURIComponent(BERLIN_TZ)}`
        + (courseDays > 1 ? `&recur=${encodeURIComponent(`RRULE:FREQ=DAILY;COUNT=${courseDays}`)}` : "")
        + `&location=${encodeURIComponent(o.locationAddress)}`
        + `&details=${encodeURIComponent(`${o.orderNumber}`)}`;
    const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(o.locationAddress)}`;

    const heroHtml = `
      ${heroText(F(C.intro).replace(/<strong>/g, '<strong style="color:#ffffff;">'))}
      ${heroTicket(
          (ticket.length ? ticket : [{ day: 1, label: "" }]).map((t) => ({ label: F(t.label), title: D.short(dayDate(t.day)), note: escapeHtml(hours) })),
          `<strong style="color:#ffffff;">${escapeHtml(o.locationName)}</strong> &middot; ${escapeHtml(o.locationAddress)}<br><span style="color:#b5b5b5;">${F(K.ticketFooter)}</span>`,
      )}
      ${heroButtons({ href: calendarUrl, label: escapeHtml(K.calendarButton) }, { href: routeUrl, label: escapeHtml(K.routeButton) })}
    `;

    const arrivalSteps: any[] = Array.isArray(K.arrivalSteps) ? K.arrivalSteps : [];
    const arrivalHtml = isBerlin
        ? `
      ${sectionTitle(F(K.findUsTitle), F(K.findUsText))}
      ${photoSteps(berlinArrivalImages.map((img, i) => ({
          imageUrl: `${EMAIL_ASSETS_URL}/${img.image}`, alt: img.alt,
          title: F(arrivalSteps[i]?.title), text: F(arrivalSteps[i]?.text),
      })), escapeHtml(K.stepLabel || "Schritt"))}`
        : `
      ${sectionTitle(F(K.arrivalTitle))}
      ${p(F(K.arrivalText))}`;

    const participantsHtml = people.length > 1
        ? `
      ${sectionTitle(F(K.participantsTitle))}
      ${numberedList(people.map((n, i) => i === 0 ? `${escapeHtml(n)} <span style="font-weight:400;color:#707072;font-size:13px;">&middot; ${escapeHtml(K.buyer)}</span>` : escapeHtml(n)))}
      ${p(F(K.forwardNote), { small: true, muted: true })}`
        : "";

    const onlineHtml = access && String(C.onlineNote || "").trim()
        ? callout(`${smallLabel(escapeHtml(K.onlineTitle), "#c25e00")}<br>${F(C.onlineNote)}`, "orange")
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
            extraHtml: String(s.exam || "").trim() ? labeledPill(escapeHtml(K.examLabel), F(s.exam), s.highlight ? "orange" : "gray") : undefined,
            accent: s.highlight ? "orange" : undefined,
            last: i === schedule.length - 1,
        });
    }).join("");

    const bring: any[] = Array.isArray(C.bring) ? C.bring : [];
    const cancellation = String(C.cancellation || "").trim();
    const help = helpBox(K.helpTitle, K.whatsapp);

    const bodyHtml = `
      ${String(C.requirement || "").trim() ? callout(F(C.requirement).replace(/^<strong>(.+?)<\/strong>(<br>)?/, (_m, t) => `${smallLabel(t, "#c25e00")}<br>`), "orange") : ""}

      ${sectionTitle(F(K.bringTitle), undefined, { first: !String(C.requirement || "").trim() })}
      ${checklist(bring.map((b) => ({ title: F(b.title), note: String(b.note || "").trim() ? F(b.note) : undefined, tag: b.required ? escapeHtml(K.required) : undefined, strong: !!b.required })))}

      ${onlineHtml}

      ${arrivalHtml}

      ${participantsHtml}

      ${sectionTitle(F(C.scheduleTitle), String(C.scheduleLead || "").trim() ? F(C.scheduleLead) : undefined)}
      ${timelineHtml}
      ${String(C.afterSchedule || "").trim() ? p(F(C.afterSchedule), { small: true, muted: true }) : ""}

      ${cancellation
          ? twoColumns(callout(`${smallLabel(escapeHtml(K.cancellationTitle), "#707072")}<br>${F(cancellation)}`, "gray"), help)
          : help}

      ${p(F(C.closing))}
    `;

    return {
        subject: fmtPlain(C.subject, vars),
        html: layout({
            title: fmtPlain(K.docTitle),
            preheader: fmtPlain(C.preheader, vars),
            eyebrow: escapeHtml(K.eyebrow),
            eyebrowTone: "success",
            headline: escapeHtml(fmtPlain(C.headline, vars)),
            heroHtml,
            bodyHtml,
            lang,
        }),
    };
};

export const sendPracticalCourseBookingEmail = async (opts: PracticalCourseBookingEmailOptions): Promise<void> => {
    const key = opts.templateKey || await resolveBookingTemplateKey(opts);
    const lang = pickLanguage(opts.language, opts.locationName);
    const [C, K] = await Promise.all([resolveContent(key, lang), resolveContent("booking-common", lang)]);
    const { subject, html } = renderBookingEmail(C, K, lang, opts);
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
}

export const renderOnlineTheoryAccessEmail = (T: Content, lang: MailLang, o: Omit<OnlineTheoryAccessEmailOptions, "language">): { subject: string; html: string } => {
    const D = dateFmt(lang);
    const expires = new Date(o.expiresAt);
    const start = new Date(o.courseStart);
    const city = cityOf(o.locationName);
    const multi = (o.participantsCount || 1) > 1;
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

      ${twoColumns(
          callout(`${smallLabel(F(T.goodToKnowTitle), "#707072")}<br>${F(T.notes)}${multi && T.notesMulti ? `<br>${F(T.notesMulti)}` : ""}`, "gray"),
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
    const T = await resolveContent("online-access", lang);
    const { subject, html } = renderOnlineTheoryAccessEmail(T, lang, opts);
    await sendMail({ from: FROM_EMAIL, to: opts.to, subject, html });
};

// ─── Zakup kursu online (niemiecki + angielski w jednym mailu) ───────────────

export const renderOnlinePurchaseEmail = (DE: Content, EN: Content, o: { name: string; courseName: string; orderNumber: string; expiresAt: Date | string }): { subject: string; html: string } => {
    const exp = new Date(o.expiresAt);
    const block = (T: Content, lang: MailLang) => {
        const vars = { name: o.name, course: o.courseName, orderNumber: o.orderNumber, expires: dateFmt(lang).long(exp) };
        const F = (t: unknown) => fmt(t, vars);
        return `
      ${sectionLabel(F(T.sectionLabel))}
      ${p(F(T.intro))}
      ${infoTable([
          [F(T.courseLabel), escapeHtml(o.courseName)],
          [F(T.orderLabel), escapeHtml(o.orderNumber)],
          [F(T.validLabel), `<span style="color:#F97706;">${escapeHtml(dateFmt(lang).long(exp))}</span>`],
      ])}
      ${button(`${FRONTEND_URL}/dashboard`, F(T.button))}
      ${p(F(T.closing))}`;
    };
    const vars = { name: o.name, course: o.courseName, orderNumber: o.orderNumber, expires: dateFmt("de").long(exp) };
    return {
        subject: fmtPlain(DE.subject, vars),
        html: layout({
            title: fmtPlain(DE.headline, vars),
            preheader: fmtPlain(DE.preheader, vars),
            eyebrow: fmt(DE.eyebrow, vars),
            headline: fmt(DE.headline, vars),
            bodyHtml: `${block(DE, "de")}<div style="height:1px;background:#e5e5e5;margin:28px 0;"></div>${block(EN, "en")}`,
        }),
    };
};

export const sendOnlineCoursePurchaseEmail = async (
    to: string,
    name: string,
    courseName: string,
    orderNumber: string,
    expiresAt: Date
): Promise<void> => {
    const [DE, EN] = await Promise.all([resolveContent("online-purchase", "de"), resolveContent("online-purchase", "en")]);
    const { subject, html } = renderOnlinePurchaseEmail(DE, EN, { name, courseName, orderNumber, expiresAt });
    await sendMail({ from: FROM_EMAIL, to, subject, html });
};

// ─── Podgląd i test z panelu ─────────────────────────────────────────────────

/** Przykładowe dane do podglądu szablonu; `content` = niezapisane teksty z edytora */
export const renderTemplatePreview = async (key: string, lang: MailLang, content?: Content, to = "max.muster@example.com"): Promise<{ subject: string; html: string }> => {
    const t = await getTemplate(key);
    if (!t) throw new Error("Vorlage nicht gefunden");
    const l = t.languages.includes(lang) ? lang : "de";
    const merged = async (k: string, ll: MailLang) => (k === key && ll === l && content ? { ...defaultContent(t, ll), ...content } : resolveContent(k, ll));
    const start = addDays(new Date(), 14);
    start.setHours(12, 0, 0, 0);
    const sample = {
        to, name: "Max Muster", orderNumber: "ORD-VORSCHAU-1", locationName: "Berlin", locationAddress: "Neuköllnische Allee 80",
        participants: ["Max Muster"], time: "09:00 - 17:00",
    };
    if (t.kind === "booking" || t.kind === "common") {
        const bookingKey = t.kind === "common" ? "booking-stufe1" : key;
        const C = await merged(bookingKey, l);
        const K = await merged("booking-common", l);
        const days = Math.max(1, ...((C.ticket || []) as any[]).map((x) => Number(x.day) || 1), ...((C.schedule || []) as any[]).map((x) => Number(x.day) || 1));
        return renderBookingEmail(C, K, l, {
            ...sample, startDate: start, endDate: addDays(start, days - 1),
            onlineAccess: String(C.onlineNote || "").trim() ? { courseName: "Staplerschein Theorie", expiresAt: addDays(new Date(), 14), days: 14 } : undefined,
        });
    }
    if (t.kind === "online-access") {
        return renderOnlineTheoryAccessEmail(await merged(key, l), l, {
            to, name: sample.name, courseName: "Staplerschein Theorie", expiresAt: addDays(new Date(), 14), days: 14,
            courseStart: start, locationName: "Berlin", participantsCount: 1,
        });
    }
    return renderOnlinePurchaseEmail(await merged(key, "de"), await merged(key, "en"), {
        name: sample.name, courseName: "Staplerschein Theorie", orderNumber: sample.orderNumber, expiresAt: addDays(new Date(), 30),
    });
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
