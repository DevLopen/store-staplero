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
} from "./emailTemplates";

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
      ${callout(`${strong("Das waren nicht Sie?")} Setzen Sie Ihr Passwort bitte sofort erneut zurück oder schreiben Sie uns an <a href="mailto:info@staplero.com" style="color:#111111;">info@staplero.com</a>.`)}
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

export const sendOnlineCoursePurchaseEmail = async (
    to: string,
    name: string,
    courseName: string,
    orderNumber: string,
    expiresAt: Date
): Promise<void> => {
    const bodyHtml = `
      ${p(`Hallo ${strong(escapeHtml(name))},`)}
      ${p("vielen Dank für Ihren Kauf! Sie haben nun Zugang zu:")}
      ${infoTable([
          ["Kurs", escapeHtml(courseName)],
          ["Bestellnummer", escapeHtml(orderNumber)],
          ["Zugang gültig bis", `<span style="color:#F97706;">${deDate(expiresAt)}</span>`],
      ])}
      ${button(`${FRONTEND_URL}/dashboard`, "Zum Kurs")}
      ${p(`${strong("Viel Erfolg!")}<br>Ihr STAPLERO Team`)}
    `;

    await sendMail({
        from: FROM_EMAIL,
        to,
        subject: `Ihr Online-Kurs: ${courseName} - Zugang freigeschaltet!`,
        html: layout({
            title: "Zahlung erfolgreich",
            preheader: `Ihr Zugang zu "${courseName}" ist freigeschaltet.`,
            eyebrow: "Bestellung bestätigt",
            headline: "Zahlung erfolgreich!",
            bodyHtml,
        }),
    });
};

interface PracticalCourseBookingEmailOptions {
    to: string;
    name: string;
    orderNumber: string;
    locationName: string; // miasto, np. "Berlin"
    locationAddress: string;
    startDate: Date | string; // 1. dzień (teoria); praktyka jest dzień później
    endDate?: Date | string; // ostatni dzień; 3 dni = Intensivausbildung z dniem na Schubmaststapler
    participants?: string[]; // pierwsza osoba to zamawiający
    language?: "de" | "en" | "uk" | "pl"; // język maila (na razie używany tylko w mailu Stufe 2)
    // Pakiet z teorią online: dostęp do kursu (nadany przy zapłacie) — sekcja w mailu
    onlineAccess?: { courseName: string; expiresAt: Date | string; days?: number };
    time?: string; // godziny z terminu, np. "09:00 - 17:30" (używane w mailu jednodniowym)
}

const BERLIN_TZ = "Europe/Berlin";
const COURSE_HOURS = { from: "09:00", to: "17:00" };

// Zdjęcia kolejnych kroków dojazdu do NLND Berlin (public/)
const berlinArrivalSteps = [
    { image: "anfahrt-berlin-1.jpg", alt: "Neuköllnische Allee", title: "Über die Neuköllnische Allee", text: "Fahren Sie bis zur Hausnummer 80." },
    { image: "anfahrt-berlin-2.jpg", alt: "Gebäude NLND Berlin", title: "Zum Haupteingang NLND Berlin", text: "Das Gebäude mit dem NLND-Schriftzug." },
    { image: "anfahrt-berlin-3.jpg", alt: "Tor mit Hausnummer 80", title: "An der Wache melden", text: "Am Tor mit der Nummer 80 bzw. am Empfang." },
    { image: "anfahrt-berlin-4.jpg", alt: "Wartebereich am Eingang", title: "Im Eingangsbereich warten", text: `Ein Ausbilder holt Sie ab. Verspätet? Rufen Sie uns an: <a href="tel:+4916092490070" style="color:#111111;font-weight:700;">+49 160 92490070</a> oder <a href="tel:+4917622067783" style="color:#111111;font-weight:700;">+49 176 22067783</a>` },
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

export const sendPracticalCourseBookingEmail = async (opts: PracticalCourseBookingEmailOptions): Promise<void> => {
    const { to, name, orderNumber, locationName, locationAddress, participants = [] } = opts;

    const theory = new Date(opts.startDate);
    const practice = addDays(theory, 1);
    const cancelUntil = addDays(theory, -7);
    // Liczba dni z terminu (start–koniec włącznie); 3 dni = Frontstapler + Schubmaststapler
    const spanDays = opts.endDate
        ? Math.round((new Date(opts.endDate).getTime() - theory.getTime()) / 86_400_000) + 1
        : 2;
    // Kurs jednodniowy = Schubmaststapler Stufe 2 (osobny mail: inny przebieg, wymagany Staplerschein Stufe 1)
    if (spanDays <= 1) return sendReachTruckBookingEmail(opts);
    const isThreeDay = spanDays >= 3;
    const reach = addDays(theory, 2); // 3. dzień (tylko przy isThreeDay)
    const lastDay = isThreeDay ? reach : practice;
    const courseDays = isThreeDay ? 3 : 2;
    const allDays = isThreeDay ? "allen drei Tagen" : "beiden Tagen";

    const longDate = (d: Date) => berlinDate(d, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const shortDate = (d: Date) => berlinDate(d, { weekday: "short", day: "numeric", month: "short" });
    const numericDate = (d: Date) => berlinDate(d, { day: "2-digit", month: "2-digit" }); // "12.10."
    // "12.–13.10." albo "31.10.–01.11." przy zmianie miesiąca
    const dateRange = berlinDate(theory, { month: "2-digit" }) === berlinDate(lastDay, { month: "2-digit" })
        ? `${berlinDate(theory, { day: "2-digit" })}.–${numericDate(lastDay)}`
        : `${numericDate(theory)}–${numericDate(lastDay)}`;
    const hours = `${COURSE_HOURS.from} – ca. ${COURSE_HOURS.to} Uhr`;

    const loc = escapeHtml(locationName);
    const addr = escapeHtml(locationAddress);
    // Zdjęcia dojazdu dotyczą ośrodka przy Neuköllnische Allee — rozpoznajemy po nazwie albo adresie
    const isBerlin = /berlin/i.test(locationName) || /neuk[öo]llnische\s+allee/i.test(locationAddress);

    // Wszystkie dni kursu jako wydarzenie powtarzane codziennie
    const from = COURSE_HOURS.from.replace(":", "") + "00";
    const until = COURSE_HOURS.to.replace(":", "") + "00";
    const calendarUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE"
        + `&text=${encodeURIComponent("STAPLERO Gabelstaplerausbildung")}`
        + `&dates=${calendarDay(theory)}T${from}/${calendarDay(theory)}T${until}`
        + `&ctz=${encodeURIComponent(BERLIN_TZ)}`
        + `&recur=${encodeURIComponent(`RRULE:FREQ=DAILY;COUNT=${courseDays}`)}`
        + `&location=${encodeURIComponent(locationAddress)}`
        + `&details=${encodeURIComponent(`Bestellnummer ${orderNumber}`)}`;
    const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationAddress)}`;

    const people = participants.length ? participants : [name];
    const courseTitle = isThreeDay
        ? "3-Tage-Intensivausbildung Frontstapler &amp; Schubmaststapler"
        : "Gabelstaplerausbildung Stufe&nbsp;1";

    const heroHtml = `
      ${heroText(`Hallo ${escapeHtml(name)}, wir freuen uns auf Sie. Hier finden Sie alles, was Sie für die <strong style="color:#ffffff;">${courseTitle}</strong> brauchen.`)}
      ${heroTicket(
          [
              { label: "Tag 1 &middot; Theorie", title: shortDate(theory), note: hours },
              { label: isThreeDay ? "Tag 2 &middot; Praxis" : "Tag 2 &middot; Praxis &amp; Prüfung", title: shortDate(practice), note: hours },
              ...(isThreeDay ? [{ label: "Tag 3 &middot; Schubmast", title: shortDate(reach), note: hours }] : []),
          ],
          `<strong style="color:#ffffff;">${loc}</strong> &middot; ${addr}<br><span style="color:#b5b5b5;">${people.length} Teilnehmer &middot; Bitte 10 bis 15 Minuten vor Kursbeginn da sein</span>`,
      )}
      ${heroButtons({ href: calendarUrl, label: "In den Kalender eintragen" }, { href: routeUrl, label: "Route planen" })}
    `;

    const arrivalHtml = isBerlin
        ? `
      ${sectionTitle("So finden Sie uns", `Bitte betreten Sie das Betriebsgelände nicht selbstständig. Ein STAPLERO-Ausbilder holt Sie am Eingang ab, an ${allDays}.`)}
      ${photoSteps(berlinArrivalSteps.map((s) => ({ imageUrl: `${EMAIL_ASSETS_URL}/${s.image}`, alt: s.alt, title: s.title, text: s.text })))}`
        : `
      ${sectionTitle("Anreise &amp; Treffpunkt")}
      ${p(`Bitte erscheinen Sie ${strong("10 bis 15 Minuten vor Kursbeginn")} am Schulungsort. Ein STAPLERO-Ausbilder empfängt Sie dort und begleitet Sie zum Schulungsraum.`)}`;

    const participantsHtml = people.length > 1
        ? `
      ${sectionTitle("Angemeldete Teilnehmer")}
      ${numberedList(people.map((n, i) => i === 0 ? `${escapeHtml(n)} <span style="font-weight:400;color:#707072;font-size:13px;">&middot; Besteller</span>` : escapeHtml(n)))}
      ${p("Bitte leiten Sie diese E-Mail an alle Teilnehmer weiter. Jede Person braucht einen eigenen Ausweis und Sicherheitsschuhe.", { small: true, muted: true })}`
        : "";

    const access = opts.onlineAccess;
    const onlineAccessHtml = access
        ? `
      ${sectionTitle("Ihr Zugang zur Online-Theorie", "Im Preis enthalten: Bereiten Sie sich schon vor dem Kurs vor.")}
      ${callout(`<span style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c25e00;">${access.days ? `${access.days} Tage Zugang` : "Online-Zugang"}</span><br>Ihr Online-Kurs ${strong(`„${escapeHtml(access.courseName)}“`)} ist ab sofort freigeschaltet. Lernen Sie in Ihrem Tempo am Handy oder Computer, ideal zur Vorbereitung auf den Theorietag und die schriftliche Prüfung.<br>Zugang gültig bis ${strong(longDate(new Date(access.expiresAt)))}.`, "orange")}
      ${button(`${FRONTEND_URL}/dashboard`, "Zum Online-Kurs")}
      ${p(`Melden Sie sich mit Ihrer E-Mail-Adresse ${strong(escapeHtml(to))} und dem Passwort aus Ihrer Bestellung an.${people.length > 1 ? " Der Zugang gilt für das Konto des Bestellers." : ""}`, { small: true, muted: true })}`
        : "";

    const bodyHtml = `
      ${sectionTitle("Bitte mitbringen", undefined, { first: true })}
      ${checklist([
          { title: "Personalausweis oder Reisepass", note: `an ${allDays}`, tag: "Pflicht", strong: true },
          { title: "Arbeitssicherheitsschuhe", note: isThreeDay ? "an allen drei Tagen, an den Praxistagen Pflicht" : "an beiden Tagen, am Praxistag Pflicht", tag: "Pflicht", strong: true },
          { title: "Geeignete Arbeitskleidung", note: `${isThreeDay ? "an den Praxistagen" : "am Praxistag"}, lange Hose empfohlen. Hallentemperatur ca. 18 bis 22 °C` },
      ])}

      ${arrivalHtml}

      ${participantsHtml}

      ${onlineAccessHtml}

      ${sectionTitle("Ablauf der Ausbildung", "Nach DGUV Grundsatz 308-001 und DGUV Vorschrift 68.")}
      ${timelineItem({
          title: "Tag 1 &middot; Theorie",
          meta: `${shortDate(theory)} &middot; ${COURSE_HOURS.from}–${COURSE_HOURS.to}`,
          text: "Rechtliche Grundlagen, Rechte und Pflichten, Aufbau des Staplers, Standsicherheit und Tragfähigkeit, Lastdiagramme, tägliche Kontrolle, Verkehrsregeln im Betrieb, Verhalten in Gefahrensituationen.",
          extraHtml: labeledPill("Prüfung", "Schriftlicher Test am Ende des Tages"),
      })}
      ${timelineItem({
          title: isThreeDay ? "Tag 2 &middot; Praxis Frontstapler" : "Tag 2 &middot; Praxis",
          meta: `${shortDate(practice)} &middot; ${COURSE_HOURS.from}–${COURSE_HOURS.to}`,
          text: `Fahrzeugkontrolle, Einweisung am Gabelstapler, Anfahren, Lenken und Bremsen, Lasten aufnehmen und transportieren, Rangieren auf engem Raum, Stapeln und Einlagern.${isBerlin ? " Treffpunkt wie am ersten Tag, bitte erneut an der Wache melden." : ""}`,
          extraHtml: labeledPill("Prüfung", "Fahrprüfung, danach Ihr Staplerschein", "orange"),
          accent: "orange",
          last: !isThreeDay,
      })}
      ${isThreeDay ? timelineItem({
          title: "Tag 3 &middot; Schubmaststapler",
          meta: `${shortDate(reach)} &middot; ${COURSE_HOURS.from}–${COURSE_HOURS.to}`,
          text: `Ca. 2 Stunden Theorie zum Schubmaststapler: Aufbau, Bedienung und Besonderheiten im Vergleich zum Frontstapler. Anschließend praktische Fahrübungen am Schubmaststapler: Ein- und Auslagern im Regal, Rangieren in engen Gängen.${isBerlin ? " Treffpunkt wie an den Vortagen, bitte erneut an der Wache melden." : ""}`,
          accent: "orange",
          last: true,
      }) : ""}

      ${twoColumns(
          callout(`<span style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#707072;">Stornierung</span><br>Kostenfrei bis<br>${strong(longDate(cancelUntil))}<br><span style="font-size:13px;color:#707072;">Danach fällt eine Stornogebühr von 100&nbsp;% an.</span>`, "gray"),
          callout(`<span style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c25e00;">Fragen? Wir helfen</span><br>${strong(`<a href="tel:+4916092490070" style="color:#111111;text-decoration:none;">+49 160 92490070</a>`)}<br>${strong(`<a href="tel:+4917622067783" style="color:#111111;text-decoration:none;">+49 176 22067783</a>`)}<br><a href="https://wa.me/4917622067783" target="_blank" style="color:#111111;font-weight:700;">Per WhatsApp schreiben</a>`, "orange"),
      )}

      ${p(`Bis bald in ${loc}!<br>${strong("Ihr STAPLERO Team")}`)}
    `;

    await sendMail({
        from: FROM_EMAIL,
        to,
        subject: `Platz reserviert: Staplerschein ${dateRange} in ${locationName}`,
        html: layout({
            title: "Anmeldebestätigung",
            preheader: `Ihr Platz ist reserviert: ${longDate(theory)} bis ${longDate(lastDay)}, ${locationName}. Bitte Ausweis und Sicherheitsschuhe mitbringen.`,
            eyebrow: "Anmeldung bestätigt",
            eyebrowTone: "success",
            headline: "Ihr Platz ist reserviert",
            heroHtml,
            bodyHtml,
        }),
    });
};

const reachTruckTexts = {
    de: {
        locale: "de-DE",
        hours: (a: string, b: string) => `${a} – ca. ${b} Uhr`,
        calTitle: "STAPLERO Schubmaststapler-Ausbildung (Stufe 2)",
        calDetails: (o: string) => `Bestellnummer ${o}. Bitte mitbringen: Ausweis, Staplerschein Stufe 1, Sicherheitsschuhe.`,
        heroIntro: (n: string) => `Hallo ${n}, wir freuen uns auf Sie. Hier finden Sie alles, was Sie für die <strong style="color:#ffffff;">Schubmaststapler-Ausbildung (Stufe&nbsp;2)</strong> brauchen.`,
        ticketDay: "Schulungstag &middot; Stufe 2",
        ticketWhat: "Theorie, Praxis &amp; Prüfung",
        ticketLen: "1 Tag",
        ticketTruck: "Schubmaststapler",
        ticketFooter: (n: number) => `${n} Teilnehmer &middot; Bitte 10 bis 15 Minuten vor Kursbeginn da sein`,
        calBtn: "In den Kalender eintragen",
        routeBtn: "Route planen",
        findUs: "So finden Sie uns",
        findUsNote: "Bitte betreten Sie das Betriebsgelände nicht selbstständig. Ein STAPLERO-Ausbilder holt Sie am Eingang ab.",
        arrival: "Anreise &amp; Treffpunkt",
        arrivalText: `Bitte erscheinen Sie <strong>10 bis 15 Minuten vor Kursbeginn</strong> am Schulungsort. Ein STAPLERO-Ausbilder empfängt Sie dort und begleitet Sie zum Schulungsraum.`,
        steps: [
            { title: "Über die Neuköllnische Allee", text: "Fahren Sie bis zur Hausnummer 80." },
            { title: "Zum Haupteingang NLND Berlin", text: "Das Gebäude mit dem NLND-Schriftzug." },
            { title: "An der Wache melden", text: "Am Tor mit der Nummer 80 bzw. am Empfang." },
            { title: "Im Eingangsbereich warten", text: "Ein Ausbilder holt Sie ab. Verspätet? Rufen Sie uns an:" },
        ],
        or: "oder",
        step: "Schritt",
        participants: "Angemeldete Teilnehmer",
        buyer: "Besteller",
        forward: "Bitte leiten Sie diese E-Mail an alle Teilnehmer weiter. Jede Person braucht einen eigenen Ausweis, einen eigenen Staplerschein der Stufe 1 und Sicherheitsschuhe.",
        reqLabel: "Wichtig: Voraussetzung",
        reqText: `Die Ausbildung zum Schubmaststapler ist eine <strong>Zusatzqualifikation</strong>. Teilnehmen kann nur, wer bereits einen <strong>deutschen Staplerschein der Stufe&nbsp;1</strong> (Frontstapler) besitzt. Bitte bringen Sie den Nachweis unbedingt mit. Ohne Nachweis ist eine Teilnahme leider nicht möglich.`,
        bring: "Bitte mitbringen",
        required: "Pflicht",
        items: [
            { title: "Personalausweis oder Reisepass" },
            { title: "Deutscher Staplerschein Stufe 1", note: "Original, Fahrausweis oder Zertifikat (auch digital)" },
            { title: "Arbeitssicherheitsschuhe", note: "für den Praxisteil Pflicht" },
            { title: "Geeignete Arbeitskleidung", note: "lange Hose empfohlen. Hallentemperatur ca. 18 bis 22 °C" },
        ],
        flow: "Ablauf des Schulungstages",
        flowNote: "Nach DGUV Grundsatz 308-001 und DGUV Vorschrift 68.",
        morning: "Vormittag &middot; Theorie",
        from: (h: string) => `ab ${h}`,
        morningText: "Aufbau und Funktion des Schubmaststaplers, Unterschiede zum Frontstapler, Tragfähigkeit und Lastschwerpunkt, Standsicherheit beim Arbeiten in der Höhe, Sicherheitsvorschriften und Unfallverhütung.",
        exam: "Prüfung",
        writtenTest: "Schriftlicher Test",
        afternoon: "Nachmittag &middot; Praxis",
        until: (h: string) => `bis ca. ${h}`,
        afternoonText: "Tägliche Sichtprüfung, Bedienung des Schubmasts, sicheres Fahren und Rangieren in engen Gängen, Lastaufnahme und Lastabsetzung, Ein- und Auslagern im Regal.",
        practicalTest: "Praktische Prüfung, danach Ihre Stufe-2-Qualifikation",
        afterExam: `Nach bestandener Prüfung erhalten Sie Ihr <strong>Zertifikat für die Stufe-2-Qualifikation</strong> und die <strong>Staplero ProCard</strong>.`,
        help: "Fragen? Wir helfen",
        whatsapp: "Per WhatsApp schreiben",
        bye: (c: string) => `Bis bald in ${c}!<br><strong>Ihr STAPLERO Team</strong>`,
        subject: (d: string, c: string) => `Platz reserviert: Schubmaststapler (Stufe 2) am ${d} in ${c}`,
        preheader: (d: string, c: string) => `Ihr Platz ist reserviert: ${d}, ${c}. Bitte Ausweis, Staplerschein Stufe 1 und Sicherheitsschuhe mitbringen.`,
        title: "Anmeldebestätigung",
        eyebrow: "Anmeldung bestätigt",
        headline: "Ihr Platz ist reserviert",
    },
    en: {
        locale: "en-GB",
        hours: (a: string, b: string) => `${a} – approx. ${b}`,
        calTitle: "STAPLERO Reach Truck Training (Level 2)",
        calDetails: (o: string) => `Order number ${o}. Please bring: ID, German forklift licence Level 1, safety shoes.`,
        heroIntro: (n: string) => `Hello ${n}, we look forward to seeing you. Here is everything you need for the <strong style="color:#ffffff;">Reach Truck Training (Level&nbsp;2)</strong>.`,
        ticketDay: "Training day &middot; Level 2",
        ticketWhat: "Theory, practice &amp; exam",
        ticketLen: "1 day",
        ticketTruck: "Reach truck",
        ticketFooter: (n: number) => `${n} ${n === 1 ? "participant" : "participants"} &middot; Please arrive 10 to 15 minutes before the start`,
        calBtn: "Add to calendar",
        routeBtn: "Plan route",
        findUs: "How to find us",
        findUsNote: "Please do not enter the company premises on your own. A STAPLERO instructor will pick you up at the entrance.",
        arrival: "Arrival &amp; meeting point",
        arrivalText: `Please arrive at the training location <strong>10 to 15 minutes before the start</strong>. A STAPLERO instructor will welcome you and take you to the training room.`,
        steps: [
            { title: "Via Neuköllnische Allee", text: "Go to house number 80." },
            { title: "To the main entrance of NLND Berlin", text: "The building with the NLND sign." },
            { title: "Report to the security gate", text: "At the gate with number 80 or at the reception." },
            { title: "Wait in the entrance area", text: "An instructor will pick you up. Running late? Call us:" },
        ],
        or: "or",
        step: "Step",
        participants: "Registered participants",
        buyer: "Booked by",
        forward: "Please forward this email to all participants. Each person needs their own ID, their own Level 1 forklift licence and safety shoes.",
        reqLabel: "Important: requirement",
        reqText: `The reach truck training is an <strong>additional qualification</strong>. You can only take part if you already hold a <strong>German forklift licence (Staplerschein) Level&nbsp;1</strong> (counterbalance forklift). Please make sure to bring proof of it. Without proof, participation is unfortunately not possible.`,
        bring: "Please bring",
        required: "Required",
        items: [
            { title: "ID card or passport" },
            { title: "German forklift licence Level 1", note: "original licence card or certificate (digital is fine)" },
            { title: "Safety shoes", note: "required for the practical part" },
            { title: "Suitable work clothes", note: "long trousers recommended. Hall temperature approx. 18 to 22 °C" },
        ],
        flow: "Schedule of the training day",
        flowNote: "According to DGUV Principle 308-001 and DGUV Regulation 68.",
        morning: "Morning &middot; Theory",
        from: (h: string) => `from ${h}`,
        morningText: "Design and function of the reach truck, differences from the counterbalance forklift, load capacity and load centre, stability when working at height, safety regulations and accident prevention.",
        exam: "Exam",
        writtenTest: "Written test",
        afternoon: "Afternoon &middot; Practice",
        until: (h: string) => `until approx. ${h}`,
        afternoonText: "Daily visual inspection, operating the reach mast, safe driving and manoeuvring in narrow aisles, picking up and setting down loads, storing and retrieving in racks.",
        practicalTest: "Practical exam, then your Level 2 qualification",
        afterExam: `After passing the exam you receive your <strong>Level 2 qualification certificate</strong> and the <strong>Staplero ProCard</strong>.`,
        help: "Questions? We are here to help",
        whatsapp: "Message us on WhatsApp",
        bye: (c: string) => `See you soon in ${c}!<br><strong>Your STAPLERO Team</strong>`,
        subject: (d: string, c: string) => `Place reserved: Reach Truck Training (Level 2) on ${d} in ${c}`,
        preheader: (d: string, c: string) => `Your place is reserved: ${d}, ${c}. Please bring your ID, Level 1 forklift licence and safety shoes.`,
        title: "Booking confirmation",
        eyebrow: "Booking confirmed",
        headline: "Your place is reserved",
    },
};

/**
 * Potwierdzenie rezerwacji kursu jednodniowego: Schubmaststapler-Ausbildung Stufe 2 (DE/EN).
 * Warunek udziału: niemiecki Staplerschein Stufe 1 — mocno to podkreślamy.
 * Język: opts.language, a bez niego angielski dla terminów „auf Englisch”, inaczej niemiecki.
 */
const sendReachTruckBookingEmail = async (opts: PracticalCourseBookingEmailOptions): Promise<void> => {
    const { to, name, orderNumber, locationName, locationAddress, participants = [] } = opts;
    const lang = opts.language === "en" || (!opts.language && /englisch|english/i.test(locationName)) ? "en" : "de";
    const T = reachTruckTexts[lang];

    const day = new Date(opts.startDate);

    // Godziny z terminu ("09:00 - 17:30"), inaczej domyślne
    const m = (opts.time || "").match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
    const hFrom = m ? m[1].padStart(5, "0") : COURSE_HOURS.from;
    const hTo = m ? m[2].padStart(5, "0") : COURSE_HOURS.to;
    const hours = T.hours(hFrom, hTo);

    const fmt = (o: Intl.DateTimeFormatOptions) => day.toLocaleDateString(T.locale, { timeZone: BERLIN_TZ, ...o });
    const longDate = fmt({ weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const shortDate = fmt({ weekday: "short", day: "numeric", month: "short" });
    const numericDate = lang === "en" ? fmt({ day: "numeric", month: "short" }) : berlinDate(day, { day: "2-digit", month: "2-digit" });

    const loc = escapeHtml(locationName);
    const addr = escapeHtml(locationAddress);
    const isBerlin = /berlin/i.test(locationName) || /neuk[öo]llnische\s+allee/i.test(locationAddress);
    // "Berlin (auf Englisch) Stufe 2 - Schubmaststapler" → "Berlin" do tematu i pożegnania
    const city = locationName.split(/[(\-–]/)[0].trim() || locationName;

    const calendarUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE"
        + `&text=${encodeURIComponent(T.calTitle)}`
        + `&dates=${calendarDay(day)}T${hFrom.replace(":", "")}00/${calendarDay(day)}T${hTo.replace(":", "")}00`
        + `&ctz=${encodeURIComponent(BERLIN_TZ)}`
        + `&location=${encodeURIComponent(locationAddress)}`
        + `&details=${encodeURIComponent(T.calDetails(orderNumber))}`;
    const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationAddress)}`;

    const people = participants.length ? participants : [name];
    const phones = `<a href="tel:+4916092490070" style="color:#111111;font-weight:700;">+49 160 92490070</a> ${T.or} <a href="tel:+4917622067783" style="color:#111111;font-weight:700;">+49 176 22067783</a>`;
    const label = (text: string, color: string) => `<span style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${color};">${text}</span>`;

    const heroHtml = `
      ${heroText(T.heroIntro(escapeHtml(name)))}
      ${heroTicket(
          [
              { label: T.ticketDay, title: shortDate, note: hours },
              { label: T.ticketWhat, title: T.ticketLen, note: T.ticketTruck },
          ],
          `<strong style="color:#ffffff;">${loc}</strong> &middot; ${addr}<br><span style="color:#b5b5b5;">${T.ticketFooter(people.length)}</span>`,
      )}
      ${heroButtons({ href: calendarUrl, label: T.calBtn }, { href: routeUrl, label: T.routeBtn })}
    `;

    const arrivalHtml = isBerlin
        ? `
      ${sectionTitle(T.findUs, T.findUsNote)}
      ${photoSteps(berlinArrivalSteps.map((s, i) => ({
          imageUrl: `${EMAIL_ASSETS_URL}/${s.image}`,
          alt: s.alt,
          title: T.steps[i].title,
          text: i === 3 ? `${T.steps[i].text} ${phones}` : T.steps[i].text,
      })), T.step)}`
        : `
      ${sectionTitle(T.arrival)}
      ${p(T.arrivalText)}`;

    const participantsHtml = people.length > 1
        ? `
      ${sectionTitle(T.participants)}
      ${numberedList(people.map((n, i) => i === 0 ? `${escapeHtml(n)} <span style="font-weight:400;color:#707072;font-size:13px;">&middot; ${T.buyer}</span>` : escapeHtml(n)))}
      ${p(T.forward, { small: true, muted: true })}`
        : "";

    const bodyHtml = `
      ${callout(`${label(T.reqLabel, "#c25e00")}<br>${T.reqText}`, "orange")}

      ${sectionTitle(T.bring)}
      ${checklist(T.items.map((it, i) => i < 3 ? { ...it, tag: T.required, strong: true } : it))}

      ${arrivalHtml}

      ${participantsHtml}

      ${sectionTitle(T.flow, T.flowNote)}
      ${timelineItem({
          title: T.morning,
          meta: `${shortDate} &middot; ${T.from(hFrom)}`,
          text: T.morningText,
          extraHtml: labeledPill(T.exam, T.writtenTest),
      })}
      ${timelineItem({
          title: T.afternoon,
          meta: T.until(hTo),
          text: T.afternoonText,
          extraHtml: labeledPill(T.exam, T.practicalTest, "orange"),
          accent: "orange",
          last: true,
      })}
      ${p(T.afterExam, { small: true, muted: true })}

      ${callout(`${label(T.help, "#c25e00")}<br>${strong(`<a href="tel:+4916092490070" style="color:#111111;text-decoration:none;">+49 160 92490070</a>`)}<br>${strong(`<a href="tel:+4917622067783" style="color:#111111;text-decoration:none;">+49 176 22067783</a>`)}<br><a href="https://wa.me/4917622067783" target="_blank" style="color:#111111;font-weight:700;">${T.whatsapp}</a>`, "orange")}

      ${p(T.bye(escapeHtml(city)))}
    `;

    await sendMail({
        from: FROM_EMAIL,
        to,
        subject: T.subject(numericDate, city),
        html: layout({
            title: T.title,
            preheader: T.preheader(longDate, city),
            eyebrow: T.eyebrow,
            eyebrowTone: "success",
            headline: T.headline,
            heroHtml,
            bodyHtml,
        }),
    });
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
      ${p(`Bei Fragen kontaktieren Sie uns bitte unter ${strong("info@staplero.com")}.`, { muted: true })}
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
        to: "info@staplero.com",
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
    sendExpiryReminderEmail,
    sendNewCourseDatesEmail,
    sendInvoiceEmail,
    sendContactFormEmail,
    sendContactConfirmationEmail,
};
