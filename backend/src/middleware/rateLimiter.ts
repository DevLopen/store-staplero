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


// Reset hasła: max 5 próśb o link / godzinę z jednego IP (ochrona przed spamowaniem skrzynek).
export const forgotPasswordRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        message: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
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

// Ustawianie nowego hasła: max 10 prób / godzinę z jednego IP (ochrona przed zgadywaniem tokenów).
export const resetPasswordRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        message: "Zu viele Versuche. Bitte versuchen Sie es später erneut.",
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

// Logowanie i rejestracja: lokalnie (adres pętli zwrotnej, NODE_ENV inny niż production) limit jest
// wyłączony, żeby nie blokować testów; RATE_LIMIT_LOCAL=1 włącza go także lokalnie (do sprawdzenia 429).
const isLoopback = (ip?: string) => ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
const skipLocalAuth = (req: { ip?: string }) =>
    process.env.NODE_ENV !== "production" && process.env.RATE_LIMIT_LOCAL !== "1" && isLoopback(req.ip);

// Logowanie: max 10 nieudanych prób / 15 minut z jednego IP (udane logowania się nie liczą,
// więc kilka osób z jednej firmy za wspólnym IP nie blokuje się nawzajem).
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    message: {
        code: "RATE_LIMITED",
        message: "Zu viele Anmeldeversuche. Bitte versuchen Sie es in 15 Minuten erneut.",
        retryAfter: "15 Minuten"
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skip: skipLocalAuth,
});

// Rejestracja: max 5 kont / godzinę z jednego IP.
export const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        code: "RATE_LIMITED",
        message: "Zu viele Registrierungen. Bitte versuchen Sie es später erneut.",
        retryAfter: "60 Minuten"
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skip: skipLocalAuth,
});

// Strona zaproszenia /einladung/:token: odczyt max 60 / 15 min z jednego IP (ochrona przed zgadywaniem tokenów).
export const invitationInfoRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: { code: "RATE_LIMITED", message: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skip: skipLocalAuth,
});

// Zaproszenie: rejestracja / logowanie / zajęcie miejsca / „Passwort vergessen” — max 20 / 15 min z jednego IP.
export const invitationActionRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { code: "RATE_LIMITED", message: "Zu viele Versuche. Bitte versuchen Sie es später erneut." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skip: skipLocalAuth,
});

// Panel kupującego: zmiany miejsc (e-mail, wysyłka, cofnięcie) — max 40 / 15 min z jednego IP.
// Limity wysyłek na miejsce (5 / 24 h) i na zamówienie (20 / 24 h) pilnuje seatInvite.service.
export const seatActionRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    message: { code: "RATE_LIMITED", message: "Zu viele Änderungen. Bitte versuchen Sie es später erneut." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skip: skipLocalAuth,
});
