import { Request, Response } from "express";
import User from "../models/User";
import { hashPassword, comparePassword } from "../utils/hash";
import jwt from "jsonwebtoken";

export const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Alle Felder sind erforderlich." });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Benutzer existiert bereits." });

        const hashedPassword = await hashPassword(password);
        const adminEmails = ["info@staplero.com", "k.lopuch@satislfy.co"]; // demo admin
        const isAdmin = adminEmails.includes(email.toLowerCase());
        const user = await User.create({ name, email, password: hashedPassword, isAdmin });

        const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

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

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Falsches Passwort." });

        const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });

        res.status(200).json({ user: { name: user.name, email: user.email, isAdmin: user.isAdmin }, token });
    } catch (err) {
        res.status(500).json({ message: "Serverfehler", error: err });
    }
};

export const me = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Token fehlt" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token fehlt" });

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return res.status(404).json({ message: "Benutzer nicht gefunden" });

        res.status(200).json({ user });
    } catch (err) {
        res.status(401).json({ message: "Ungültiger Token", error: err });
    }
};

