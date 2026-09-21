import rateLimit from "express-rate-limit";

// Kontaktowy limiter: max 5 wysłanych wiadomości / 15 minut z jednego IP.
export const contactRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: "Zu viele Anfragen über das Kontaktformular. Bitte versuchen Sie es später erneut.",
        retryAfter: "15 Minuten"
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skip: (req) => {
        return process.env.NODE_ENV === "development" &&
            (req.ip === "127.0.0.1" || req.ip === "::1");
    }
});

export const chatRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
        retryAfter: "15 Minuten"
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skip: (req) => {
        return process.env.NODE_ENV === "development" &&
            (req.ip === "127.0.0.1" || req.ip === "::1");
    }
});

// Dodatkowy, luźniejszy limit per-IP dla zgłoszeń "powiadom mnie o terminach"
// (publiczny endpoint, mniej krytyczny niż kontakt, ale też bez ochrony).
export const notifyRequestRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minut
    max: 10,
    message: {
        error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
        retryAfter: "60 Minuten"
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skip: (req) => {
        return process.env.NODE_ENV === "development" &&
            (req.ip === "127.0.0.1" || req.ip === "::1");
    }
});
