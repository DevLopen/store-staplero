import { Request, Response } from "express";
import User from "../models/User";
import { hashPassword } from "../utils/hash";
import { signAuthToken, verifyAuthToken } from "../config/jwt";
import crypto from "crypto";
import emailService from "../services/email.service";
import { normalizeEmail, findUserByEmail } from "../utils/email";

// Jeden komunikat dla nieznanego konta i złego hasła: nie zdradzamy, które adresy są w bazie.
const LOGIN_FAILED = "E-Mail oder Passwort ist falsch.";
// Neutralnie przy rejestracji: wskazuje drogę dalej, bez słowa „existiert”.
const REGISTER_NOT_POSSIBLE = "Registrierung mit dieser E-Mail-Adresse nicht möglich. Wenn Sie bereits ein Konto haben, melden Sie sich an oder setzen Sie Ihr Passwort zurück.";

// Wymagania hasła: spójnie z formularzem rejestracji, checkoutem i resetem hasła
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LANGS = ["de", "en", "uk", "pl"] as const;
type Lang = (typeof LANGS)[number];
const pickLang = (v: unknown): Lang | undefined => (LANGS as readonly string[]).includes(String(v)) ? (v as Lang) : undefined;

/**
 * POST /api/auth/register  { firstName, lastName, email, password, language? }
 * Konto bez zakupu. Vorname i Nachname zawsze osobno (jak w Checkout); `name` = oba razem.
 * Błędy mają `code`, żeby formularz pokazał komunikat w języku strony;
 * `message` (niemiecki) zostaje dla starszych klientów.
 */
const MAX_NAME_PART = 50;
const cleanNamePart = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");

export const register = async (req: Request, res: Response) => {
    const firstName = cleanNamePart(req.body?.firstName);
    const lastName = cleanNamePart(req.body?.lastName);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const email = normalizeEmail(req.body?.email);
    const language = pickLang(req.body?.language);
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ code: "MISSING_FIELDS", message: "Alle Felder sind erforderlich." });
    }
    if (firstName.length > MAX_NAME_PART || lastName.length > MAX_NAME_PART) {
        return res.status(400).json({ code: "NAME_TOO_LONG", message: `Vorname und Nachname dürfen jeweils höchstens ${MAX_NAME_PART} Zeichen lang sein.` });
    }
    const name = `${firstName} ${lastName}`;
    if (email.length > 254 || !EMAIL_RE.test(email)) {
        return res.status(400).json({ code: "INVALID_EMAIL", message: "Bitte geben Sie eine gültige E-Mail-Adresse ein." });
    }
    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
        return res.status(400).json({ code: "PASSWORD_LENGTH", message: `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.` });
    }

    try {
        // bez rozróżniania wielkości liter: INFO@x.de i info@x.de to to samo konto
        const existingUser = await findUserByEmail(email, "_id");
        if (existingUser) return res.status(400).json({ code: "REGISTER_NOT_POSSIBLE", message: REGISTER_NOT_POSSIBLE });

        // Nowe konto nigdy nie dostaje admina; nadaje się go tylko skryptem src/scripts/setAdmin.ts.
        const user = await User.create({ name, firstName, lastName, email, password, isAdmin: false, language });

        // Mail powitalny po odpowiedzi: błąd wysyłki nie blokuje rejestracji
        emailService.sendWelcomeEmail(user.email, user.name, language).catch((err) =>
            console.error("❌ Welcome email (register) failed:", err.message)
        );

        const token = signAuthToken({ id: user._id, isAdmin: user.isAdmin }, "7d");
        res.status(201).json({ user: { name: user.name, email: user.email, isAdmin: user.isAdmin }, token });
    } catch (err: any) {
        // wyścig dwóch rejestracji na ten sam adres: indeks unique
        if (err?.code === 11000) return res.status(400).json({ code: "REGISTER_NOT_POSSIBLE", message: REGISTER_NOT_POSSIBLE });
        console.error("[Auth] Register error:", err);
        res.status(500).json({ code: "SERVER_ERROR", message: "Serverfehler" });
    }
};

export const login = async (req: Request, res: Response) => {
    const { password } = req.body;
    const email = normalizeEmail(req.body?.email);
    if (!email || !password) {
        return res.status(400).json({ code: "MISSING_FIELDS", message: "Alle Felder sind erforderlich." });
    }

    try {
        const user = await findUserByEmail(email);
        if (!user) return res.status(400).json({ code: "LOGIN_FAILED", message: LOGIN_FAILED });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ code: "LOGIN_FAILED", message: LOGIN_FAILED });

        const token = signAuthToken({ id: user._id, isAdmin: user.isAdmin }, "7d");
        res.status(200).json({ user: { name: user.name, email: user.email, isAdmin: user.isAdmin }, token });
    } catch (err) {
        console.error("[Auth] Login error:", err);
        res.status(500).json({ message: "Serverfehler", error: err });
    }
};

export const me = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token fehlt" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token fehlt" });

    try {
        const decoded = verifyAuthToken(token);
        const user = await User.findById(decoded.id || decoded._id).select("-password");
        if (!user) return res.status(404).json({ message: "Benutzer nicht gefunden" });
        res.status(200).json({ user });
    } catch (err) {
        res.status(401).json({ message: "Ungültiger Token", error: err });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { page = "1", limit = "20", search, role } = req.query;
        const pageNum  = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip     = (pageNum - 1) * limitNum;

        const filter: any = {};
        if (role === "admin") filter.isAdmin = true;
        if (role === "user")  filter.isAdmin = { $ne: true };
        if (search) {
            filter.$or = [
                { name:  { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            User.countDocuments(filter),
        ]);

        const usersWithStats = users.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            phone: user.phone,
            address: user.address,
            city: user.city,
            postalCode: user.postalCode,
            createdAt: user.createdAt,
            purchasedCoursesCount: user.purchasedCourses?.length || 0,
            activeCourses: user.purchasedCourses?.filter((c: any) => c.status === "active").length || 0,
        }));

        res.json({
            users: usersWithStats,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};

// ─── Reset hasła ──────────────────────────────────────────────────────────────

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 godzina
const FRONTEND_URL = process.env.FRONTEND_URL || "https://staplero.de";

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

/**
 * POST /api/auth/forgot-password  { email }
 * Zawsze odpowiada tak samo (200), niezależnie od tego, czy konto istnieje, żeby nie ujawniać,
 * które adresy są w bazie. Właściwa praca dzieje się PO wysłaniu odpowiedzi, więc czas
 * odpowiedzi też nie zdradza istnienia konta.
 */
export const forgotPassword = async (req: Request, res: Response) => {
    const email = normalizeEmail(req.body?.email);
    if (!email || email.length > 254) {
        return res.status(400).json({ message: "Bitte geben Sie Ihre E-Mail-Adresse ein." });
    }

    res.status(200).json({
        message: "Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen gesendet.",
    });

    try {
        await requestPasswordReset(email);
    } catch (err) {
        console.error("[Auth] forgotPassword error:", err);
    }
};

/**
 * Link do ustawienia nowego hasła (1 h, jednorazowy). Używane przez „Passwort vergessen”
 * i przez stronę zaproszenia (/einladung/:token), gdy konto już istnieje.
 */
export const requestPasswordReset = async (emailIn: string): Promise<void> => {
    // Wyszukiwanie bez rozróżniania wielkości liter (konta zakładane były z różną wielkością liter)
    const user = await findUserByEmail(emailIn);
    if (!user) return;

    const token = crypto.randomBytes(32).toString("hex");
    await User.updateOne(
        { _id: user._id },
        { $set: { passwordResetTokenHash: sha256(token), passwordResetExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS) } }
    );

    await emailService.sendPasswordResetEmail(user.email, user.name, `${FRONTEND_URL}/reset-password/${token}`);
};

/**
 * GET /api/auth/reset-password/:token
 * Sprawdza, czy link jest ważny (żeby strona mogła od razu pokazać "Link abgelaufen").
 */
export const validateResetToken = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({
            passwordResetTokenHash: sha256(String(req.params.token || "")),
            passwordResetExpires: { $gt: new Date() },
        }).select("_id");
        if (!user) return res.status(400).json({ valid: false, message: "Der Link ist ungültig oder abgelaufen." });
        res.status(200).json({ valid: true });
    } catch (err) {
        res.status(500).json({ valid: false, message: "Serverfehler" });
    }
};

/**
 * POST /api/auth/reset-password  { token, password }
 * Token jest jednorazowy: po użyciu (lub po zmianie hasła) znika z bazy.
 */
export const resetPassword = async (req: Request, res: Response) => {
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!token) return res.status(400).json({ message: "Der Link ist ungültig oder abgelaufen." });
    if (password.length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ message: `Das Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen lang sein.` });
    }
    if (password.length > 200) {
        return res.status(400).json({ message: "Das Passwort ist zu lang." });
    }

    try {
        const user = await User.findOne({
            passwordResetTokenHash: sha256(token),
            passwordResetExpires: { $gt: new Date() },
        }).select("+passwordResetTokenHash +passwordResetExpires");

        if (!user) return res.status(400).json({ message: "Der Link ist ungültig oder abgelaufen." });

        user.password = password; // hook pre("save") w modelu zahaszuje hasło
        user.passwordResetTokenHash = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Ihr Passwort wurde geändert. Sie können sich jetzt anmelden." });

        emailService.sendPasswordChangedEmail(user.email, user.name).catch((err) =>
            console.error("[Auth] sendPasswordChangedEmail error:", err)
        );
    } catch (err) {
        console.error("[Auth] resetPassword error:", err);
        res.status(500).json({ message: "Serverfehler" });
    }
};
