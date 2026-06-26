import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "STAPLERO <noreply@staplero.com>";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://staplero.com";

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

    const dateStr = new Date(trainingDate).toLocaleDateString("de-DE", {
        year: "numeric", month: "long", day: "numeric",
    });

    const verifyUrl = `${FRONTEND_URL}/verify/${verificationCode}`;
    const downloadUrl = `${FRONTEND_URL}/dashboard`;
    const appleWalletUrl = `${process.env.API_URL || "https://api.staplero.com"}/api/certificates/${certId}/wallet/apple`;
    const googleWalletUrl = `${process.env.API_URL || "https://api.staplero.com"}/api/certificates/${certId}/wallet/google`;

    const typeLabel = certType === "practical"
        ? "Praxiskurs – Gabelstapler-Fahrausweis"
        : "Online-Theoriekurs";

    const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ihr Staplerschein – STAPLERO</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f1f5f9; color: #0f172a; }
    .wrapper { max-width: 600px; margin: 40px auto; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 32px; border-radius: 12px 12px 0 0; text-align: center; }
    .logo-text { font-size: 28px; font-weight: 900; color: #f59e0b; letter-spacing: -0.5px; }
    .logo-text span { color: #ffffff; }
    .header-subtitle { color: #94a3b8; font-size: 13px; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase; }
    .cert-badge { display: inline-block; margin-top: 20px; background: rgba(245,158,11,0.15); border: 1px solid #f59e0b; color: #f59e0b; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; }
    .body { background: #ffffff; padding: 40px 32px; }
    .greeting { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .intro { color: #475569; font-size: 15px; line-height: 1.7; margin-bottom: 28px; }
    .cert-card { background: #0f172a; border-radius: 12px; padding: 28px; margin-bottom: 28px; border: 1px solid #1e3a5f; }
    .cert-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .cert-card-title { color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
    .cert-card-code { font-family: 'Courier New', monospace; background: #1e293b; color: #f59e0b; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }
    .cert-name { color: #ffffff; font-size: 24px; font-weight: 800; margin-bottom: 16px; }
    .cert-meta { display: flex; flex-wrap: wrap; gap: 12px; }
    .cert-meta-item { background: #1e293b; border-radius: 8px; padding: 10px 14px; flex: 1; min-width: 140px; }
    .cert-meta-label { color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
    .cert-meta-value { color: #e2e8f0; font-size: 13px; font-weight: 600; }
    .dguv-badge { display: inline-block; margin-top: 16px; background: rgba(245,158,11,0.1); border-left: 3px solid #f59e0b; padding: 8px 12px; border-radius: 0 6px 6px 0; color: #94a3b8; font-size: 11px; line-height: 1.5; }
    .dguv-badge strong { color: #f59e0b; }
    .actions-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    .btn-primary { display: block; background: #f59e0b; color: #0f172a !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 800; font-size: 15px; text-align: center; margin-bottom: 12px; }
    .btn-apple { display: block; background: #000000; color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; text-align: center; margin-bottom: 12px; }
    .btn-google { display: block; background: #4285F4; color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; text-align: center; margin-bottom: 12px; }
    .divider { height: 1px; background: #f1f5f9; margin: 28px 0; }
    .verify-section { background: #f8fafc; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 28px; }
    .verify-title { font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 8px; }
    .verify-code { font-family: 'Courier New', monospace; font-size: 20px; font-weight: 800; color: #f59e0b; background: #0f172a; padding: 10px 20px; border-radius: 8px; display: inline-block; letter-spacing: 2px; margin-bottom: 8px; }
    .verify-hint { font-size: 12px; color: #94a3b8; }
    .verify-link { color: #3b82f6; text-decoration: none; font-size: 12px; }
    .note { color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 20px; }
    .footer { background: #f8fafc; padding: 24px 32px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-text { color: #94a3b8; font-size: 12px; line-height: 1.7; }
    .footer-text a { color: #3b82f6; text-decoration: none; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo-text">STAPLER<span>O</span></div>
    <div class="header-subtitle">Ausbildungszentrum · DGUV V68</div>
    <div class="cert-badge">Zertifikat ausgestellt</div>
  </div>
  <div class="body">
    <div class="greeting">Herzlichen Glückwunsch, ${userName}!</div>
    <div class="intro">
      Sie haben Ihre Ausbildung zum Gabelstaplerfahrer erfolgreich abgeschlossen.<br>
      Im Anhang dieser E-Mail finden Sie Ihren <strong>Staplerschein als PDF</strong>.
    </div>
    <div class="cert-card">
      <div class="cert-card-header">
        <div class="cert-card-title">Befähigungsnachweis</div>
        <div class="cert-card-code">${verificationCode}</div>
      </div>
      <div class="cert-name">${userName}</div>
      <div class="cert-meta">
        <div class="cert-meta-item">
          <div class="cert-meta-label">Kurs</div>
          <div class="cert-meta-value">${typeLabel}</div>
        </div>
        <div class="cert-meta-item">
          <div class="cert-meta-label">Ausbildungsdatum</div>
          <div class="cert-meta-value">${dateStr}</div>
        </div>
        ${trainingLocation ? `
        <div class="cert-meta-item">
          <div class="cert-meta-label">Ausbildungsort</div>
          <div class="cert-meta-value">${trainingLocation}</div>
        </div>` : ""}
        ${instructorName ? `
        <div class="cert-meta-item">
          <div class="cert-meta-label">Ausbilder</div>
          <div class="cert-meta-value">${instructorName}</div>
        </div>` : ""}
      </div>
      <div class="dguv-badge">
        <strong>DGUV Vorschrift 68</strong> · Flurförderzeuge<br>
        <strong>DGUV Grundsatz 308-001</strong> · Ausbildung und Beauftragung
      </div>
    </div>
    <div class="actions-title">Zertifikat speichern</div>
    <a href="${downloadUrl}" class="btn-primary">PDF im Dashboard öffnen</a>
    <a href="${appleWalletUrl}" class="btn-apple">Zu Apple Wallet hinzufügen</a>
    <a href="${googleWalletUrl}/redirect" class="btn-google">Zu Google Wallet hinzufügen</a>
    <div class="divider"></div>
    <div class="verify-section">
      <div class="verify-title">Echtheitsprüfung – für Arbeitgeber</div>
      <div class="verify-code">${verificationCode}</div><br>
      <div class="verify-hint">Dieser Code kann von jedem Arbeitgeber auf</div>
      <a href="${verifyUrl}" class="verify-link">${verifyUrl}</a>
      <div class="verify-hint" style="margin-top:4px">geprüft werden – ohne Anmeldung.</div>
    </div>
    <p class="note">
      <strong>Wichtig:</strong> Bitte bewahren Sie dieses Zertifikat sorgfältig auf.
    </p>
  </div>
  <div class="footer">
    <div class="footer-text">
      STAPLERO Ausbildungszentrum · Jakobstr. 13, 02826 Görlitz<br>
      <a href="mailto:info@staplero.com">info@staplero.com</a> · +49 176 22067783<br>
      <a href="${FRONTEND_URL}/datenschutz">Datenschutz</a> · <a href="${FRONTEND_URL}/impressum">Impressum</a>
    </div>
  </div>
</div>
</body>
</html>
    `;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Ihr Staplerschein ist ausgestellt – STAPLERO (${verificationCode})`,
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

export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
    const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}
      .container{max-width:600px;margin:0 auto;padding:20px;}
      .header{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;}
      .button{display:inline-block;background:#f39200;color:white;padding:12px 30px;text-decoration:none;border-radius:6px;margin:20px 0;}
      .footer{text-align:center;margin-top:30px;color:#666;font-size:14px;}
    </style></head>
    <body><div class="container">
      <div class="header"><h1>Willkommen bei STAPLERO!</h1></div>
      <div class="content">
        <h2>Hallo ${name}!</h2>
        <p>Vielen Dank für Ihre Registrierung bei STAPLERO – Ihrem Partner für professionelle Staplerausbildung.</p>
        <p>Sie können sich jetzt einloggen und mit Ihrem Kurs beginnen:</p>
        <a href="${FRONTEND_URL}/login" class="button">Zum Login</a>
        <p>Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.</p>
        <p><strong>Ihr STAPLERO Team</strong></p>
      </div>
      <div class="footer"><p>STAPLERO | info@staplero.com | +49 176 22067783</p></div>
    </div></body></html>`;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: "Willkommen bei STAPLERO!",
        html,
    });
};

export const sendOnlineCoursePurchaseEmail = async (
    to: string,
    name: string,
    courseName: string,
    orderNumber: string,
    expiresAt: Date
): Promise<void> => {
    const expiryDate = new Date(expiresAt).toLocaleDateString("de-DE", {
        year: "numeric", month: "long", day: "numeric",
    });

    const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}
      .container{max-width:600px;margin:0 auto;padding:20px;}
      .header{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;}
      .info-box{background:white;padding:20px;border-left:4px solid #f39200;margin:20px 0;}
      .button{display:inline-block;background:#f39200;color:white;padding:12px 30px;text-decoration:none;border-radius:6px;margin:20px 0;}
      .footer{text-align:center;margin-top:30px;color:#666;font-size:14px;}
      .highlight{color:#f39200;font-weight:bold;}
    </style></head>
    <body><div class="container">
      <div class="header"><h1>Zahlung erfolgreich!</h1></div>
      <div class="content">
        <h2>Hallo ${name}!</h2>
        <p>Vielen Dank für Ihren Kauf! Sie haben nun Zugang zu:</p>
        <div class="info-box">
          <h3>${courseName}</h3>
          <p><strong>Bestellnummer:</strong> ${orderNumber}</p>
          <p><strong>Zugang gültig bis:</strong> <span class="highlight">${expiryDate}</span></p>
        </div>
        <a href="${FRONTEND_URL}/dashboard" class="button">Zum Kurs</a>
        <p><strong>Viel Erfolg!</strong><br>Ihr STAPLERO Team</p>
      </div>
      <div class="footer"><p>STAPLERO | info@staplero.com | +49 176 22067783</p></div>
    </div></body></html>`;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Ihr Online-Kurs: ${courseName} - Zugang freigeschaltet!`,
        html,
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
    wantsPlasticCard: boolean,
    locationImageUrl?: string
): Promise<void> => {

    const theoryItems = [
        'Rechtliche Grundlagen und Unfallverhütungsvorschriften',
        'Rechte und Pflichten des Staplerfahrers',
        'Aufbau und Funktion von Flurförderzeugen',
        'Standsicherheit und Tragfähigkeit',
        'Lastschwerpunkt und Lastdiagramme',
        'Tägliche Sicht- und Funktionskontrolle',
        'Sicheres Arbeiten mit dem Gabelstapler',
        'Verkehrsregeln im Betrieb',
        'Verhalten in Gefahrensituationen',
        'Vorbereitung auf die theoretische Prüfung',
    ];

    const practiceItems = [
        'Tägliche Fahrzeugkontrolle',
        'Einweisung am Gabelstapler',
        'Sicheres Anfahren, Lenken und Bremsen',
        'Lasten sicher aufnehmen und transportieren',
        'Rangieren auf engem Raum',
        'Stapeln und Einlagern von Lasten',
        'Arbeiten unter realistischen Einsatzbedingungen',
        'Vorbereitung auf die praktische Prüfung',
    ];

    const steps = [
        'Fahren Sie über die Neuköllnische Allee bis zur Hausnummer 80.',
        'Nutzen Sie den Haupteingang des NLND Berlin.',
        'Melden Sie sich bitte an der Wache bzw. am Empfang.',
        'Warten Sie im Eingangsbereich — ein STAPLERO-Ausbilder holt Sie ab.',
    ];

    const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anmeldebestätigung – STAPLERO</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #F0EFE9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #2C2416; }
    .wrap { background: #F0EFE9; padding: 32px 16px; }
    .shell { max-width: 600px; margin: 0 auto; }
    .top-rule { height: 4px; background: #F39200; }
    .header { background: #ffffff; padding: 22px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E8E6E0; }
    .header-right-label { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #B8B4AC; }
    .header-right-val { font-size: 12px; color: #6B6560; margin-top: 3px; font-family: 'Courier New', Courier, monospace; }
    .body { background: #ffffff; padding: 48px 40px 44px; }
    .greeting { font-size: 26px; font-weight: 300; color: #2C2416; letter-spacing: -0.5px; line-height: 1.3; margin-bottom: 14px; }
    .intro { font-size: 14px; line-height: 1.8; color: #6B6560; margin-bottom: 44px; }
    .rule-section { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .rule-section-line { height: 1px; background: #E8E6E0; flex: 1; }
    .rule-section-label { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #F39200; white-space: nowrap; font-family: 'Courier New', Courier, monospace; }
    .dates-row { display: flex; gap: 16px; margin-bottom: 44px; }
    .date-block { flex: 1; padding: 22px 24px; border: 1px solid #E8E6E0; position: relative; }
    .date-accent-dark { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: #2C2416; }
    .date-accent-orange { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: #F39200; }
    .date-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #B8B4AC; margin-bottom: 10px; font-family: 'Courier New', Courier, monospace; }
    .date-type { font-size: 13px; font-weight: 600; color: #2C2416; margin-bottom: 14px; }
    .date-main { font-size: 17px; font-weight: 500; color: #2C2416; line-height: 1.4; }
    .date-time { font-size: 11px; color: #B8B4AC; margin-top: 10px; font-family: 'Courier New', Courier, monospace; }
    .info-row { display: flex; align-items: baseline; gap: 16px; padding: 12px 0; border-bottom: 1px solid #F0EFE9; }
    .info-row:first-child { border-top: 1px solid #F0EFE9; }
    .info-label { font-size: 11px; font-weight: 600; color: #B8B4AC; text-transform: uppercase; letter-spacing: 1.5px; min-width: 90px; flex-shrink: 0; }
    .info-val { font-size: 14px; color: #2C2416; font-weight: 500; }
    .info-sub { font-size: 12px; color: #9C9590; }
    .hint { background: #FDF8F0; border-left: 3px solid #F39200; padding: 14px 18px; margin: 16px 0 20px; }
    .hint-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #C87800; margin-bottom: 4px; font-family: 'Courier New', Courier, monospace; }
    .hint-text { font-size: 13px; color: #8A6020; line-height: 1.6; }
    .step { display: flex; align-items: flex-start; gap: 16px; padding: 10px 0; border-bottom: 1px solid #F0EFE9; }
    .step:last-child { border-bottom: none; }
    .step-num { font-size: 13px; color: #F39200; font-weight: 500; min-width: 16px; padding-top: 1px; font-family: 'Courier New', Courier, monospace; }
    .step-text { font-size: 13px; color: #4A4540; line-height: 1.6; }
    .photo-box { width: 100%; margin: 24px 0; }
    .photo-box img { display: block; width: 100%; height: auto; border: 1px solid #E8E6E0; }
    .photo-placeholder { width: 100%; height: 140px; background: #F0EFE9; border: 1px solid #E8E6E0; display: flex; align-items: center; justify-content: center; margin: 24px 0; }
    .photo-placeholder span { font-size: 10px; letter-spacing: 2px; color: #C8C4BC; text-transform: uppercase; font-family: 'Courier New', Courier, monospace; }
    .tel-table { width: 100%; border-collapse: collapse; border: 1px solid #E8E6E0; margin-bottom: 6px; }
    .tel-table td { padding: 16px 20px; }
    .tel-table td:first-child { border-right: 1px solid #E8E6E0; }
    .tel-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #B8B4AC; margin-bottom: 4px; font-family: 'Courier New', Courier, monospace; }
    .tel-val { font-size: 14px; font-weight: 500; color: #2C2416; }
    .wa-note { font-size: 11px; color: #B8B4AC; margin-bottom: 44px; padding-top: 6px; }
    .day-head { margin: 36px 0 20px; padding-bottom: 16px; border-bottom: 2px solid #F0EFE9; }
    .day-tag { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 6px; font-family: 'Courier New', Courier, monospace; }
    .day-title { font-size: 28px; font-weight: 300; color: #2C2416; letter-spacing: -0.5px; }
    .day-time { font-size: 11px; color: #B8B4AC; margin-top: 6px; font-family: 'Courier New', Courier, monospace; }
    .content-list { margin: 0 0 16px; padding: 0; list-style: none; }
    .content-list li { font-size: 13px; color: #4A4540; padding: 7px 0 7px 18px; border-bottom: 1px solid #F5F4F0; position: relative; line-height: 1.5; }
    .content-list li:last-child { border-bottom: none; }
    .content-list li:before { content: '—'; position: absolute; left: 0; color: #F39200; font-size: 12px; }
    .pruefung-note { font-size: 13px; color: #4A4540; margin: 8px 0 20px; padding: 12px 16px; border-left: 2px solid #2C2416; }
    .mit-block { background: #F7F6F2; padding: 18px 20px; }
    .mit-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #B8B4AC; margin-bottom: 10px; font-family: 'Courier New', Courier, monospace; }
    .mit-item { font-size: 13px; color: #2C2416; padding: 3px 0; }
    .mit-note { font-size: 11px; color: #B8B4AC; margin-top: 10px; padding-top: 10px; border-top: 1px solid #E8E6E0; font-family: 'Courier New', Courier, monospace; }
    .treffpunkt { padding: 14px 18px; border: 1px solid #E8E6E0; margin-bottom: 16px; }
    .tp-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #B8B4AC; margin-bottom: 6px; font-family: 'Courier New', Courier, monospace; }
    .tp-name { font-size: 14px; font-weight: 600; color: #2C2416; }
    .tp-addr { font-size: 13px; color: #6B6560; }
    .tp-note { font-size: 11px; color: #B8B4AC; margin-top: 4px; }
    .procard { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: #F0FDF4; border-left: 2px solid #4ADE80; margin: 24px 0; }
    .procard-text { font-size: 13px; color: #166534; }
    .storno { padding: 24px; background: #FDF8F0; border: 1px solid #F39200; margin: 36px 0; }
    .storno-title { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #F39200; margin-bottom: 14px; font-family: 'Courier New', Courier, monospace; }
    .storno-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #F5EDD8; }
    .storno-row:last-child { border-bottom: none; }
    .storno-key { font-size: 12px; color: #8A6020; font-weight: 500; }
    .storno-val { font-size: 12px; color: #8A6020; }
    .footer { background: #F0EFE9; padding: 22px 40px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E0DED8; }
    .footer-info { font-size: 11px; color: #9C9590; line-height: 1.8; text-align: right; }
    .footer-info a { color: #B8B4AC; text-decoration: none; }
  </style>
</head>
<body>
<div class="wrap">
<div class="shell">

  <div class="top-rule"></div>

  <div class="header">
    <svg viewBox="395 785 1197 429" width="120" height="44" xmlns="http://www.w3.org/2000/svg">
      <path style="fill:#2C2416" d="m1488.32 1208.9h-989.11c-54.37 0-98.44-44.07-98.44-98.44l-0.01-221.63c0-54.37 44.08-98.44 98.45-98.44l989.11-0.01c54.37 0 98.44 44.08 98.44 98.45l0.01 221.62c0 54.37-44.08 98.45-98.45 98.45z"/>
      <path fill-rule="evenodd" style="fill:#ffffff" d="m614.76 1006.08q-9.31-13.65-45.17-34.93-12.52-7.4-15.18-12.63-2.8-5.23-2.8-15.57-0.01-8.05 2.49-12.01 2.49-3.96 7.34-3.95 4.46 0 6.37 2.92 1.92 2.95 1.92 13.66v15.31h49.88v-8.17q0.01-24.62-4.77-34.89-4.81-10.27-19.53-17.03-14.74-6.77-35.66-6.77-19.13 0.01-32.67 6.19-13.52 6.19-19.58 17.16-6.07 10.98-6.07 34.7 0.01 16.47 4.28 27.05 4.27 10.6 10.78 16.6 6.51 5.99 26.54 19.25 20.04 13.14 25.13 18.76 4.99 5.62 4.98 23.86 0 8.29-2.61 12.51-2.62 4.2-7.98 4.2-5.35 0-7.45-3.31-2.12-3.32-2.12-14.94v-25.13h-49.88v13.53q-0.01 23.21 4.73 35.85 4.71 12.63 19.95 20.8 15.25 8.17 36.82 8.17 19.65-0.01 34.44-7.08 14.82-7.09 19.97-17.55 5.16-10.47 5.17-32.54-0.01-30.36-9.32-44.02z"/>
      <path style="fill:#ffffff" d="m631.73 896.36v41.35h31.78v165.22h53.71v-165.23h31.9v-41.34z"/>
      <path fill-rule="evenodd" style="fill:#ffffff" d="m874.48 1102.93h-54.9l-2.17-27.94-0.72-9.19h-19.21l-1.46 16.78-1.77 20.35h-55.53l27.4-206.57h77.63l23.91 160.79zm-59.18-73.75q-4.08-35.08-8.18-86.76-8.22 59.33-10.32 86.76z"/>
      <path fill-rule="evenodd" style="fill:#ffffff" d="m999.32 954.16v17.98q-0.01 19.79-4.09 28.84-4.09 9.05-14.98 13.91-10.92 4.85-28.53 4.85h-14.42v83.19h-53.71v-206.57h54.1q21.94 0 33.75 3.44 11.79 3.45 17.74 9.95 5.92 6.52 8.02 15.76 2.12 9.26 2.12 28.65zm-44.91-5.49q-0.01-10.59-3.33-13.78-3.31-3.18-13.78-3.19v52.57q2.31 0.13 3.97 0.13 7.39 0 10.26-3.64 2.88-3.64 2.88-15.12z"/>
      <path style="fill:#ffffff" d="m1068.47 1059.58v-165.22h-53.72v206.57h86.37v-41.35z"/>
      <path style="fill:#ffffff" d="m1167.85 1061.58v-45.42h33.57v-39.29h-33.57v-39.17h35.86v-41.34h-89.57v206.57l93.14-0.01v-41.34z"/>
      <path fill-rule="evenodd" style="fill:#ffffff" d="m1341.32 1017.89q1.33 5.55 1.34 30.55v54.48h-49.89v-68.64q0.01-16.58-2.63-20.55-2.61-3.94-13.7-3.95v93.14h-53.71v-206.56h38.02q38.01 0 51.48 2.94 13.45 2.94 21.93 14.98 8.5 12.06 8.5 38.48-0.01 24.11-6.01 32.4-6 8.3-23.59 9.95 15.94 3.95 21.43 10.6 5.48 6.62 6.83 12.18zm-48.55-70.25q-0.01-9.82-3.51-12.88-3.51-3.06-12.82-3.06v45.93q9.05 0.01 12.69-2.49 3.64-2.49 3.64-16.13z"/>
      <path fill-rule="evenodd" style="fill:#ffffff" d="m1486.2 981.97v35.34q-0.01 31.13-1.48 44.08-1.46 12.95-9.18 23.68-7.72 10.71-20.86 16.45-13.15 5.74-30.63 5.74-16.58 0.01-29.78-5.43-13.2-5.41-21.25-16.27-8.04-10.82-9.57-23.59-1.54-12.76-1.54-44.66v-35.34q0.01-31.13 1.48-44.08 1.46-12.95 9.18-23.68 7.72-10.71 20.86-16.45 13.15-5.74 30.62-5.74 16.59-0.01 29.79 5.43 13.21 5.41 21.25 16.27 8.05 10.83 9.56 23.59 1.55 12.77 1.55 44.66zm-53.73-32.54q0-14.42-1.59-18.43-1.6-4.02-6.58-4.02-4.2 0-6.44 3.26-2.22 3.25-2.22 19.19v96.45q0 17.99 1.46 22.22 1.47 4.2 6.83 4.2 5.48-0.01 7.02-4.84 1.53-4.85 1.52-23.1z"/>
      <path style="fill:#F39200" d="m867.66 1057.15l6.82 45.78h-54.9l-2.17-27.94z"/>
      <path style="fill:#F39200" d="m883.59 1051.49l53.71-19.07v70.51h-53.71z"/>
      <path style="fill:#F39200" d="m1068.47 1059.58h32.65v41.35h-86.37v-98.01l53.72-19.07z"/>
      <path style="fill:#F39200" d="m1167.85 1061.58h39.43v41.34l-93.14 0.01v-133.29l53.71-19.07v26.3h33.57v39.29h-33.57z"/>
      <path fill-rule="evenodd" style="fill:#F39200" d="m1341.32 1017.89q1.33 5.55 1.34 30.55v54.48h-49.89v-68.64q0.01-16.58-2.63-20.55-2.61-3.94-13.7-3.95v93.14h-53.71v-171.84l89.5-31.78q13.45 2.94 21.93 14.98 8.5 12.06 8.5 38.48-0.01 24.11-6.01 32.4-6 8.3-23.59 9.95 15.94 3.95 21.43 10.6 5.48 6.62 6.83 12.18zm-48.55-70.25q-0.01-9.82-3.51-12.88-3.51-3.06-12.82-3.06v45.93q9.05 0.01 12.69-2.49 3.64-2.49 3.64-16.13z"/>
      <path fill-rule="evenodd" style="fill:#F39200" d="m1486.2 981.97v35.34q-0.01 31.13-1.48 44.08-1.46 12.95-9.18 23.68-7.72 10.71-20.86 16.45-13.15 5.74-30.63 5.74-16.58 0.01-29.78-5.43-13.2-5.41-21.25-16.27-8.04-10.82-9.57-23.59-1.54-12.76-1.54-44.66v-35.34q0.01-31.13 1.48-44.08 1.46-12.95 9.18-23.68 7.72-10.71 20.86-16.45 13.15-5.74 30.62-5.74 16.59-0.01 29.79 5.43 13.21 5.41 21.25 16.27 8.05 10.83 9.56 23.59 1.55 12.77 1.55 44.66zm-53.73-32.54q0-14.42-1.59-18.43-1.6-4.02-6.58-4.02-4.2 0-6.44 3.26-2.22 3.25-2.22 19.19v96.45q0 17.99 1.46 22.22 1.47 4.2 6.83 4.2 5.48-0.01 7.02-4.84 1.53-4.85 1.52-23.1z"/>
    </svg>
    <div class="header-right">
      <div class="header-right-label">Dokument</div>
      <div class="header-right-val">Schulungsbestätigung</div>
    </div>
  </div>

  <div class="body">

    <p class="greeting">Sehr geehrte/r<br>${name},</p>
    <p class="intro">vielen Dank für Ihre Anmeldung. Hiermit bestätigen wir die Reservierung Ihres Platzes für die <strong style="color:#2C2416;font-weight:600;">Gabelstaplerausbildung Stufe&nbsp;1 (Frontstapler)</strong> nach DGUV Grundsatz 308-001 und DGUV Vorschrift 68.</p>

    <div class="rule-section">
      <span class="rule-section-label">Schulungstermine</span>
      <div class="rule-section-line"></div>
    </div>

    <div class="dates-row">
      <div class="date-block">
        <div class="date-accent-dark"></div>
        <div class="date-label">1. Schulungstag</div>
        <div class="date-type">Theorie</div>
        <div class="date-main">${theoryDate}</div>
        <div class="date-time">09:00 – ca. 17:00 Uhr</div>
      </div>
      <div class="date-block">
        <div class="date-accent-orange"></div>
        <div class="date-label">2. Schulungstag</div>
        <div class="date-type">Praxis &amp; Prüfung</div>
        <div class="date-main">${practiceDate}</div>
        <div class="date-time">09:00 – ca. 17:00 Uhr</div>
      </div>
    </div>

    <div class="rule-section">
      <span class="rule-section-label">Schulungsort</span>
      <div class="rule-section-line"></div>
    </div>

    <div style="margin-bottom:44px;">
      <div class="info-row">
        <span class="info-label">Standort</span>
        <span class="info-val">${locationName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Adresse</span>
        <span class="info-val">${locationAddress}</span>
      </div>
    </div>

    <div class="rule-section">
      <span class="rule-section-label">Anreise &amp; Treffpunkt</span>
      <div class="rule-section-line"></div>
    </div>

    <p style="font-size:14px;color:#4A4540;line-height:1.75;margin-bottom:16px;">
      Bitte erscheinen Sie <strong style="color:#2C2416;">10–15 Minuten vor Kursbeginn</strong>. Melden Sie sich an der <strong style="color:#2C2416;">Wache / am Empfang</strong> — ein STAPLERO-Ausbilder holt Sie dort ab und begleitet Sie zum Schulungsraum.
    </p>

    <div class="hint">
      <div class="hint-label">Hinweis</div>
      <div class="hint-text">Bitte betreten Sie das Betriebsgelände nicht selbstständig.</div>
    </div>

    <div style="margin:20px 0 8px;">
      ${steps.map((s, i) => `
      <div class="step">
        <span class="step-num">${i + 1}</span>
        <span class="step-text">${s}</span>
      </div>`).join('')}
    </div>

    ${locationImageUrl
        ? `<div class="photo-box"><img src="${locationImageUrl}" alt="Anfahrt ${locationName}"></div>`
        : ''
    }

    <table class="tel-table">
      <tr>
        <td>
          <div class="tel-label">Telefon 1</div>
          <div class="tel-val">+49 176 22067783</div>
        </td>
        <td>
          <div class="tel-label">Telefon 2</div>
          <div class="tel-val">+49 160 92490070</div>
        </td>
      </tr>
    </table>
    <div class="wa-note">Wir sind auch per WhatsApp erreichbar.</div>

    <div class="rule-section">
      <span class="rule-section-label">Ablauf</span>
      <div class="rule-section-line"></div>
    </div>

    <div class="day-head">
      <div class="day-tag" style="color:#2C2416;">1. Schulungstag</div>
      <div class="day-title">Theorie</div>
      <div class="day-time">09:00 Uhr &nbsp;·&nbsp; Ende ca. 17:00 Uhr</div>
    </div>

    <p style="font-size:13px;color:#6B6560;margin-bottom:12px;">Inhalte gemäß DGUV Grundsatz 308-001 und DGUV Vorschrift 68:</p>
    <ul class="content-list">
      ${theoryItems.map(i => `<li>${i}</li>`).join('')}
    </ul>
    <div class="pruefung-note">Am Ende des Schulungstages: <strong style="color:#2C2416;">schriftliche Theorieprüfung</strong></div>
    <div class="mit-block">
      <div class="mit-label">Bitte mitbringen</div>
      <div class="mit-item">Personalausweis oder Reisepass</div>
      <div class="mit-item">Passbild</div>
      <div class="mit-item">Arbeitssicherheitsschuhe</div>
    </div>

    <div class="day-head" style="margin-top:44px;">
      <div class="day-tag" style="color:#F39200;">2. Schulungstag</div>
      <div class="day-title">Praxis</div>
      <div class="day-time">09:00 Uhr &nbsp;·&nbsp; Ende ca. 17:00 Uhr</div>
    </div>

    <div class="treffpunkt">
      <div class="tp-label">Treffpunkt</div>
      <div class="tp-name">${locationName}</div>
      <div class="tp-addr">${locationAddress}</div>
      <div class="tp-note">Bitte erneut an der Wache melden.</div>
    </div>

    <ul class="content-list">
      ${practiceItems.map(i => `<li>${i}</li>`).join('')}
    </ul>
    <div class="pruefung-note">Zum Abschluss: <strong style="color:#2C2416;">praktische Fahrprüfung</strong></div>
    <div class="mit-block">
      <div class="mit-label">Bitte mitbringen</div>
      <div class="mit-item">Personalausweis oder Reisepass</div>
      <div class="mit-item" style="font-weight:600;color:#2C2416;">Arbeitssicherheitsschuhe — Pflicht</div>
      <div class="mit-item">Geeignete Arbeitskleidung (lange Hosen empfohlen)</div>
      <div class="mit-note">Hallentemperatur ca. 18–22 °C</div>
    </div>

    ${wantsPlasticCard ? `
    <div class="procard">
      <div class="procard-text"><strong>Staplero ProCard</strong> — Ihre Plastikkarte im Scheckkartenformat wird ausgestellt.</div>
    </div>` : ''}

    <div class="storno">
      <div class="storno-title">Stornierungsbedingungen</div>
      <div class="storno-row">
        <span class="storno-key">Kostenfreie Stornierung</span>
        <span class="storno-val">bis 7 Kalendertage vor dem Termin</span>
      </div>
      <div class="storno-row">
        <span class="storno-key">Bei späterer Absage</span>
        <span class="storno-val">100 % Stornogebühr</span>
      </div>
    </div>

    <p style="font-size:14px;color:#6B6560;margin-bottom:6px;">Für Rückfragen stehen wir Ihnen jederzeit zur Verfügung.</p>
    <p style="font-size:14px;color:#6B6560;margin-bottom:6px;">Mit freundlichen Grüßen</p>
    <p style="font-size:15px;font-weight:600;color:#2C2416;">Ihr STAPLERO Team</p>

  </div>

  <div class="footer">
    <svg viewBox="395 785 1197 429" width="80" height="30" xmlns="http://www.w3.org/2000/svg">
      <path style="fill:#C8C4BC" d="m1488.32 1208.9h-989.11c-54.37 0-98.44-44.07-98.44-98.44l-0.01-221.63c0-54.37 44.08-98.44 98.45-98.44l989.11-0.01c54.37 0 98.44 44.08 98.44 98.45l0.01 221.62c0 54.37-44.08 98.45-98.45 98.45z"/>
      <path fill-rule="evenodd" style="fill:#F0EFE9" d="m614.76 1006.08q-9.31-13.65-45.17-34.93-12.52-7.4-15.18-12.63-2.8-5.23-2.8-15.57-0.01-8.05 2.49-12.01 2.49-3.96 7.34-3.95 4.46 0 6.37 2.92 1.92 2.95 1.92 13.66v15.31h49.88v-8.17q0.01-24.62-4.77-34.89-4.81-10.27-19.53-17.03-14.74-6.77-35.66-6.77-19.13 0.01-32.67 6.19-13.52 6.19-19.58 17.16-6.07 10.98-6.07 34.7 0.01 16.47 4.28 27.05 4.27 10.6 10.78 16.6 6.51 5.99 26.54 19.25 20.04 13.14 25.13 18.76 4.99 5.62 4.98 23.86 0 8.29-2.61 12.51-2.62 4.2-7.98 4.2-5.35 0-7.45-3.31-2.12-3.32-2.12-14.94v-25.13h-49.88v13.53q-0.01 23.21 4.73 35.85 4.71 12.63 19.95 20.8 15.25 8.17 36.82 8.17 19.65-0.01 34.44-7.08 14.82-7.09 19.97-17.55 5.16-10.47 5.17-32.54-0.01-30.36-9.32-44.02z"/>
      <path style="fill:#F0EFE9" d="m631.73 896.36v41.35h31.78v165.22h53.71v-165.23h31.9v-41.34z"/>
      <path style="fill:#F39200" d="m867.66 1057.15l6.82 45.78h-54.9l-2.17-27.94z"/>
      <path style="fill:#F39200" d="m883.59 1051.49l53.71-19.07v70.51h-53.71z"/>
    </svg>
    <div class="footer-info">
      Jakobstr. 13 · 02826 Görlitz<br>
      <a href="mailto:info@staplero.com">info@staplero.com</a> · +49 176 22067783<br>
      <a href="${FRONTEND_URL}/datenschutz">Datenschutz</a> · <a href="${FRONTEND_URL}/impressum">Impressum</a>
    </div>
  </div>

</div>
</div>
</body>
</html>
    `;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Anmeldebestätigung – Gabelstaplerausbildung ${theoryDate} / ${practiceDate}`,
        html,
    });
};

export const sendExpiryReminderEmail = async (
    to: string,
    name: string,
    courseName: string,
    expiresAt: Date
): Promise<void> => {
    const expiryDate = new Date(expiresAt).toLocaleDateString("de-DE", {
        year: "numeric", month: "long", day: "numeric",
    });

    const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}
      .container{max-width:600px;margin:0 auto;padding:20px;}
      .header{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;}
      .warning-box{background:#FFF3CD;padding:20px;border-left:4px solid #f39200;margin:20px 0;border-radius:4px;}
      .button{display:inline-block;background:#f39200;color:white;padding:12px 30px;text-decoration:none;border-radius:6px;margin:20px 0;}
      .footer{text-align:center;margin-top:30px;color:#666;font-size:14px;}
    </style></head>
    <body><div class="container">
      <div class="header"><h1>Ihr Kurs läuft bald ab</h1></div>
      <div class="content">
        <h2>Hallo ${name}!</h2>
        <div class="warning-box">
          <p><strong>Wichtige Erinnerung:</strong></p>
          <p>Ihr Zugang zum Kurs <strong>"${courseName}"</strong> läuft am <strong>${expiryDate}</strong> ab.</p>
        </div>
        <a href="${FRONTEND_URL}/dashboard" class="button">Zum Kurs</a>
        <p><strong>Ihr STAPLERO Team</strong></p>
      </div>
      <div class="footer"><p>STAPLERO | info@staplero.com | +49 176 22067783</p></div>
    </div></body></html>`;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Ihr Kurs "${courseName}" läuft in 3 Tagen ab`,
        html,
    });
};

export const sendInvoiceEmail = async (
    to: string,
    name: string,
    orderNumber: string,
    invoiceNumber: string,
    pdfBuffer: Buffer
): Promise<void> => {
    const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}
      .container{max-width:600px;margin:0 auto;padding:20px;}
      .header{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;}
      .info-box{background:white;padding:20px;border-left:4px solid #f39200;margin:20px 0;}
      .footer{text-align:center;margin-top:30px;color:#666;font-size:14px;}
      .highlight{color:#f39200;font-weight:bold;}
    </style></head>
    <body><div class="container">
      <div class="header"><h1>Ihre Rechnung</h1></div>
      <div class="content">
        <h2>Hallo ${name}!</h2>
        <p>Vielen Dank für Ihren Kauf bei STAPLERO.</p>
        <div class="info-box">
          <p><strong>Bestellnummer:</strong> ${orderNumber}</p>
          <p><strong>Rechnungsnummer:</strong> <span class="highlight">${invoiceNumber}</span></p>
          <p><strong>Ausstellungsdatum:</strong> ${new Date().toLocaleDateString("de-DE")}</p>
        </div>
        <p>Im Anhang dieser E-Mail finden Sie Ihre Rechnung als PDF-Dokument.</p>
        <p>Bei Fragen kontaktieren Sie uns bitte unter <strong>info@staplero.com</strong></p>
        <p><strong>Mit freundlichen Grüßen,</strong><br>Ihr STAPLERO Team</p>
      </div>
      <div class="footer"><p>STAPLERO | info@staplero.com | +49 176 22067783</p></div>
    </div></body></html>`;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Ihre Rechnung ${invoiceNumber} - STAPLERO`,
        html,
        attachments: [
            {
                filename: `Rechnung_${invoiceNumber}.pdf`,
                content: pdfBuffer,
            },
        ],
    });
};

export const sendContactFormEmail = async (
    name: string,
    email: string,
    phone: string,
    company: string,
    message: string
): Promise<void> => {
    const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}
      .container{max-width:600px;margin:0 auto;padding:20px;}
      .header{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;}
      .info-box{background:white;padding:15px;margin:10px 0;border-left:4px solid #f39200;}
      .message-box{background:white;padding:20px;margin:20px 0;border-radius:8px;border:1px solid #ddd;}
      .label{font-weight:bold;color:#f39200;}
    </style></head>
    <body><div class="container">
      <div class="header"><h1>Neue Kontaktanfrage</h1></div>
      <div class="content">
        <h2>Sie haben eine neue Nachricht erhalten</h2>
        <div class="info-box"><p><span class="label">Name:</span> ${name}</p></div>
        <div class="info-box"><p><span class="label">E-Mail:</span> <a href="mailto:${email}">${email}</a></p></div>
        ${phone ? `<div class="info-box"><p><span class="label">Telefon:</span> <a href="tel:${phone}">${phone}</a></p></div>` : ''}
        ${company ? `<div class="info-box"><p><span class="label">Firma:</span> ${company}</p></div>` : ''}
        <div class="message-box">
          <p class="label">Nachricht:</p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        <p style="margin-top:30px;padding-top:20px;border-top:1px solid #ddd;">
          <small>Gesendet am ${new Date().toLocaleString('de-DE')}</small>
        </p>
      </div>
    </div></body></html>`;

    await resend.emails.send({
        from: FROM_EMAIL,
        to: 'info@staplero.com',
        replyTo: email,
        subject: `Neue Kontaktanfrage von ${name}`,
        html,
    });

    await sendContactConfirmationEmail(email, name);
};

export const sendContactConfirmationEmail = async (
    to: string,
    name: string
): Promise<void> => {
    const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}
      .container{max-width:600px;margin:0 auto;padding:20px;}
      .header{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:white;padding:30px;text-align:center;border-radius:8px 8px 0 0;}
      .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;}
      .footer{text-align:center;margin-top:30px;color:#666;font-size:14px;}
    </style></head>
    <body><div class="container">
      <div class="header"><h1>Nachricht erhalten</h1></div>
      <div class="content">
        <h2>Hallo ${name}!</h2>
        <p>Vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und werden uns schnellstmöglich bei Ihnen melden.</p>
        <p>In der Regel antworten wir innerhalb von 24 Stunden.</p>
        <p><strong>Mit freundlichen Grüßen,</strong><br>Ihr STAPLERO Team</p>
      </div>
      <div class="footer"><p>STAPLERO | info@staplero.com | +49 176 22067783</p></div>
    </div></body></html>`;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: 'Wir haben Ihre Nachricht erhalten – STAPLERO',
        html,
    });
};

export default {
    sendCertificateEmail,
    sendWelcomeEmail,
    sendOnlineCoursePurchaseEmail,
    sendPracticalCourseBookingEmail,
    sendExpiryReminderEmail,
    sendInvoiceEmail,
    sendContactFormEmail,
    sendContactConfirmationEmail,
};