import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || "STAPLERO <noreply@staplero.com>";

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