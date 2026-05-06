import { Response } from "express";
import Certificate from "../models/Certificate";
import { AuthRequest } from "../types";

const ADMIN_EMAILS = ["info@staplero.com", "k.lopuch@satisfly.co"];

/**
 * POST /api/certificates/admin/seed-demo
 * Creates a demo certificate for the admin user so they can preview the UI.
 * Only callable by admin email accounts.
 * Safe to call multiple times — returns existing if already created.
 */
export const seedDemoCertificate = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: "Nicht autorisiert" });

        const userEmail = String(user.email || "").trim().toLowerCase();
        const isAdmin = ADMIN_EMAILS.includes(userEmail) || user.isAdmin === true;
        if (!isAdmin) return res.status(403).json({ message: "Nur für Admins" });

        // Check if demo cert already exists
        const existing = await Certificate.findOne({
            userId: user._id,
            verificationCode: "DEMO000ADMIN",
        }).lean();

        if (existing) {
            return res.json({ success: true, alreadyExists: true, certificate: existing });
        }

        // Create demo practical cert
        const practicalCert = await Certificate.create({
            userId: user._id,
            participantId: "demo-participant-001",
            type: "practical",
            userName: user.name || "Bohdan Kutko",
            userEmail: user.email,
            courseName: "Gabelstapler-Fahrausweis (Praxiskurs)",
            trainingDate: new Date("2025-03-15"),
            trainingLocation: "Görlitz – Jakobstr. 13, 02826 Görlitz",
            instructorName: "Bohdan Kutko",
            issuedAt: new Date("2025-03-15"),
            verificationCode: "DEMO000ADMIN",
        });

        // Create demo online cert
        const onlineCert = await Certificate.create({
            userId: user._id,
            courseId: "demo-course-001",
            type: "online",
            userName: user.name || "Bohdan Kutko",
            userEmail: user.email,
            courseName: "Theoriekurs Gabelstapler DGUV V68",
            trainingDate: new Date("2025-03-10"),
            score: 94,
            issuedAt: new Date("2025-03-10"),
        });

        res.json({
            success: true,
            message: "Demo-Zertifikate erstellt. Öffne jetzt das Dashboard → Zertifikate.",
            certificates: [practicalCert.toObject(), onlineCert.toObject()],
        });
    } catch (err: any) {
        res.status(500).json({ message: "Fehler", error: err.message });
    }
};

/**
 * DELETE /api/certificates/admin/seed-demo
 * Removes all demo certificates (cleanup).
 */
export const deleteDemoCertificates = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: "Nicht autorisiert" });

        const userEmail = String(user.email || "").trim().toLowerCase();
        const isAdmin = ADMIN_EMAILS.includes(userEmail) || user.isAdmin === true;
        if (!isAdmin) return res.status(403).json({ message: "Nur für Admins" });

        await Certificate.deleteMany({
            userId: user._id,
            $or: [
                { verificationCode: "DEMO000ADMIN" },
                { courseId: "demo-course-001" },
                { participantId: "demo-participant-001" },
            ],
        });

        res.json({ success: true, message: "Demo-Zertifikate gelöscht." });
    } catch (err: any) {
        res.status(500).json({ message: "Fehler", error: err.message });
    }
};