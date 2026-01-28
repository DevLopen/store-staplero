import express from 'express';
import { sendContactFormEmail } from '../services/email.service';

const router = express.Router();

router.post('/contact', async (req, res) => {
    try {
        const { name, email, phone, company, message } = req.body;

        // Walidacja
        if (!name || !email || !message) {
            return res.status(400).json({
                error: 'Name, Email und Nachricht sind erforderlich'
            });
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