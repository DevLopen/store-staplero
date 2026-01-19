import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || "STAPLERO <noreply@staplero.de>";

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
            <p>STAPLERO GmbH | info@staplero.de | +49 (0) 123 456 789</p>
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
            <p>STAPLERO GmbH | info@staplero.de | +49 (0) 123 456 789</p>
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
    const formattedDate = new Date(date).toLocaleDateString("de-DE", {
        weekday: "long",
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
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { color: #FF6B35; font-weight: bold; }
          .checklist { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .checklist li { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Anmeldung bestätigt!</h1>
          </div>
          <div class="content">
            <h2>Hallo ${name}!</h2>
            <p>Ihre Anmeldung zum praktischen Staplerführerschein-Kurs wurde erfolgreich bestätigt.</p>
            
            <div class="info-box">
              <h3>📍 Kursdetails</h3>
              <p><strong>Bestellnummer:</strong> ${orderNumber}</p>
              <p><strong>Standort:</strong> ${locationName}</p>
              <p><strong>Adresse:</strong> ${locationAddress}</p>
              <p><strong>Datum:</strong> <span class="highlight">${formattedDate}</span></p>
              <p><strong>Uhrzeit:</strong> <span class="highlight">${time}</span></p>
              ${wantsPlasticCard ? '<p><strong>Plastikkarte:</strong> ✅ Ja</p>' : ''}
            </div>

            <div class="checklist">
              <h3>✅ Was Sie mitbringen müssen:</h3>
              <ul>
                <li>Gültiger Personalausweis oder Reisepass</li>
                <li>Bequeme Kleidung und festes Schuhwerk</li>
                <li>Ausreichend Verpflegung für den Tag</li>
                <li>Gute Laune und Lernbereitschaft 😊</li>
              </ul>
            </div>

            <p><strong>Wichtig:</strong> Bitte erscheinen Sie pünktlich 15 Minuten vor Kursbeginn.</p>
            
            <p>Bei Fragen oder wenn Sie den Termin ändern möchten, kontaktieren Sie uns bitte rechtzeitig.</p>
            <p><strong>Wir freuen uns auf Sie!</strong><br>Ihr STAPLERO Team</p>
          </div>
          <div class="footer">
            <p>STAPLERO GmbH | info@staplero.de | +49 (0) 123 456 789</p>
          </div>
        </div>
      </body>
    </html>
  `;

    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Ihr Staplerführerschein-Kurs am ${formattedDate}`,
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
            <p>STAPLERO GmbH | info@staplero.de | +49 (0) 123 456 789</p>
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

export default {
    sendWelcomeEmail,
    sendOnlineCoursePurchaseEmail,
    sendPracticalCourseBookingEmail,
    sendExpiryReminderEmail,
};