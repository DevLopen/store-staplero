import { Request, Response } from "express";
import practicalCourseService from "../services/practicalCourse.service";
import Location from "../models/Location";
import Certificate from "../models/Certificate";
import PracticalCourseParticipant from "../models/PracticalCourseParticipant";
import { generateCertificatePDF } from "./certificateController";
import { sendCertificateEmail } from "../services/email.service";
import { AuthRequest } from "../types";

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
        const withPlasticCard = allParticipants.filter(p => p.wantsPlasticCard && p.status === "confirmed").length;
        const byLocation: any = {};
        allParticipants.forEach(p => {
            if (p.status !== "cancelled") {
                if (!byLocation[p.locationName]) byLocation[p.locationName] = 0;
                byLocation[p.locationName]++;
            }
        });
        res.json({ success: true, stats: { total: allParticipants.length, confirmed, cancelled, completed, withPlasticCard, byLocation } });
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
export const addManualParticipant = async (req: AuthRequest, res: Response) => {
    try {
        const { userName, userEmail, userPhone, locationName, startDate,
            instructorName, stufen, notes, issueNow } = req.body;
        if (!userName || !userEmail || !startDate)
            return res.status(400).json({ message: "userName, userEmail, startDate sind Pflicht." });

        const orderNumber = `MANUAL-${Date.now()}`;
        const participant = await PracticalCourseParticipant.create({
            userId: "manual", userName: userName.trim(),
            userEmail: userEmail.trim().toLowerCase(),
            userPhone: userPhone?.trim(),
            orderId: orderNumber, orderNumber,
            paidAt: new Date(),
            locationId: "manual",
            locationName: locationName?.trim() || "Manuell erfasst",
            locationAddress: locationName?.trim() || "",
            dateId: "manual", startDate, endDate: startDate, time: "–",
            wantsPlasticCard: false,
            status: issueNow ? "completed" : "confirmed",
        });

        if (issueNow) {
            const cert = await Certificate.create({
                userId: "manual",
                participantId: (participant._id as any).toString(),
                type: "practical",
                userName: userName.trim(),
                userEmail: userEmail.trim().toLowerCase(),
                courseName: "Gabelstapler-Fahrausweis (Praxiskurs)",
                trainingDate: new Date(startDate),
                trainingLocation: locationName?.trim(),
                instructorName: instructorName?.trim(),
                stufen: stufen?.length ? stufen : ["stufe1"],
            });
            const pdfBuffer = await generateCertificatePDF(cert.toObject());
            await sendCertificateEmail({
                to: userEmail.trim().toLowerCase(),
                userName: userName.trim(),
                certId: (cert._id as any).toString(),
                verificationCode: cert.verificationCode,
                certType: "practical",
                trainingDate: new Date(startDate),
                pdfBuffer,
            });
        }
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
};