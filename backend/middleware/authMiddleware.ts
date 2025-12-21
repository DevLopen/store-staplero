import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

interface AuthRequest extends Request {
    user?: any;
}

// Middleware do sprawdzenia tokenu i ustawienia req.user
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
            req.user = await User.findById(decoded.id).select("-password");
            next();
        } catch (err) {
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};

// Middleware do sprawdzenia, czy user jest adminem
export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: "Admin access only" });
    }
};
