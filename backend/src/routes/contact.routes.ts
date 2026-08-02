import express from 'express';
import { sendContactFormEmail } from '../services/email.service';
import { contactRateLimiter } from '../middleware/rateLimiter';
import { isLikelySpam, isValidEmail } from '../utils/spamFilter';
import { verifyRecaptcha } from '../services/recaptcha.service';

const router = express.Router();

// Minimalny czas (ms) jaki musi upłynąć między załadowaniem formularza
// a wysłaniem go. Boty zwykle wypełniają i wysyłają formularz w ułamku
// sekundy, prawdziwy człowiek potrzebuje co najmniej kilku sekund.
const MIN_SUBMIT_TIME_MS = 3000;
// Jeśli formRenderedAt jest starsze niż to - nie blokujemy na podstawie
// czasu (np. ktoś trzymał kartę otwartą bardzo długo).
const MAX_FORM_AGE_MS = 60 * 60 * 1000;

router.post('/contact', contactRateLimiter, async (req, res) => {
    try {
        const { name, email, phone, company, message, recaptchaToken } = req.body;

        // ── Google reCAPTCHA v3 ──────────────────────────────────────────
        const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'contact', req.ip);
        if (!recaptchaResult.success) {
            console.warn('[contact] reCAPTCHA rejected submission', {
                ip: req.ip,
                reason: recaptchaResult.reason,
                score: recaptchaResult.score,
            });
            // Udajemy sukces, żeby bot nie wiedział, że został wykryty.
            return res.status(200).json({ success: true, message: 'Nachricht erfolgreich gesendet' });
        }

        // ── Honeypot ──────────────────────────────────────────────────────
        // Niewidoczne dla ludzi pole formularza. Boty zwykle wypełniają
        // każde pole, więc jeśli to pole ma jakąkolwiek wartość, traktujemy
        // zgłoszenie jako spam. Odpowiadamy sukcesem (żeby bot nie wiedział,
        // że został wykryty), ale NIE wysyłamy e-maila.
        if (typeof req.body.website === 'string' && req.body.website.trim() !== '') {
            console.warn('[contact] Honeypot triggered, ignoring submission', { ip: req.ip });
            return res.status(200).json({ success: true, message: 'Nachricht erfolgreich gesendet' });
        }

        // ── Walidacja ─────────────────────────────────────────────────────
        if (!name || !email || !message) {
            return res.status(400).json({
                error: 'Name, Email und Nachricht sind erforderlich'
            });
        }

        if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
            return res.status(400).json({ error: 'Ungültige Daten' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
        }

        if (name.length > 150 || message.length > 5000 || message.length < 2) {
            return res.status(400).json({ error: 'Ungültige Eingabelänge' });
        }

        // ── Sprawdzenie czasu wypełniania formularza ─────────────────────
        const formRenderedAt = Number(req.body.formRenderedAt);
        if (formRenderedAt && Number.isFinite(formRenderedAt)) {
            const elapsed = Date.now() - formRenderedAt;
            if (elapsed >= 0 && elapsed < MAX_FORM_AGE_MS && elapsed < MIN_SUBMIT_TIME_MS) {
                console.warn('[contact] Submitted too fast, likely a bot', { ip: req.ip, elapsed });
                return res.status(200).json({ success: true, message: 'Nachricht erfolgreich gesendet' });
            }
        }

        // ── Filtr treści (losowe ciągi znaków, nadmiar linków, itd.) ─────
        if (isLikelySpam({ name, email, message })) {
            console.warn('[contact] Content flagged as spam, ignoring submission', { ip: req.ip });
            return res.status(200).json({ success: true, message: 'Nachricht erfolgreich gesendet' });
        }

        // Wysyłka emaila
        await sendContactFormEmail(name, email, phone || '', company || '', message);

        res.status(200).json({
            success: true,
            message: 'Nachricht erfolgreich gesendet'
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            error: 'Fehler beim Senden der Nachricht'
        });
    }
});

export default router;
