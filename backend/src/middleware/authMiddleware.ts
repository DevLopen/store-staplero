import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import { verifyAuthToken } from "../config/jwt";

interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = verifyAuthToken(token);

            // Tokeny z checkoutu sprzed 24.09 miały tylko `_id` (ważne 30 dni) — akceptujemy oba formaty
            const user = await User.findById(decoded.id || decoded._id).select("-password");
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            // Uprawnienia admina wyłącznie z flagi isAdmin w bazie (nigdy z adresu e-mail ani z treści tokenu).
            req.user = user;
            next();
        } catch (err) {
            console.error("[Auth] Token verification failed:", err);
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};

/** Wymaga wcześniej `protect`: req.user to świeży dokument z bazy, więc liczy się tylko flaga isAdmin w DB. */
export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.isAdmin === true) {
        next();
    } else {
        res.status(403).json({ message: "Admin access only" });
    }
};
