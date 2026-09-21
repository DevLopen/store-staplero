import { Resend } from "resend";
import {
    escapeHtml,
    renderEmail,
    p,
    strong,
    h2,
    sectionLabel,
    button,
    infoTable,
    callout,
    bullets,
    twoColumns,
    tile,
} from "./emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "STAPLERO <noreply@staplero.com>";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://staplero.com";
const API_URL = process.env.API_URL || "https://api.staplero.com";

const layout = (o: { title: string; preheader: string; eyebrow?: string; headline: string; bodyHtml: string }) =>
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

export const sendPracticalCourseBookingEmail = async (
    to: string,
    name: string,
    orderNumber: string,
    locationName: string,
    locationAddress: string,
    theoryDate: string,
    practiceDate: string,
    locationImageUrl?: string,
    participants?: string[]
): Promise<void> => {

    const theoryItems = [
        "Rechtliche Grundlagen und Unfallverhütungsvorschriften",
        "Rechte und Pflichten des Staplerfahrers",
        "Aufbau und Funktion von Flurförderzeugen",
        "Standsicherheit und Tragfähigkeit",
        "Lastschwerpunkt und Lastdiagramme",
        "Tägliche Sicht- und Funktionskontrolle",
        "Sicheres Arbeiten mit dem Gabelstapler",
        "Verkehrsregeln im Betrieb",
        "Verhalten in Gefahrensituationen",
        "Vorbereitung auf die theoretische Prüfung",
    ];

    const practiceItems = [
        "Tägliche Fahrzeugkontrolle",
        "Einweisung am Gabelstapler",
        "Sicheres Anfahren, Lenken und Bremsen",
        "Lasten sicher aufnehmen und transportieren",
        "Rangieren auf engem Raum",
        "Stapeln und Einlagern von Lasten",
        "Arbeiten unter realistischen Einsatzbedingungen",
        "Vorbereitung auf die praktische Prüfung",
    ];

    // Die Anfahrtsbeschreibung gilt nur für den Standort Berlin (NLND).
    const isBerlin = /berlin/i.test(locationName);
    const berlinSteps = [
        "Fahren Sie über die Neuköllnische Allee bis zur Hausnummer 80.",
        "Nutzen Sie den Haupteingang des NLND Berlin.",
        "Melden Sie sich bitte an der Wache bzw. am Empfang.",
        "Warten Sie im Eingangsbereich, ein STAPLERO-Ausbilder holt Sie ab.",
    ];

    const loc = escapeHtml(locationName);
    const addr = escapeHtml(locationAddress);
    const hours = "09:00 Uhr bis ca. 17:00 Uhr";

    const arrivalHtml = isBerlin
        ? `
      ${p(`Bitte erscheinen Sie ${strong("10 bis 15 Minuten vor Kursbeginn")}. Melden Sie sich an der ${strong("Wache bzw. am Empfang")}, ein STAPLERO-Ausbilder holt Sie dort ab und begleitet Sie zum Schulungsraum.`)}
      ${callout(`${strong("Hinweis:")} Bitte betreten Sie das Betriebsgelände nicht selbstständig.`)}
      ${bullets(berlinSteps)}`
        : `
      ${p(`Bitte erscheinen Sie ${strong("10 bis 15 Minuten vor Kursbeginn")} am Schulungsort. Ein STAPLERO-Ausbilder empfängt Sie dort und begleitet Sie zum Schulungsraum.`)}`;

    const participantsHtml = participants && participants.length > 1
        ? `${sectionLabel("Angemeldete Teilnehmer")}${bullets(participants.map((n) => escapeHtml(n)))}`
        : "";

    const bodyHtml = `
      ${p(`Sehr geehrte/r ${strong(escapeHtml(name))},`)}
      ${p(`vielen Dank für Ihre Anmeldung. Hiermit bestätigen wir die Reservierung Ihres Platzes für die ${strong("Gabelstaplerausbildung Stufe&nbsp;1 (Frontstapler)")} nach DGUV Grundsatz 308-001 und DGUV Vorschrift 68.`)}

      ${sectionLabel("Schulungstermine")}
      ${twoColumns(
          tile({ label: "1. Schulungstag", title: "Theorie", value: theoryDate, note: hours, accent: "ink" }),
          tile({ label: "2. Schulungstag", title: "Praxis &amp; Prüfung", value: practiceDate, note: hours, accent: "orange" }),
      )}

      ${participantsHtml}

      ${sectionLabel("Schulungsort")}
      ${infoTable([
          ["Standort", loc],
          ["Adresse", addr],
          ["Bestellnummer", escapeHtml(orderNumber)],
      ])}

      ${sectionLabel("Anreise &amp; Treffpunkt")}
      ${arrivalHtml}
      ${locationImageUrl ? `<img src="${escapeHtml(locationImageUrl)}" alt="Anfahrt ${loc}" width="640" style="display:block;width:100%;max-width:640px;height:auto;border:1px solid #e5e5e5;margin:8px 0 20px;">` : ""}
      ${twoColumns(
          infoTable([["Telefon 1", "+49 176 22067783"]], 100),
          infoTable([["Telefon 2", "+49 160 92490070"]], 100),
      )}
      ${p("Wir sind auch per WhatsApp erreichbar.", { small: true, muted: true })}

      ${sectionLabel("Ablauf")}
      ${h2("1. Tag: Theorie")}
      ${p(hours, { small: true, muted: true })}
      ${p("Inhalte gemäß DGUV Grundsatz 308-001 und DGUV Vorschrift 68:")}
      ${bullets(theoryItems)}
      ${callout(`Am Ende des Schulungstages: ${strong("schriftliche Theorieprüfung")}`, "gray")}
      ${infoTable([["Bitte mitbringen", "Personalausweis oder Reisepass<br>Passbild<br>Arbeitssicherheitsschuhe"]])}

      ${h2("2. Tag: Praxis")}
      ${p(hours, { small: true, muted: true })}
      ${infoTable([["Treffpunkt", `${strong(loc)}<br><span style="font-weight:400;">${addr}</span><br><span style="font-weight:400;font-size:13px;color:#707072;">Bitte erneut an der Wache melden.</span>`]])}
      ${bullets(practiceItems)}
      ${callout(`Zum Abschluss: ${strong("praktische Fahrprüfung")}`, "gray")}
      ${infoTable([["Bitte mitbringen", `Personalausweis oder Reisepass<br>${strong("Arbeitssicherheitsschuhe (Pflicht)")}<br>Geeignete Arbeitskleidung (lange Hosen empfohlen)<br><span style="font-weight:400;font-size:13px;color:#707072;">Hallentemperatur ca. 18 bis 22 °C</span>`]])}

      ${sectionLabel("Stornierungsbedingungen")}
      ${infoTable([
          ["Kostenfreie Stornierung", "bis 7 Kalendertage vor dem Termin"],
          ["Bei späterer Absage", "100 % Stornogebühr"],
      ])}

      ${p("Für Rückfragen stehen wir Ihnen jederzeit zur Verfügung.", { muted: true })}
      ${p("Mit freundlichen Grüßen")}
      ${p(strong("Ihr STAPLERO Team"))}
    `;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Anmeldebestätigung: Gabelstaplerausbildung ${theoryDate} / ${practiceDate}`,
        html: layout({
            title: "Anmeldebestätigung",
            preheader: `Ihr Platz ist reserviert: ${theoryDate} und ${practiceDate}, ${locationName}.`,
            eyebrow: "Schulungsbestätigung",
            headline: "Ihr Platz ist reserviert",
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
