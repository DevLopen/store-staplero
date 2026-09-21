import { Request, Response } from "express";
import practicalCourseService from "../services/practicalCourse.service";
import Location from "../models/Location";
import Certificate from "../models/Certificate";
import PracticalCourseParticipant from "../models/PracticalCourseParticipant";
import { generateCertificatePDF } from "./certificateController";
import { sendCertificateEmail, sendPracticalCourseBookingEmail } from "../services/email.service";
import multer from "multer";
import path from "path";
import fs from "fs";
import { AuthRequest } from "../types";
import User from "../models/User";
import { resolveName } from "../utils/name";

// ─── existing controllers (keep as-is) ────────────────────────────────────────

export const getAllParticipants = async (req: Request, res: Response) => {
    try {
        const { locationId, dateId, startDate, status } = req.query;
        const filters: any = {};
        if (locationId) filters.locationId = locationId as string;
        if (dateId) filters.dateId = dateId as string;
        if (startDate) filters.startDate = startDate as string;
        if (status) filters.status = status as string;
        const participants = await practicalCourseService.getAllParticipants(filters);
        res.json({ success: true, count: participants.length, participants });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Failed to get participants", error: error.message });
    }
};

export const getParticipantsByLocation = async (req: Request, res: Response) => {
    try {
        const { locationId } = req.params;
        const participants = await practicalCourseService.getParticipantsByLocation(locationId);
        res.json({ success: true, count: participants.length, locationId, participants });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Failed to get participants", error: error.message });
    }
};

export const getParticipantsByDate = async (req: Request, res: Response) => {
    try {
        const { locationId, dateId } = req.params;
        const participants = await practicalCourseService.getParticipantsByDate(locationId, dateId);
        const count = await practicalCourseService.getParticipantsCount(locationId, dateId);
        res.json({ success: true, count, locationId, dateId, participants });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Failed to get participants", error: error.message });
    }
};

export const getLocationsWithParticipants = async (req: Request, res: Response) => {
    try {
        const locations = await Location.find({ isActive: true });
        const locationsWithCounts = await Promise.all(
            locations.map(async (location) => {
                const datesWithCounts = await Promise.all(
                    location.dates.map(async (date) => {
                        const participantsCount = await practicalCourseService.getParticipantsCount(
                            location._id.toString(),
                            date.id
                        );
                        return {
                            id: date.id,
                            startDate: date.startDate,
                            endDate: date.endDate,
                            time: date.time,
                            availableSpots: date.availableSpots,
                            participantsCount,
                            totalSpots: date.availableSpots + participantsCount,
                        };
                    })
                );
                return {
                    _id: location._id,
                    city: location.city,
                    address: location.address,
                    price: location.price,
                    dates: datesWithCounts,
                };
            })
        );
        res.json({ success: true, locations: locationsWithCounts });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Failed to get locations", error: error.message });
    }
};

export const cancelParticipant = async (req: Request, res: Response) => {
    try {
        const { orderNumber } = req.params;
        await practicalCourseService.cancelParticipant(orderNumber);
        res.json({ success: true, message: "Participant cancelled successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Failed to cancel participant", error: error.message });
    }
};

export const getParticipantsStats = async (req: Request, res: Response) => {
    try {
        const allParticipants = await practicalCourseService.getAllParticipants();
        const confirmed = allParticipants.filter(p => p.status === "confirmed").length;
        const cancelled = allParticipants.filter(p => p.status === "cancelled").length;
        const completed = allParticipants.filter(p => p.status === "completed").length;
        const byLocation: any = {};
        allParticipants.forEach(p => {
            if (p.status !== "cancelled") {
                if (!byLocation[p.locationName]) byLocation[p.locationName] = 0;
                byLocation[p.locationName]++;
            }
        });
        res.json({ success: true, stats: { total: allParticipants.length, confirmed, cancelled, completed, byLocation } });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Failed to get stats", error: error.message });
    }
};

// ─── NEW: Complete participant + issue certificate ────────────────────────────
//  POST /api/admin/practical-courses/participants/:orderNumber/complete

export const completeParticipant = async (req: AuthRequest, res: Response) => {
    try {
        const { orderNumber } = req.params;
        const { instructorName, stufen } = req.body;

        // 1. Find participant
        const participant = await practicalCourseService.getParticipantByOrderNumber(orderNumber);
        if (!participant) {
            return res.status(404).json({ success: false, message: "Teilnehmer nicht gefunden" });
        }
        if (participant.status === "completed") {
            // already completed — just return existing cert
            const existingCert = await Certificate.findOne({
                participantId: participant._id.toString(),
                type: "practical",
            }).lean();
            return res.json({ success: true, alreadyCompleted: true, certificate: existingCert });
        }
        if (participant.status === "cancelled") {
            return res.status(400).json({ success: false, message: "Stornierter Teilnehmer kann nicht abgeschlossen werden" });
        }

        // 2. Mark as completed
        await practicalCourseService.completeParticipant(orderNumber);

        // 3. Issue certificate
        const cert = await Certificate.create({
            userId: participant.userId,
            participantId: participant._id.toString(),
            type: "practical",
            userName: participant.userName,
            userEmail: participant.userEmail,
            courseName: "Gabelstapler-Fahrausweis (Praxiskurs)",
            trainingDate: new Date(participant.startDate),
            trainingLocation: `${participant.locationName} – ${participant.locationAddress}`,
            instructorName: instructorName || undefined,
            stufen: (stufen && stufen.length) ? stufen : ["stufe1"],
            photoFile: (participant as any).photoFile || undefined,
        });

        // 4. Generate PDF buffer for email attachment
        const pdfBuffer = await generateCertificatePDF(cert.toObject());

        // 5. Send certificate email to participant
        await sendCertificateEmail({
            to: participant.userEmail,
            userName: participant.userName,
            certId: (cert._id as any).toString(),
            verificationCode: cert.verificationCode,
            certType: "practical",
            trainingDate: new Date(participant.startDate),
            trainingLocation: `${participant.locationName} – ${participant.locationAddress}`,
            pdfBuffer,
            instructorName: instructorName,
        });

        res.json({
            success: true,
            message: "Teilnehmer abgeschlossen. Zertifikat ausgestellt und per E-Mail versendet.",
            certificate: cert.toObject(),
        });
    } catch (error: any) {
        console.error("Complete participant error:", error);
        res.status(500).json({ success: false, message: "Fehler beim Abschließen", error: error.message });
    }
};

// ─── NEW: Resend certificate email ────────────────────────────────────────────
//  POST /api/admin/practical-courses/participants/:orderNumber/resend-certificate

export const resendCertificateEmail = async (req: AuthRequest, res: Response) => {
    try {
        const { orderNumber } = req.params;

        const participant = await practicalCourseService.getParticipantByOrderNumber(orderNumber);
        if (!participant) {
            return res.status(404).json({ success: false, message: "Teilnehmer nicht gefunden" });
        }

        const cert = await Certificate.findOne({
            participantId: participant._id.toString(),
            type: "practical",
        }).lean();

        if (!cert) {
            return res.status(404).json({ success: false, message: "Kein Zertifikat gefunden. Bitte zuerst abschließen." });
        }

        const pdfBuffer = await generateCertificatePDF(cert);

        await sendCertificateEmail({
            to: participant.userEmail,
            userName: participant.userName,
            certId: (cert._id as any).toString(),
            verificationCode: cert.verificationCode,
            certType: "practical",
            trainingDate: new Date(participant.startDate),
            trainingLocation: `${participant.locationName} – ${participant.locationAddress}`,
            pdfBuffer,
        });

        res.json({ success: true, message: "Zertifikats-E-Mail erneut gesendet." });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Fehler beim Senden", error: error.message });
    }
};


// ── ADMIN: Archive all participants paginated + search ───────────────────────
export const getAllParticipantsPaginated = async (req: Request, res: Response) => {
    try {
        const { page = "1", limit = "20", search, status } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const filter: any = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { userName:    { $regex: search, $options: "i" } },
                { firstName:   { $regex: search, $options: "i" } },
                { lastName:    { $regex: search, $options: "i" } },
                { userEmail:   { $regex: search, $options: "i" } },
                { orderNumber: { $regex: search, $options: "i" } },
            ];
        }
        const [participants, total] = await Promise.all([
            PracticalCourseParticipant.find(filter).sort({ createdAt: -1 })
                .skip(skip).limit(parseInt(limit as string)).lean(),
            PracticalCourseParticipant.countDocuments(filter),
        ]);
        res.json({ success: true, participants, total, page: parseInt(page as string),
            totalPages: Math.ceil(total / parseInt(limit as string)) });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── ADMIN: Manually add participant + optionally issue certificate ────────────
// Dwa tryby:
//  1) Z terminu w kalendarzu (locationId + dateId) — kursant trafia na listę tego terminu
//     w danym mieście i zajmuje miejsce (availableSpots - 1).
//  2) Wpis archiwalny (bez locationId/dateId) — dawny tryb: wolny tekst miasta + data,
//     bez wpływu na kalendarz.
export const addManualParticipant = async (req: AuthRequest, res: Response) => {
    try {
        const { userPhone, instructorName, stufen, notes, issueNow, locationId, dateId, force, sendConfirmation } = req.body;
        const userEmail = (req.body.userEmail || "").trim().toLowerCase();
        const nameParts = resolveName({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            name: req.body.userName,
        });
        const userName = nameParts.name;

        if (!userName || !userEmail)
            return res.status(400).json({ message: "Vorname, Nachname und E-Mail sind Pflicht." });

        let locationName: string = req.body.locationName?.trim() || "Manuell erfasst";
        let locationAddress: string = req.body.locationName?.trim() || "";
        let startDate: string = req.body.startDate;
        let endDate: string = req.body.startDate;
        let time = "–";
        let resolvedLocationId = "manual";
        let resolvedDateId = "manual";
        let spotsLocation: any = null;
        let overbooked = false;

        if (locationId || dateId) {
            // Tryb 1: termin z kalendarza
            if (!locationId || !dateId)
                return res.status(400).json({ message: "Standort und Termin müssen gemeinsam angegeben werden." });

            const location = await Location.findById(locationId);
            if (!location) return res.status(404).json({ message: "Standort nicht gefunden." });

            const idx = practicalCourseService.findDateIndex(location, dateId);
            if (idx === -1) return res.status(404).json({ message: "Termin nicht gefunden." });

            const date = location.dates[idx];
            if (date.availableSpots <= 0 && !force) {
                return res.status(409).json({
                    code: "NO_SPOTS",
                    message: "Für diesen Termin sind keine Plätze mehr frei.",
                });
            }

            const duplicate = await PracticalCourseParticipant.findOne({
                locationId: location._id.toString(),
                startDate: date.startDate,
                userEmail,
                userName,
                status: { $ne: "cancelled" },
            });
            if (duplicate) {
                return res.status(409).json({
                    code: "DUPLICATE",
                    message: `${userName} ist für diesen Termin bereits eingetragen.`,
                });
            }

            locationName = location.city;
            locationAddress = location.address;
            startDate = date.startDate;
            endDate = date.endDate;
            time = date.time;
            resolvedLocationId = location._id.toString();
            resolvedDateId = date.id;
            spotsLocation = { locationId: resolvedLocationId, dateId: date.id };
            overbooked = date.availableSpots <= 0;
        } else if (!startDate) {
            return res.status(400).json({ message: "Kursdatum ist Pflicht." });
        }

        // Jeśli kursant ma konto w sklepie — podepnij wpis pod jego konto
        const existingUser = await User.findOne({ email: userEmail });
        const orderNumber = `MANUAL-${Date.now()}`;

        const participant = await PracticalCourseParticipant.create({
            userId: existingUser?._id?.toString() || "manual",
            userName,
            firstName: nameParts.firstName,
            lastName: nameParts.lastName,
            userEmail,
            userPhone: userPhone?.trim(),
            seatIndex: 0,
            orderId: orderNumber, orderNumber,
            paidAt: new Date(),
            locationId: resolvedLocationId,
            locationName,
            locationAddress,
            dateId: resolvedDateId, startDate, endDate, time,
            status: issueNow ? "completed" : "confirmed",
            isManual: true,
            overbooked,
            notes: notes?.trim() || undefined,
        });

        // Zapis ponad limit nie zajmuje miejsca (liczba miejsc już wynosi 0)
        if (spotsLocation && !overbooked) {
            await practicalCourseService.decreaseAvailableSpots(spotsLocation.locationId, spotsLocation.dateId, 1);
        }

        // Rezerwacja telefoniczna: opcjonalny mail z potwierdzeniem (ten sam co po zakupie w sklepie)
        let confirmationSent: boolean | undefined;
        if (sendConfirmation && spotsLocation) {
            try {
                const theory = new Date(startDate);
                const practice = new Date(theory);
                practice.setDate(practice.getDate() + 1);
                const fmt = (d: Date) => d.toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                await sendPracticalCourseBookingEmail(
                    userEmail, userName, orderNumber, locationName, locationAddress,
                    fmt(theory), fmt(practice), "https://staplero.de/Hinweis.jpeg", [userName]
                );
                confirmationSent = true;
            } catch (mailErr: any) {
                console.error("[Manual participant] Bestätigungs-E-Mail fehlgeschlagen:", mailErr.message);
                confirmationSent = false;
            }
        }

        if (issueNow) {
            const cert = await Certificate.create({
                userId: participant.userId,
                participantId: (participant._id as any).toString(),
                type: "practical",
                userName,
                userEmail,
                courseName: "Gabelstapler-Fahrausweis (Praxiskurs)",
                trainingDate: new Date(startDate),
                trainingLocation: locationName,
                instructorName: instructorName?.trim(),
                stufen: stufen?.length ? stufen : ["stufe1"],
            });
            const pdfBuffer = await generateCertificatePDF(cert.toObject());
            await sendCertificateEmail({
                to: userEmail,
                userName,
                certId: (cert._id as any).toString(),
                verificationCode: cert.verificationCode,
                certType: "practical",
                trainingDate: new Date(startDate),
                pdfBuffer,
            });
        }
        res.json({ success: true, participant, confirmationSent });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── ADMIN: Edycja kursanta + zdjęcie (używane na certyfikacie) ────────────────

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
const PHOTO_SUBDIR = "participants";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Rozpoznaje JPEG/PNG po nagłówku pliku (nie ufamy nazwie ani typowi z przeglądarki) */
const detectImageExt = (buf: Buffer): "jpg" | "png" | null => {
    if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
    if (buf.length > 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
    return null;
};

const removePhotoFile = (photoFile?: string) => {
    if (!photoFile) return;
    const full = path.resolve(UPLOADS_DIR, photoFile);
    if (full.startsWith(path.resolve(UPLOADS_DIR) + path.sep) && fs.existsSync(full)) {
        try { fs.unlinkSync(full); } catch { /* plik mógł zniknąć, nie blokujemy */ }
    }
};

const photoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
}).single("photo");

/** Middleware multer z czytelnym komunikatem błędu (JSON) */
export const participantPhotoUpload = (req: Request, res: Response, next: any) => {
    photoUpload(req, res, (err: any) => {
        if (!err) return next();
        const tooBig = err.code === "LIMIT_FILE_SIZE";
        res.status(400).json({ success: false, message: tooBig ? "Das Foto ist zu groß (max. 5 MB)." : "Upload fehlgeschlagen." });
    });
};

// PUT /api/admin/practical-courses/participants/:id
export const updateParticipant = async (req: AuthRequest, res: Response) => {
    try {
        const participant = await practicalCourseService.findParticipantByRef(req.params.id);
        if (!participant) return res.status(404).json({ success: false, message: "Teilnehmer nicht gefunden" });

        const { firstName, lastName, userEmail, userPhone, notes } = req.body;
        const name = resolveName({ firstName, lastName, name: req.body.userName });
        if (!name.firstName || !name.lastName) {
            return res.status(400).json({ success: false, message: "Vorname und Nachname sind Pflicht." });
        }
        const email = String(userEmail || "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Ungültige E-Mail-Adresse." });
        }

        participant.userName = name.name;
        participant.firstName = name.firstName;
        participant.lastName = name.lastName;
        participant.userEmail = email;
        participant.userPhone = userPhone ? String(userPhone).trim() : undefined;
        participant.notes = notes ? String(notes).trim() : undefined;
        await participant.save();

        res.json({ success: true, participant });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/admin/practical-courses/participants/:id/photo  (multipart, pole "photo")
export const uploadParticipantPhoto = async (req: AuthRequest, res: Response) => {
    try {
        const participant = await practicalCourseService.findParticipantByRef(req.params.id);
        if (!participant) return res.status(404).json({ success: false, message: "Teilnehmer nicht gefunden" });

        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) return res.status(400).json({ success: false, message: "Kein Foto ausgewählt." });

        const ext = detectImageExt(file.buffer);
        if (!ext) return res.status(400).json({ success: false, message: "Nur JPG- und PNG-Dateien sind erlaubt." });

        const dir = path.join(UPLOADS_DIR, PHOTO_SUBDIR);
        fs.mkdirSync(dir, { recursive: true });
        const filename = `${participant._id}-${Date.now()}.${ext}`;
        fs.writeFileSync(path.join(dir, filename), file.buffer);

        // Poprzednie zdjęcie usuwamy dopiero po udanym zapisie nowego
        const previous = participant.photoFile;
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        participant.photoFile = `${PHOTO_SUBDIR}/${filename}`;
        participant.photoUrl = `${protocol}://${req.get("host")}/uploads/${PHOTO_SUBDIR}/${filename}`;
        await participant.save();
        removePhotoFile(previous);

        // Już wystawione certyfikaty tego kursanta dostają nowe zdjęcie (przy ponownym wysłaniu / pobraniu PDF)
        await Certificate.updateMany({ participantId: participant._id.toString() }, { $set: { photoFile: participant.photoFile } });

        res.json({ success: true, participant });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/admin/practical-courses/participants/:id/photo
export const deleteParticipantPhoto = async (req: AuthRequest, res: Response) => {
    try {
        const participant = await practicalCourseService.findParticipantByRef(req.params.id);
        if (!participant) return res.status(404).json({ success: false, message: "Teilnehmer nicht gefunden" });

        removePhotoFile(participant.photoFile);
        participant.photoFile = undefined;
        participant.photoUrl = undefined;
        await participant.save();
        await Certificate.updateMany({ participantId: participant._id.toString() }, { $unset: { photoFile: "" } });

        res.json({ success: true, participant });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export default {
    getAllParticipants,
    getAllParticipantsPaginated,
    addManualParticipant,
    getParticipantsByLocation,
    getParticipantsByDate,
    getLocationsWithParticipants,
    cancelParticipant,
    completeParticipant,
    resendCertificateEmail,
    getParticipantsStats,
    updateParticipant,
    uploadParticipantPhoto,
    deleteParticipantPhoto,
};