import { Request, Response } from "express";
import User from "../models/User";
import { hashPassword } from "../utils/hash";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import emailService from "../services/email.service";

const ADMIN_EMAILS = ["info@staplero.com", "k.lopuch@satisfly.co"];
const JWT_SECRET = process.env.JWT_SECRET || "secret";

export const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Alle Felder sind erforderlich." });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Benutzer existiert bereits." });

        const isAdmin = ADMIN_EMAILS.includes(email.trim().toLowerCase());
        const user = await User.create({ name, email, password, isAdmin });

        const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ user: { name: user.name, email: user.email, isAdmin: user.isAdmin }, token });
    } catch (err) {
        res.status(500).json({ message: "Serverfehler", error: err });
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Alle Felder sind erforderlich." });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Benutzer nicht gefunden." });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: "Falsches Passwort." });

        // If this email is on admin list, ensure isAdmin=true in DB using updateOne (avoids pre-save hooks)
        const shouldBeAdmin = ADMIN_EMAILS.includes(user.email.trim().toLowerCase());
        if (shouldBeAdmin && !user.isAdmin) {
            await User.updateOne({ _id: user._id }, { $set: { isAdmin: true } });
            user.isAdmin = true;
            console.log(`[Auth] Promoted ${user.email} to admin`);
        }

        const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: "7d" });
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
        const decoded: any = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
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
const MIN_PASSWORD_LENGTH = 6; // spójnie z formularzem w checkoucie
const FRONTEND_URL = process.env.FRONTEND_URL || "https://staplero.com";

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * POST /api/auth/forgot-password  { email }
 * Zawsze odpowiada tak samo (200), niezależnie od tego, czy konto istnieje, żeby nie ujawniać,
 * które adresy są w bazie. Właściwa praca dzieje się PO wysłaniu odpowiedzi, więc czas
 * odpowiedzi też nie zdradza istnienia konta.
 */
export const forgotPassword = async (req: Request, res: Response) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    if (!email || email.length > 254) {
        return res.status(400).json({ message: "Bitte geben Sie Ihre E-Mail-Adresse ein." });
    }

    res.status(200).json({
        message: "Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen gesendet.",
    });

    try {
        // Wyszukiwanie bez rozróżniania wielkości liter (konta zakładane były z różną wielkością liter)
        const user = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, "i") });
        if (!user) return;

        const token = crypto.randomBytes(32).toString("hex");
        await User.updateOne(
            { _id: user._id },
            { $set: { passwordResetTokenHash: sha256(token), passwordResetExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS) } }
        );

        await emailService.sendPasswordResetEmail(user.email, user.name, `${FRONTEND_URL}/reset-password/${token}`);
    } catch (err) {
        console.error("[Auth] forgotPassword error:", err);
    }
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
