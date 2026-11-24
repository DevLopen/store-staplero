import jwt from "jsonwebtoken";

/**
 * Jedno źródło sekretu JWT dla całego backendu (logowanie, rejestracja, checkout, middleware).
 * Zapas "secret" zostaje tylko po to, żeby tokeny wydane wcześniej bez ustawionego JWT_SECRET
 * nadal działały; na produkcji JWT_SECRET musi być ustawiony.
 */
const FALLBACK = "secret";
// Czytane przy każdym użyciu, a nie przy imporcie: nie zależy od tego, kiedy dotenv wczyta .env.
const secret = (): string => process.env.JWT_SECRET || FALLBACK;

let warned = false;
const warnIfMissing = () => {
    if (warned || process.env.JWT_SECRET) return;
    warned = true;
    console.error(
        `⚠️  JWT_SECRET nie jest ustawiony${process.env.NODE_ENV === "production" ? " NA PRODUKCJI" : ""}: ` +
        "tokeny są podpisywane jawnym zapasowym sekretem. Ustaw JWT_SECRET w .env."
    );
};

export type AuthTokenPayload = { id?: string; _id?: string; [k: string]: unknown };

export const signAuthToken = (payload: object, expiresIn: jwt.SignOptions["expiresIn"] = "7d") =>
    (warnIfMissing(), jwt.sign(payload, secret(), { expiresIn }));

/** Rzuca wyjątek przy złym lub wygasłym tokenie, tak jak jwt.verify. */
export const verifyAuthToken = (token: string) => (warnIfMissing(), jwt.verify(token, secret()) as AuthTokenPayload);
