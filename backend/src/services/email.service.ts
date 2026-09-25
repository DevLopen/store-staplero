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
const FRONTEND_URL = process.env.FRONTEND_URL || "https://staplero.com";
const API_URL = process.env.API_URL || "https://api.staplero.com";

const layout = (o: Omit<LayoutOptions, "baseUrl">) =>
    renderEmail({ baseUrl: FRONTEND_URL, ...o });

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
    const downloadUrl = `${FRONTEND_URL}/dashboard`;
    const appleWalletUrl = `${API_URL}/api/certificates/${certId}/wallet/apple`;
    const googleWalletUrl = `${API_URL}/api/certificates/${certId}/wallet/google`;

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
      ${button(downloadUrl, "PDF im Dashboard öffnen", "primary")}
      ${twoColumns(
          button(appleWalletUrl, "Zu Apple Wallet hinzufügen", "dark", true),
          button(`${googleWalletUrl}/redirect`, "Zu Google Wallet hinzufügen", "outline", true),
      )}
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

    await resend.emails.send({
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

export const handleGoogleWalletRedirect = async (req: any, res: any) => {
    try {
        const { code } = req.params;
        const cert = await (await import("../models/Certificate")).default
            .findOne({ verificationCode: code }).lean();

        if (!cert) return res.status(404).send("Zertifikat nicht gefunden");

        const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT
            ? JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT)
            : null;
        const GOOGLE_ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID || "";
        const GOOGLE_CLASS_ID = `${GOOGLE_ISSUER_ID}.staplero_certificate`;

        if (!GOOGLE_SERVICE_ACCOUNT || !GOOGLE_ISSUER_ID) {
            return res.redirect(`${process.env.FRONTEND_URL}/verify/${code}`);
        }

        const { default: jwt } = await import("jsonwebtoken");
        const dateShort = new Date(cert.trainingDate).toLocaleDateString("de-DE");
        const verifyUrl = `${process.env.FRONTEND_URL}/verify/${cert.verificationCode}`;

        const genericObject = {
            id: `${GOOGLE_ISSUER_ID}.${cert.verificationCode}`,
            classId: GOOGLE_CLASS_ID,
            genericType: "GENERIC_TYPE_UNSPECIFIED",
            hexBackgroundColor: "#0f172a",
            cardTitle: { defaultValue: { language: "de-DE", value: "STAPLERO" } },
            subheader: { defaultValue: { language: "de-DE", value: "Befähigungsnachweis" } },
            header: { defaultValue: { language: "de-DE", value: cert.userName } },
            textModulesData: [
                { id: "certId", header: "Zertifikat-Nr.", body: cert.verificationCode },
                { id: "regulation", header: "Rechtsgrundlage", body: "DGUV Vorschrift 68 · GS 308-001" },
                { id: "date", header: "Ausbildungsdatum", body: dateShort },
            ],
            barcode: { type: "QR_CODE", value: verifyUrl, alternateText: cert.verificationCode },
            state: "ACTIVE",
        };

        const token = jwt.sign(
            { iss: GOOGLE_SERVICE_ACCOUNT.client_email, aud: "google", origins: [], typ: "savetowallet", payload: { genericObjects: [genericObject] } },
            GOOGLE_SERVICE_ACCOUNT.private_key,
            { algorithm: "RS256" }
        );

        res.redirect(`https://pay.google.com/gp/v/save/${token}`);
    } catch (err) {
        res.status(500).send("Fehler");
    }
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

    await resend.emails.send({
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

    await resend.emails.send({
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

    await resend.emails.send({
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

    await resend.emails.send({
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
    participants?: string[]; // pierwsza osoba to zamawiający
}

const BERLIN_TZ = "Europe/Berlin";
const COURSE_HOURS = { from: "09:00", to: "17:00" };

// Zdjęcia kolejnych kroków dojazdu do NLND Berlin (public/)
const berlinArrivalSteps = [
    { image: "anfahrt-berlin-1.jpg", alt: "Neuköllnische Allee", title: "Über die Neuköllnische Allee", text: "Fahren Sie bis zur Hausnummer 80." },
    { image: "anfahrt-berlin-2.jpg", alt: "Gebäude NLND Berlin", title: "Zum Haupteingang NLND Berlin", text: "Das Gebäude mit dem NLND-Schriftzug." },
    { image: "anfahrt-berlin-3.jpg", alt: "Tor mit Hausnummer 80", title: "An der Wache melden", text: "Am Tor mit der Nummer 80 bzw. am Empfang." },
    { image: "anfahrt-berlin-4.jpg", alt: "Wartebereich am Eingang", title: "Im Eingangsbereich warten", text: `Ein Ausbilder holt Sie ab. Verspätet? Rufen Sie uns an: <a href="tel:+4917622067783" style="color:#111111;font-weight:700;">+49 176 22067783</a>` },
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

    const longDate = (d: Date) => berlinDate(d, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const shortDate = (d: Date) => berlinDate(d, { weekday: "short", day: "numeric", month: "short" });
    const numericDate = (d: Date) => berlinDate(d, { day: "2-digit", month: "2-digit" }); // "12.10."
    // "12.–13.10." albo "31.10.–01.11." przy zmianie miesiąca
    const dateRange = berlinDate(theory, { month: "2-digit" }) === berlinDate(practice, { month: "2-digit" })
        ? `${berlinDate(theory, { day: "2-digit" })}.–${numericDate(practice)}`
        : `${numericDate(theory)}–${numericDate(practice)}`;
    const hours = `${COURSE_HOURS.from} – ca. ${COURSE_HOURS.to} Uhr`;

    const loc = escapeHtml(locationName);
    const addr = escapeHtml(locationAddress);
    const isBerlin = /berlin/i.test(locationName);

    // Oba dni jako wydarzenie powtarzane codziennie x2
    const from = COURSE_HOURS.from.replace(":", "") + "00";
    const until = COURSE_HOURS.to.replace(":", "") + "00";
    const calendarUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE"
        + `&text=${encodeURIComponent("STAPLERO Gabelstaplerausbildung")}`
        + `&dates=${calendarDay(theory)}T${from}/${calendarDay(theory)}T${until}`
        + `&ctz=${encodeURIComponent(BERLIN_TZ)}`
        + `&recur=${encodeURIComponent("RRULE:FREQ=DAILY;COUNT=2")}`
        + `&location=${encodeURIComponent(locationAddress)}`
        + `&details=${encodeURIComponent(`Bestellnummer ${orderNumber}`)}`;
    const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationAddress)}`;

    const people = participants.length ? participants : [name];

    const heroHtml = `
      ${heroText(`Hallo ${escapeHtml(name)}, wir freuen uns auf Sie. Hier finden Sie alles, was Sie für die <strong style="color:#ffffff;">Gabelstaplerausbildung Stufe&nbsp;1</strong> brauchen.`)}
      ${heroTicket(
          [
              { label: "Tag 1 &middot; Theorie", title: shortDate(theory), note: hours },
              { label: "Tag 2 &middot; Praxis &amp; Prüfung", title: shortDate(practice), note: hours },
          ],
          `<strong style="color:#ffffff;">${loc}</strong> &middot; ${addr}<br><span style="color:#b5b5b5;">${people.length} Teilnehmer &middot; Bitte 10 bis 15 Minuten vor Kursbeginn da sein</span>`,
      )}
      ${heroButtons({ href: calendarUrl, label: "In den Kalender eintragen" }, { href: routeUrl, label: "Route planen" })}
    `;

    const arrivalHtml = isBerlin
        ? `
      ${sectionTitle("So finden Sie uns", "Bitte betreten Sie das Betriebsgelände nicht selbstständig. Ein STAPLERO-Ausbilder holt Sie am Eingang ab, an beiden Tagen.")}
      ${photoSteps(berlinArrivalSteps.map((s) => ({ imageUrl: `${FRONTEND_URL}/${s.image}`, alt: s.alt, title: s.title, text: s.text })))}`
        : `
      ${sectionTitle("Anreise &amp; Treffpunkt")}
      ${p(`Bitte erscheinen Sie ${strong("10 bis 15 Minuten vor Kursbeginn")} am Schulungsort. Ein STAPLERO-Ausbilder empfängt Sie dort und begleitet Sie zum Schulungsraum.`)}`;

    const participantsHtml = people.length > 1
        ? `
      ${sectionTitle("Angemeldete Teilnehmer")}
      ${numberedList(people.map((n, i) => i === 0 ? `${escapeHtml(n)} <span style="font-weight:400;color:#707072;font-size:13px;">&middot; Besteller</span>` : escapeHtml(n)))}
      ${p("Bitte leiten Sie diese E-Mail an alle Teilnehmer weiter. Jede Person braucht einen eigenen Ausweis und Sicherheitsschuhe.", { small: true, muted: true })}`
        : "";

    const bodyHtml = `
      ${sectionTitle("Bitte mitbringen", undefined, { first: true })}
      ${checklist([
          { title: "Personalausweis oder Reisepass", note: "an beiden Tagen", tag: "Pflicht", strong: true },
          { title: "Arbeitssicherheitsschuhe", note: "an beiden Tagen, am Praxistag Pflicht", tag: "Pflicht", strong: true },
          { title: "Geeignete Arbeitskleidung", note: "am Praxistag, lange Hose empfohlen. Hallentemperatur ca. 18 bis 22 °C" },
      ])}

      ${arrivalHtml}

      ${participantsHtml}

      ${sectionTitle("Ablauf der Ausbildung", "Nach DGUV Grundsatz 308-001 und DGUV Vorschrift 68.")}
      ${timelineItem({
          title: "Tag 1 &middot; Theorie",
          meta: `${shortDate(theory)} &middot; ${COURSE_HOURS.from}–${COURSE_HOURS.to}`,
          text: "Rechtliche Grundlagen, Rechte und Pflichten, Aufbau des Staplers, Standsicherheit und Tragfähigkeit, Lastdiagramme, tägliche Kontrolle, Verkehrsregeln im Betrieb, Verhalten in Gefahrensituationen.",
          extraHtml: labeledPill("Prüfung", "Schriftlicher Test am Ende des Tages"),
      })}
      ${timelineItem({
          title: "Tag 2 &middot; Praxis",
          meta: `${shortDate(practice)} &middot; ${COURSE_HOURS.from}–${COURSE_HOURS.to}`,
          text: `Fahrzeugkontrolle, Einweisung am Gabelstapler, Anfahren, Lenken und Bremsen, Lasten aufnehmen und transportieren, Rangieren auf engem Raum, Stapeln und Einlagern.${isBerlin ? " Treffpunkt wie am ersten Tag, bitte erneut an der Wache melden." : ""}`,
          extraHtml: labeledPill("Prüfung", "Fahrprüfung, danach Ihr Staplerschein", "orange"),
          accent: "orange",
          last: true,
      })}

      ${twoColumns(
          callout(`<span style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#707072;">Stornierung</span><br>Kostenfrei bis<br>${strong(longDate(cancelUntil))}<br><span style="font-size:13px;color:#707072;">Danach fällt eine Stornogebühr von 100&nbsp;% an.</span>`, "gray"),
          callout(`<span style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c25e00;">Fragen? Wir helfen</span><br>${strong(`<a href="tel:+4917622067783" style="color:#111111;text-decoration:none;">+49 176 22067783</a>`)}<br>${strong(`<a href="tel:+4916092490070" style="color:#111111;text-decoration:none;">+49 160 92490070</a>`)}<br><a href="https://wa.me/4917622067783" target="_blank" style="color:#111111;font-weight:700;">Per WhatsApp schreiben</a>`, "orange"),
      )}

      ${p(`Bis bald in ${loc}!<br>${strong("Ihr STAPLERO Team")}`)}
    `;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Platz reserviert: Staplerschein ${dateRange} in ${locationName}`,
        html: layout({
            title: "Anmeldebestätigung",
            preheader: `Ihr Platz ist reserviert: ${longDate(theory)} und ${longDate(practice)}, ${locationName}. Bitte Ausweis und Sicherheitsschuhe mitbringen.`,
            eyebrow: "Anmeldung bestätigt",
            eyebrowTone: "success",
            headline: "Ihr Platz ist reserviert",
            heroHtml,
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

    await resend.emails.send({
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

    await resend.emails.send({
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

    await resend.emails.send({
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

    await sendContactConfirmationEmail(email, name);
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

    await resend.emails.send({
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
    sendInvoiceEmail,
    sendContactFormEmail,
    sendContactConfirmationEmail,
};
