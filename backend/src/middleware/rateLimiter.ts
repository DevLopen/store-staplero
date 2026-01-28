import rateLimit from "express-rate-limit";

export const chatRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minut
    max: 20, // maksymalnie 20 wiadomości na 15 minut
    message: {
        error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut.",
        retryAfter: "15 Minuten"
    },
    standardHeaders: true, // Zwraca info o limicie w headerach
    legacyHeaders: false,
    // IP-based rate limiting
    keyGenerator: (req) => {
        return req.ip || req.socket.remoteAddress || "unknown";
    },
    // Skip dla localhost w development
    skip: (req) => {
        return process.env.NODE_ENV === "development" &&
            (req.ip === "127.0.0.1" || req.ip === "::1");
    }
});

