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

/**
 * Send certificate email with PDF attachment + wallet buttons
 */
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
    .btn-outline { display: block; background: #ffffff; color: #0f172a !important; text-decoration: none; padding: 13px 24px; border-radius: 10px; font-weight: 600; font-size: 14px; text-align: center; border: 2px solid #e2e8f0; margin-bottom: 12px; }
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
    <div class="cert-badge">🏆 Zertifikat ausgestellt</div>
  </div>
 
  <div class="body">
    <div class="greeting">Herzlichen Glückwunsch, ${userName}!</div>
    <div class="intro">
      Sie haben Ihre Ausbildung zum Gabelstaplerfahrer erfolgreich abgeschlossen.<br>
      Im Anhang dieser E-Mail finden Sie Ihren <strong>Staplerschein als PDF</strong>.
      Sie können ihn auch jederzeit in Ihrem Dashboard herunterladen oder zu Ihrem digitalen Wallet hinzufügen.
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
 
    <div class="actions-title">📲 Zertifikat speichern</div>
    <a href="${downloadUrl}" class="btn-primary">📄 PDF im Dashboard öffnen</a>
    <a href="${appleWalletUrl}" class="btn-apple">🍎 Zu Apple Wallet hinzufügen</a>
    <a href="${googleWalletUrl}/redirect" class="btn-google">🤖 Zu Google Wallet hinzufügen</a>
 
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
      Ihr Arbeitgeber ist gemäß DGUV Vorschrift 1 verpflichtet, mindestens einmal jährlich
      eine Unterweisung durchzuführen. STAPLERO bietet hierfür auch
      <strong>jährliche Unterweisungen</strong> an – sprechen Sie uns gerne an.
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
        subject: `🏆 Ihr Staplerschein ist ausgestellt – STAPLERO (${verificationCode})`,
        html,
        attachments: [
            {
                filename: `Staplerschein-${verificationCode}.pdf`,
                content: pdfBuffer,
            },
        ],
    });
};

// Also add a Google Wallet redirect helper (called from email button)
// This endpoint handles the redirect after user clicks Google Wallet in email
// Add to certificateRoutes: GET /api/certificates/:certId/wallet/google/redirect
// It fetches the Google JWT and redirects to pay.google.com
export const handleGoogleWalletRedirect = async (req: any, res: any) => {
    // This is called from email link (no auth token available in email context)
    // So we use verificationCode as param instead
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

/**
 * Send welcome email after registration
 */
export const sendWelcomeEmail = async (
    to: string,
    name: string
): Promise<void> => {
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Willkommen bei STAPLERO!</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name}!</h2>
            <p>Vielen Dank für Ihre Registrierung bei STAPLERO – Ihrem Partner für professionelle Staplerausbildung.</p>
            <p>Sie können sich jetzt einloggen und mit Ihrem Kurs beginnen:</p>
            <a href="${process.env.FRONTEND_URL}/login" class="button">Zum Login</a>
            <p>Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.</p>
            <p>Viel Erfolg bei Ihrer Ausbildung!</p>
            <p><strong>Ihr STAPLERO Team</strong></p>
          </div>
          <div class="footer">
            <p>STAPLERO | info@staplero.com | +49 176 22067783</p>
          </div>
        </div>
      </body>
    </html>
  `;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: "Willkommen bei STAPLERO!",
        html,
    });
};

/**
 * Send online course purchase confirmation
 */
export const sendOnlineCoursePurchaseEmail = async (
    to: string,
    name: string,
    courseName: string,
    orderNumber: string,
    expiresAt: Date
): Promise<void> => {
    const expiryDate = new Date(expiresAt).toLocaleDateString("de-DE", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-left: 4px solid #FF6B35; margin: 20px 0; }
          .button { display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { color: #FF6B35; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Zahlung erfolgreich!</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name}!</h2>
            <p>Vielen Dank für Ihren Kauf! Sie haben nun Zugang zu:</p>
            
            <div class="info-box">
              <h3>📚 ${courseName}</h3>
              <p><strong>Bestellnummer:</strong> ${orderNumber}</p>
              <p><strong>Zugang gültig bis:</strong> <span class="highlight">${expiryDate}</span></p>
            </div>

            <p>Sie können sofort mit dem Kurs beginnen:</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Zum Kurs</a>

            <p><strong>Wichtig:</strong> Ihr Zugang ist für 30 Tage gültig. Nach Ablauf dieser Frist wird der Kurs automatisch gesperrt.</p>
            
            <p>Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.</p>
            <p><strong>Viel Erfolg!</strong><br>Ihr STAPLERO Team</p>
          </div>
          <div class="footer">
            <p>STAPLERO | info@staplero.com | +49 176 22067783</p>
          </div>
        </div>
      </body>
    </html>
  `;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Ihr Online-Kurs: ${courseName} - Zugang freigeschaltet!`,
        html,
    });
};

/**
 * Send practical course booking confirmation
 */
export const sendPracticalCourseBookingEmail = async (
    to: string,
    name: string,
    orderNumber: string,
    locationName: string,
    locationAddress: string,
    date: string,
    time: string,
    wantsPlasticCard: boolean
): Promise<void> => {

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-left: 4px solid #FF6B35; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { color: #FF6B35; font-weight: bold; }
          .checklist { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .checklist li { margin: 10px 0; }
          .warning-box { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px; }
          .info-section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Zahlungsbestätigung & Anmeldung</h1>
          </div>
          <div class="content">
            <p>Sehr geehrte/r ${name},</p>
            <p>hiermit bestätigen wir den Zahlungseingang sowie Ihre verbindliche Anmeldung zur Gabelstaplerschulung in Berlin.</p>
            
            <div class="info-box">
              <h3>📍 Schulungstermin</h3>
              <p><strong>Bestellnummer:</strong> ${orderNumber}</p>
              <p><strong>Datum:</strong> <span class="highlight">${date}</span></p>
              <p><strong>Uhrzeit:</strong> <span class="highlight">jeweils von ${time} bis ca. 17:00 Uhr</span></p>
              <p><strong>Adresse:</strong> ${locationAddress}</p>
              <p style="margin-top: 10px; font-size: 14px; color: #666;">
                <em>Zufahrt über den Hof neben dem Loui-Motorradteile-Shop</em>
              </p>
            </div>

            <div class="checklist">
              <h3>📋 Bitte bringen Sie Folgendes mit:</h3>
              <ul>
                <li><strong>Am Theorietag:</strong> Personalausweis oder Reisepass sowie ein Passbild</li>
                <li><strong>Am Praxistag:</strong> Sicherheitsschuhe (Arbeitsschuhe mit Stahlkappe)</li>
              </ul>
            </div>

            <div class="info-section">
              <h3>📜 Schulungsinformationen</h3>
              <p>Die Schulung erfolgt gemäß den deutschen Vorschriften <strong>DGUV Vorschrift 68</strong> und <strong>DGUV Grundsatz 308-001</strong>.</p>
              <p>Nach erfolgreich bestandener Theorie- und Praxisprüfung erhalten Sie den offiziellen deutschen Staplerschein.</p>
              ${wantsPlasticCard ? '<p><strong>Plastikkarte:</strong> ✅ Wird ausgestellt</p>' : ''}
            </div>

            <div class="warning-box">
              <h3>⚠️ Stornierungsbedingungen</h3>
              <p><strong>Kostenfreie Stornierung:</strong> bis spätestens 7 Kalendertage vor dem Schulungstermin möglich.</p>
              <p><strong>Bei späterer Absage:</strong> wird eine Stornogebühr in Höhe von 100 % des Schulungspreises fällig.</p>
            </div>

            <p>Für Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.</p>
            <p><strong>Mit freundlichen Grüßen<br>Ihr Staplero Team</strong></p>
          </div>
          <div class="footer">
            <p><strong>STAPLERO</strong></p>
            <p>info@staplero.com<br>+49 176 22067783 | +49 160 92490070</p>
          </div>
        </div>
      </body>
    </html>
  `;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Zahlungsbestätigung – Gabelstaplerschulung am ${date}`,
        html,
    });
};

/**
 * Send course expiry reminder (3 days before)
 */
export const sendExpiryReminderEmail = async (
    to: string,
    name: string,
    courseName: string,
    expiresAt: Date
): Promise<void> => {
    const expiryDate = new Date(expiresAt).toLocaleDateString("de-DE", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .warning-box { background: #FFF3CD; padding: 20px; border-left: 4px solid #FF6B35; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Ihr Kurs läuft bald ab</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name}!</h2>
            
            <div class="warning-box">
              <p><strong>⚠️ Wichtige Erinnerung:</strong></p>
              <p>Ihr Zugang zum Kurs <strong>"${courseName}"</strong> läuft am <strong>${expiryDate}</strong> ab.</p>
            </div>

            <p>Nutzen Sie die verbleibende Zeit, um Ihren Kurs abzuschließen und Ihr Zertifikat zu erhalten!</p>
            
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Zum Kurs</a>

            <p>Falls Sie Ihren Zugang verlängern möchten, kontaktieren Sie uns bitte.</p>
            <p><strong>Ihr STAPLERO Team</strong></p>
          </div>
          <div class="footer">
            <p>STAPLERO | info@staplero.com | +49 176 22067783</p>
          </div>
        </div>
      </body>
    </html>
  `;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `⏰ Ihr Kurs "${courseName}" läuft in 3 Tagen ab`,
        html,
    });
};

/**
 * Wyślij fakturę do klienta jako załącznik
 */
export const sendInvoiceEmail = async (
    to: string,
    name: string,
    orderNumber: string,
    invoiceNumber: string,
    pdfBuffer: Buffer
): Promise<void> => {
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-left: 4px solid #FF6B35; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { color: #FF6B35; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧾 Ihre Rechnung</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name}!</h2>
            <p>Vielen Dank für Ihren Kauf bei STAPLERO.</p>
            
            <div class="info-box">
              <p><strong>Bestellnummer:</strong> ${orderNumber}</p>
              <p><strong>Rechnungsnummer:</strong> <span class="highlight">${invoiceNumber}</span></p>
              <p><strong>Ausstellungsdatum:</strong> ${new Date().toLocaleDateString("de-DE")}</p>
            </div>

            <p>Im Anhang dieser E-Mail finden Sie Ihre Rechnung als PDF-Dokument.</p>
            
            <p>Die Rechnung wurde automatisch erstellt und ist rechtsgültig.</p>
            
            <p>Bei Fragen kontaktieren Sie uns bitte unter <strong>info@staplero.com</strong></p>
            <p><strong>Mit freundlichen Grüßen,</strong><br>Ihr STAPLERO Team</p>
          </div>
          <div class="footer">
            <p>STAPLERO | info@staplero.com | +49 176 22067783</p>
          </div>
        </div>
      </body>
    </html>
  `;

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

/**
 * Send contact form email
 */
export const sendContactFormEmail = async (
    name: string,
    email: string,
    phone: string,
    company: string,
    message: string
): Promise<void> => {
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #FF6B35; }
          .message-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .label { font-weight: bold; color: #FF6B35; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Neue Kontaktanfrage</h1>
          </div>
          <div class="content">
            <h2>Sie haben eine neue Nachricht erhalten</h2>
            
            <div class="info-box">
              <p><span class="label">Name:</span> ${name}</p>
            </div>
            
            <div class="info-box">
              <p><span class="label">E-Mail:</span> <a href="mailto:${email}">${email}</a></p>
            </div>
            
            ${phone ? `
            <div class="info-box">
              <p><span class="label">Telefon:</span> <a href="tel:${phone}">${phone}</a></p>
            </div>
            ` : ''}
            
            ${company ? `
            <div class="info-box">
              <p><span class="label">Firma:</span> ${company}</p>
            </div>
            ` : ''}
            
            <div class="message-box">
              <p class="label">Nachricht:</p>
              <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <small>Diese Nachricht wurde über das Kontaktformular auf staplero.de gesendet am ${new Date().toLocaleString('de-DE')}</small>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

    // Wysyłka do firmy (info@staplero.de)
    await resend.emails.send({
        from: FROM_EMAIL,
        to: 'info@staplero.com', // Twój email firmowy
        replyTo: email, // Odpowiedź będzie szła do klienta
        subject: `Neue Kontaktanfrage von ${name}`,
        html,
    });

    // Opcjonalnie: Wysyłka potwierdzenia do klienta
    await sendContactConfirmationEmail(email, name);
};

/**
 * Send confirmation email to customer (optional)
 */
export const sendContactConfirmationEmail = async (
    to: string,
    name: string
): Promise<void> => {
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Nachricht erhalten</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name}!</h2>
            <p>Vielen Dank für Ihre Nachricht. Wir haben Ihre Anfrage erhalten und werden uns schnellstmöglich bei Ihnen melden.</p>
            <p>In der Regel antworten wir innerhalb von 24 Stunden.</p>
            <p><strong>Mit freundlichen Grüßen,</strong><br>Ihr STAPLERO Team</p>
          </div>
          <div class="footer">
            <p>STAPLERO | info@staplero.com | +49 176 22067783</p>
          </div>
        </div>
      </body>
    </html>
  `;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: 'Wir haben Ihre Nachricht erhalten - STAPLERO',
        html,
    });
};

export default {
    sendWelcomeEmail,
    sendOnlineCoursePurchaseEmail,
    sendPracticalCourseBookingEmail,
    sendExpiryReminderEmail,
    sendInvoiceEmail,
    sendContactFormEmail,
    sendContactConfirmationEmail,
};