import { Request, Response } from "express";
import User from "../models/User";
import { signAuthToken, verifyAuthToken } from "../config/jwt";
import emailService from "../services/email.service";
import { findUserByEmail } from "../utils/email";
import { requestPasswordReset } from "./authController";
import {
    SeatError, claimInvitation, findInvitation, isSeatLanguage, publicInvitation,
} from "../services/seatInvite.service";
import { orderLanguage } from "../services/orderSeat.service";

/**
 * Strona zaproszenia /einladung/:token (publiczna, z limitami).
 * Pełny e-mail osoby nie wychodzi do przeglądarki: rejestracja i logowanie z tej strony
 * biorą adres z miejsca (OrderSeat), nie z formularza.
 */

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_PART = 50;
const cleanNamePart = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");
const REDIRECT = "/dashboard#kurse";

/** Zalogowany użytkownik z nagłówka (opcjonalnie) */
const optionalUser = async (req: Request) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return null;
    try {
        const decoded = verifyAuthToken(header.split(" ")[1]);
        const id = decoded.id || decoded._id;
        return id ? await User.findById(id).select("-password") : null;
    } catch {
        return null;
    }
};

const sendError = (res: Response, err: any, where: string) => {
    if (err instanceof SeatError) return res.status(err.status).json({ code: err.code });
    console.error(`[Invitation] ${where}:`, err);
    return res.status(500).json({ code: "SERVER_ERROR" });
};

const session = (user: any) => ({
    token: signAuthToken({ id: user._id, isAdmin: user.isAdmin }, "7d"),
    user: { name: user.name, email: user.email, isAdmin: user.isAdmin },
});

/** GET /api/invitations/:token */
export const getInvitation = async (req: Request, res: Response) => {
    try {
        const look = await findInvitation(req.params.token);
        const viewer = await optionalUser(req);
        res.json(await publicInvitation(look, viewer));
    } catch (err) {
        sendError(res, err, "get");
    }
};

/** POST /api/invitations/:token/register  { firstName, lastName, password, language? } — nowe konto na e-mail z zaproszenia */
export const registerFromInvitation = async (req: Request, res: Response) => {
    const firstName = cleanNamePart(req.body?.firstName);
    const lastName = cleanNamePart(req.body?.lastName);
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!firstName || !lastName || !password) return res.status(400).json({ code: "MISSING_FIELDS" });
    if (firstName.length > MAX_NAME_PART || lastName.length > MAX_NAME_PART) return res.status(400).json({ code: "NAME_TOO_LONG" });
    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) return res.status(400).json({ code: "PASSWORD_LENGTH" });
    try {
        const look = await findInvitation(req.params.token);
        if (look.state !== "valid") return res.status(410).json({ code: look.state === "expired" ? "EXPIRED" : look.state === "used" ? "USED" : "INVALID" });
        const email = look.seat.email as string;
        if (await findUserByEmail(email, "_id")) return res.status(409).json({ code: "ACCOUNT_EXISTS" });
        const language = isSeatLanguage(req.body?.language) ? req.body.language : orderLanguage(look.order);
        let user;
        try {
            user = await User.create({ name: `${firstName} ${lastName}`, firstName, lastName, email, password, isAdmin: false, language });
        } catch (err: any) {
            if (err?.code === 11000) return res.status(409).json({ code: "ACCOUNT_EXISTS" });
            throw err;
        }
        emailService.sendWelcomeEmail(user.email, user.name, language).catch((err) =>
            console.error("❌ Welcome email (invitation) failed:", err.message)
        );
        // Konto jest już założone; gdyby zajęcie się nie udało, osoba może zalogować się i spróbować jeszcze raz
        await claimInvitation(req.params.token, user);
        res.status(201).json({ ...session(user), redirect: REDIRECT });
    } catch (err) {
        sendError(res, err, "register");
    }
};

/** POST /api/invitations/:token/login  { password } — logowanie na e-mail z zaproszenia i zajęcie miejsca */
export const loginFromInvitation = async (req: Request, res: Response) => {
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!password) return res.status(400).json({ code: "MISSING_FIELDS" });
    try {
        const look = await findInvitation(req.params.token);
        if (look.state !== "valid") return res.status(410).json({ code: look.state === "expired" ? "EXPIRED" : look.state === "used" ? "USED" : "INVALID" });
        const user = await findUserByEmail(look.seat.email);
        if (!user || !(await user.comparePassword(password))) return res.status(400).json({ code: "LOGIN_FAILED" });
        await claimInvitation(req.params.token, user);
        res.json({ ...session(user), redirect: REDIRECT });
    } catch (err) {
        sendError(res, err, "login");
    }
};

/** POST /api/invitations/:token/forgot — link „Passwort vergessen” na e-mail z zaproszenia */
export const forgotFromInvitation = async (req: Request, res: Response) => {
    try {
        const look = await findInvitation(req.params.token);
        if (look.state !== "valid") return res.status(410).json({ code: look.state === "expired" ? "EXPIRED" : "INVALID" });
        res.json({ ok: true });
        requestPasswordReset(look.seat.email as string).catch((err) => console.error("[Invitation] forgot:", err));
    } catch (err) {
        sendError(res, err, "forgot");
    }
};

/** POST /api/invitations/:token/claim — zalogowany użytkownik z tym samym e-mailem zajmuje miejsce */
export const claimFromInvitation = async (req: Request, res: Response) => {
    try {
        const { already } = await claimInvitation(req.params.token, (req as any).user);
        res.json({ ok: true, already: !!already, redirect: REDIRECT });
    } catch (err) {
        sendError(res, err, "claim");
    }
};
