import rateLimit from "express-rate-limit";

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