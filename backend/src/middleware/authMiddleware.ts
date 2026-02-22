import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const ADMIN_EMAILS = ["info@staplero.com", "k.lopuch@satisfly.co"];
const JWT_SECRET = process.env.JWT_SECRET || "secret";

interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded: any = jwt.verify(token, JWT_SECRET);

            const user = await User.findById(decoded.id).select("-password");
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            // Napraw isAdmin jesli email jest na liscie adminow
            if (ADMIN_EMAILS.includes(user.email.trim().toLowerCase()) && !user.isAdmin) {
                user.isAdmin = true;
                await user.save();
            }

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

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
    const userEmail = req.user?.email?.trim().toLowerCase() || "";
    const isAdmin = req.user?.isAdmin === true || ADMIN_EMAILS.includes(userEmail);

    if (req.user && isAdmin) {
        next();
    } else {
        res.status(403).json({ message: "Admin access only" });
    }
};