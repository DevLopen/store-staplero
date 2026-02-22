import { Request, Response } from "express";
import User from "../models/User";
import { hashPassword } from "../utils/hash";
import jwt from "jsonwebtoken";

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
        const users = await User.find().select("-password").sort({ createdAt: -1 });
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
            activeCourses: user.purchasedCourses?.filter(c => c.status === "active").length || 0,
        }));
        res.json({ users: usersWithStats });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
};