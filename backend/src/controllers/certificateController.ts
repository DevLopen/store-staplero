import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import Certificate from "../models/Certificate";
import Course from "../models/Course";
import QuizResult from "../models/QuizResult";
import PracticalCourseParticipant from "../models/PracticalCourseParticipant";
import { AuthRequest } from "../types";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";
const GOOGLE_SERVICE_ACCOUNT = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT
    ? JSON.parse(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT)
    : null;
const GOOGLE_ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID || "";
const GOOGLE_CLASS_ID = `${GOOGLE_ISSUER_ID}.staplero_certificate`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("de-DE", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatDateShort(date: Date): string {
    return new Date(date).toLocaleDateString("de-DE");
}

// ─── GET Certificate data (or create for online course) ───────────────────────

export const getCertificate = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { courseId } = req.params;
        if (!userId) return res.status(401).json({ message: "Nicht autorisiert" });

        // Check existing
        const existing = await Certificate.findOne({ userId, courseId, type: "online" }).lean();
        if (existing) return res.json(existing);

        // Verify final quiz passed
        const finalResult = await QuizResult.findOne({
            userId,
            courseId,
            isFinalQuiz: true,
            passed: true,
        });
        if (!finalResult)
            return res.status(403).json({ message: "Abschlussprüfung nicht bestanden" });

        const course = await Course.findById(courseId).lean();
        if (!course) return res.status(404).json({ message: "Kurs nicht gefunden" });
        if (!course.certificateEnabled)
            return res.status(403).json({ message: "Zertifikat für diesen Kurs nicht verfügbar" });

        const user = req.user!;
        const cert = await Certificate.create({
            userId,
            courseId,
            type: "online",
            userName: user.name,
            userEmail: user.email,
            courseName: course.title,
            trainingDate: finalResult.completedAt || new Date(),
            score: finalResult.score,
        });

        res.json(cert.toObject());
    } catch (err) {
        res.status(500).json({ message: "Serverfehler", error: err });
    }
};

// ─── GET Practical Certificate for logged-in user ─────────────────────────────

export const getPracticalCertificate = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { participantId } = req.params;
        if (!userId) return res.status(401).json({ message: "Nicht autorisiert" });

        const cert = await Certificate.findOne({ userId, participantId, type: "practical" }).lean();
        if (!cert) return res.status(404).json({ message: "Zertifikat nicht gefunden" });

        res.json(cert);
    } catch (err) {
        res.status(500).json({ message: "Serverfehler", error: err });
    }
};

// ─── GET All certificates for current user ────────────────────────────────────

export const getMyCertificates = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ message: "Nicht autorisiert" });

        const certs = await Certificate.find({ userId, revokedAt: { $exists: false } })
            .sort({ issuedAt: -1 })
            .lean();

        res.json(certs);
    } catch (err) {
        res.status(500).json({ message: "Serverfehler", error: err });
    }
};

// ─── DOWNLOAD PDF ─────────────────────────────────────────────────────────────

export const downloadCertificate = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { certId } = req.params;
        if (!userId) return res.status(401).json({ message: "Nicht autorisiert" });

        const cert = await Certificate.findOne({ _id: certId, userId }).lean();
        if (!cert) return res.status(404).json({ message: "Zertifikat nicht gefunden" });
        if (cert.revokedAt) return res.status(410).json({ message: "Zertifikat widerrufen" });

        const pdfBuffer = await generateCertificatePDF(cert);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Staplerschein-${cert.verificationCode}.pdf"`
        );
        res.send(pdfBuffer);
    } catch (err) {
        res.status(500).json({ message: "Serverfehler", error: err });
    }
};

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────

export async function generateCertificatePDF(cert: any): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        try {
            const verifyUrl = `${FRONTEND_URL}/verify/${cert.verificationCode}`;

            const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
                margin: 1, width: 220,
                color: { dark: "#1e3a5f", light: "#ffffff" },
                errorCorrectionLevel: "M",
            });
            const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

            const _fs   = require("fs");
            const _path = require("path");
            const logoPath = _path.join(__dirname, "../assets/staplero_logo.jpeg");
            const logoBuffer: Buffer | null = _fs.existsSync(logoPath) ? _fs.readFileSync(logoPath) : null;

            const doc = new PDFDocument({
                size: "A4",
                layout: "landscape",
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
            });

            const chunks: Buffer[] = [];
            doc.on("data", (c: Buffer) => chunks.push(c));
            doc.on("end",  () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            const W  = doc.page.width;   // 841.89
            const H  = doc.page.height;  // 595.28
            const CX = W / 2;

            const navy   = "#1e3a5f";
            const isPractical = cert.type === "practical";
            const accent = isPractical ? "#f59e0b" : "#2563eb";   // amber vs blue
            const accentD= isPractical ? "#d97706" : "#1d4ed8";   // darker shade
            const orange = accent;   // keep existing refs working
            const dark   = "#1f2937";
            const mid    = "#4b5563";
            const muted  = "#9ca3af";
            const cream  = isPractical ? "#FAFAF7" : "#F0F6FF";   // warm vs cool bg

            // ── Background ────────────────────────────────────────────────────
            doc.rect(0, 0, W, H).fill(cream);

            // ── Outer border ──────────────────────────────────────────────────
            const bm = 20;
            doc.rect(bm, bm, W - bm*2, H - bm*2)
                .lineWidth(2.5).strokeColor(navy).stroke();
            doc.rect(bm+5, bm+5, W - (bm+5)*2, H - (bm+5)*2)
                .lineWidth(0.6).strokeColor(orange).stroke();

            // ── Corner diamonds ───────────────────────────────────────────────
            [[bm+24, bm+24],[W-bm-24, bm+24],[bm+24, H-bm-24],[W-bm-24, H-bm-24]].forEach(([cx,cy]) => {
                doc.save().translate(cx,cy).rotate(45)
                    .rect(-4,-4,8,8).fill(orange).restore();
                doc.circle(cx,cy,11).lineWidth(0.6).strokeColor(orange).stroke();
            });

            // ═════════════════════════════════════════════════════════════════
            // TOP: Logo + org
            // ═════════════════════════════════════════════════════════════════
            let y = bm + 20;

            if (logoBuffer) {
                const lW = 130, lH = 52;
                doc.image(logoBuffer, CX - lW/2, y, { width: lW, height: lH, fit: [lW, lH], align:"center" });
                y += lH + 10;
            } else {
                doc.fontSize(22).fillColor(navy).font("Helvetica-Bold")
                    .text("STAPLER", CX-90, y, { continued: true })
                    .fillColor(orange).text("O");
                y += 30;
            }

            doc.fontSize(7.5).fillColor(muted).font("Helvetica")
                .text("AUSBILDUNGSZENTRUM · JAKOBSTR. 13 · 02826 GÖRLITZ", 0, y, {
                    width: W, align: "center", characterSpacing: 0.5,
                });
            y += 13;

            // ── Ornamental divider ────────────────────────────────────────────
            const odW = 300, odX = CX - odW/2;
            doc.moveTo(odX, y).lineTo(CX-14, y).lineWidth(0.5).strokeColor(muted).stroke();
            doc.moveTo(CX+14, y).lineTo(odX+odW, y).lineWidth(0.5).strokeColor(muted).stroke();
            doc.save().translate(CX,y).rotate(45).rect(-3.5,-3.5,7,7).fill(orange).restore();
            y += 16;

            // ═════════════════════════════════════════════════════════════════
            // ZERTIFIKAT title block
            // ═════════════════════════════════════════════════════════════════
            doc.fontSize(10).fillColor(orange).font("Helvetica-Bold")
                .text("ZERTIFIKAT", 0, y, { width: W, align: "center", characterSpacing: 4 });
            y += 19;

            doc.fontSize(22).fillColor(navy).font("Helvetica-Bold")
                .text("BEFÄHIGUNGSNACHWEIS", 0, y, { width: W, align: "center", characterSpacing: 0.5 });
            y += 32;

            const typeLabel = isPractical
                ? "VOLLSTÄNDIGER BEFÄHIGUNGSNACHWEIS · THEORIE & PRAXIS"
                : "THEORETISCHER BEFÄHIGUNGSNACHWEIS · THEORIEKURS";
            doc.fontSize(9.5).fillColor(mid).font("Helvetica")
                .text(typeLabel, 0, y, {
                    width: W, align: "center",
                });
            y += 13;

            // ── Main divider ──────────────────────────────────────────────────
            const mdW = 460, mdX = CX - mdW/2;
            doc.moveTo(mdX, y).lineTo(CX-22, y).lineWidth(1.2).strokeColor(orange).stroke();
            doc.moveTo(CX+22, y).lineTo(mdX+mdW, y).lineWidth(1.2).strokeColor(orange).stroke();
            doc.circle(CX, y, 4.5).fill(orange);
            y += 18;

            // ═════════════════════════════════════════════════════════════════
            // "Hiermit wird bestätigt, dass"
            // ═════════════════════════════════════════════════════════════════
            doc.fontSize(11.5).fillColor(mid).font("Helvetica")
                .text("Hiermit wird bestätigt, dass", 0, y, { width: W, align: "center" });
            y += 18;

            // ═════════════════════════════════════════════════════════════════
            // NAME — dominant, biggest
            // ═════════════════════════════════════════════════════════════════
            const nameLen = cert.userName.length;
            const nameFs  = nameLen > 30 ? 30 : nameLen > 22 ? 36 : nameLen > 16 ? 42 : 48;
            doc.fontSize(nameFs).fillColor(dark).font("Helvetica-Bold")
                .text(cert.userName, 80, y, { width: W - 160, align: "center" });
            y += nameFs + 8;

            // Orange underline
            const ulW = Math.min(nameLen * nameFs * 0.48, W - 180);
            doc.moveTo(CX - ulW/2, y).lineTo(CX + ulW/2, y)
                .lineWidth(3).strokeColor(orange).stroke();
            y += 14;

            // ═════════════════════════════════════════════════════════════════
            // Qualification sentence
            // ═════════════════════════════════════════════════════════════════
            doc.fontSize(10.5).fillColor(mid).font("Helvetica")
                .text("die Ausbildung zum Führen von Gabelstaplern gemäß", 0, y, { width: W, align: "center" });
            y += 15;

            doc.fontSize(12).fillColor(navy).font("Helvetica-Bold")
                .text("DGUV Vorschrift 68  ·  DGUV Grundsatz 308-001", 0, y, { width: W, align: "center" });
            y += 15;

            doc.fontSize(10.5).fillColor(mid).font("Helvetica")
                .text("erfolgreich abgeschlossen hat und berechtigt ist, Gabelstapler zu führen.", 0, y, { width: W, align: "center" });
            y += cert.score !== undefined ? 13 : 0;

            if (cert.score !== undefined) {
                doc.fontSize(9.5).fillColor(muted).font("Helvetica")
                    .text(`Prüfungsergebnis: ${cert.score} %`, 0, y, { width: W, align: "center" });
            }
            y += 22;

            // ═════════════════════════════════════════════════════════════════
            // DATA BOXES — centered row
            // ═════════════════════════════════════════════════════════════════
            const fmtDate = (d: any) => new Date(d).toLocaleDateString("de-DE", {
                day: "2-digit", month: "long", year: "numeric",
            });

            const items = [
                { label: "Ausgestellt am",   value: fmtDate(cert.issuedAt) },
                { label: "Ausbildungsdatum", value: fmtDate(cert.trainingDate) },
                ...(cert.trainingLocation ? [{ label: "Ausbildungsort", value: cert.trainingLocation.split("–")[0].trim() }] : []),
                ...(cert.instructorName   ? [{ label: "Ausbilder",      value: cert.instructorName }] : []),
            ];

            const boxW   = 168;
            const boxH   = 50;
            const boxGap = 14;
            const totalBoxW = items.length * boxW + (items.length - 1) * boxGap;
            let bx = CX - totalBoxW / 2;

            items.forEach(item => {
                doc.rect(bx, y, boxW, boxH).fill("#EEF2F7");
                doc.rect(bx, y, boxW, 3).fill(orange);
                doc.fontSize(7.5).fillColor(muted).font("Helvetica-Bold")
                    .text(item.label.toUpperCase(), bx+8, y+9, { width: boxW-16, align:"center", characterSpacing: 0.5 });
                const vfs = item.value.length > 20 ? 9 : 11;
                doc.fontSize(vfs).fillColor(dark).font("Helvetica-Bold")
                    .text(item.value, bx+8, y+23, { width: boxW-16, align:"center" });
                bx += boxW + boxGap;
            });
            y += boxH + 14;

            // ═════════════════════════════════════════════════════════════════
            // BOTTOM ROW: sig left | QR center | sig right
            // ═════════════════════════════════════════════════════════════════
            const botY   = H - bm - 36;
            const sigLW  = 120;
            const sigLX  = bm + 60;
            const sigRX  = W - bm - 60 - sigLW;

            // Left signature
            doc.moveTo(sigLX, botY).lineTo(sigLX + sigLW, botY)
                .lineWidth(0.5).strokeColor("#cbd5e1").stroke();
            doc.fontSize(7).fillColor(muted).font("Helvetica")
                .text("Unterschrift Ausbilder", sigLX, botY+5, { width: sigLW, align:"center" });

            // Right signature / stamp
            doc.moveTo(sigRX, botY).lineTo(sigRX + sigLW, botY)
                .lineWidth(0.5).strokeColor("#cbd5e1").stroke();
            doc.fontSize(7).fillColor(muted).font("Helvetica")
                .text("Stempel / Siegel", sigRX, botY+5, { width: sigLW, align:"center" });

            // Center: QR + cert number below, all grouped
            const qrS = 72;
            const qrX = CX - qrS/2;
            const qrY = botY - qrS - 28;

            // White bg box for QR
            doc.rect(qrX-5, qrY-5, qrS+10, qrS+10).fill("#ffffff");
            doc.rect(qrX-5, qrY-5, qrS+10, qrS+10)
                .lineWidth(1.2).strokeColor(orange).stroke();
            doc.image(qrBuffer, qrX, qrY, { width: qrS, height: qrS });

            // Cert number — navy pill below QR, clearly readable
            const codeBoxW = 240;
            const codeBoxX = CX - codeBoxW / 2;
            const codeBoxY = qrY + qrS + 6;
            const codeBoxH = 30;

            doc.rect(codeBoxX, codeBoxY, codeBoxW, codeBoxH).fill(navy);
            doc.fontSize(7).fillColor("rgba(255,255,255,0.5)").font("Helvetica-Bold")
                .text("ZERTIFIKAT-NR.", codeBoxX, codeBoxY + 5, {
                    width: codeBoxW, align: "center", characterSpacing: 1.5,
                });
            doc.fontSize(12).fillColor(orange).font("Helvetica-Bold")
                .text(cert.verificationCode, codeBoxX, codeBoxY + 14, {
                    width: codeBoxW, align: "center", characterSpacing: 2,
                });

            // Bottom url
            const stripY = H - bm - 13;
            doc.fontSize(6.5).fillColor(muted).font("Helvetica")
                .text(`Echtheit prüfen: ${FRONTEND_URL}/verify/${cert.verificationCode}`,
                    0, stripY, { width: W, align: "center" });

            doc.end();
        } catch (err) { reject(err); }
    });
}

// ─── APPLE WALLET ─────────────────────────────────────────────────────────────

export const getAppleWalletPass = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { certId } = req.params;
        if (!userId) return res.status(401).json({ message: "Nicht autorisiert" });

        const cert = await Certificate.findOne({ _id: certId, userId }).lean();
        if (!cert) return res.status(404).json({ message: "Zertifikat nicht gefunden" });
        if (cert.revokedAt) return res.status(410).json({ message: "Zertifikat widerrufen" });

        // Check required env vars
        const certBase64 = process.env.APPLE_PASS_CERTIFICATE;
        const certPassword = process.env.APPLE_PASS_CERTIFICATE_PASSWORD || "";
        const wwdrBase64 = process.env.APPLE_WWDR_CERTIFICATE;
        const passTypeId = process.env.APPLE_PASS_TYPE_ID;
        const teamId = process.env.APPLE_TEAM_ID;

        if (!certBase64 || !wwdrBase64 || !passTypeId || !teamId) {
            return res.status(503).json({
                message: "Apple Wallet noch nicht konfiguriert.",
                setup: "Setzen Sie APPLE_PASS_CERTIFICATE, APPLE_WWDR_CERTIFICATE, APPLE_PASS_TYPE_ID und APPLE_TEAM_ID in .env",
            });
        }

        // Dynamic require to avoid TS error when package not yet installed
        let PKPass: any;
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pkg = require("passkit-generator") as any;
            PKPass = pkg.PKPass;
        } catch {
            return res.status(503).json({
                message: "passkit-generator nicht installiert.",
                setup: "npm install passkit-generator",
            });
        }

        const verifyUrl = `${FRONTEND_URL}/verify/${cert.verificationCode}`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 1 });
        const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

        const pass = await PKPass.from(
            {
                model: {
                    "pass.json": Buffer.from(
                        JSON.stringify({
                            formatVersion: 1,
                            passTypeIdentifier: passTypeId,
                            serialNumber: cert.verificationCode,
                            teamIdentifier: teamId,
                            organizationName: "STAPLERO",
                            description: "Staplerschein – Gabelstapler-Fahrausweis",
                            backgroundColor: "rgb(15, 23, 42)",
                            foregroundColor: "rgb(255, 255, 255)",
                            labelColor: "rgb(245, 158, 11)",
                            generic: {
                                primaryFields: [
                                    {
                                        key: "name",
                                        label: "INHABER",
                                        value: cert.userName,
                                    },
                                ],
                                secondaryFields: [
                                    {
                                        key: "certId",
                                        label: "ZERTIFIKAT-NR.",
                                        value: cert.verificationCode,
                                    },
                                    {
                                        key: "issued",
                                        label: "AUSGESTELLT AM",
                                        value: formatDateShort(cert.issuedAt),
                                    },
                                ],
                                auxiliaryFields: [
                                    {
                                        key: "regulation",
                                        label: "GRUNDLAGE",
                                        value: "DGUV V68 · GS 308-001",
                                    },
                                    {
                                        key: "location",
                                        label: "ORT",
                                        value: cert.trainingLocation || "STAPLERO Ausbildungszentrum",
                                    },
                                ],
                                backFields: [
                                    {
                                        key: "courseName",
                                        label: "Kurs",
                                        value: cert.courseName,
                                    },
                                    {
                                        key: "trainingDate",
                                        label: "Ausbildungsdatum",
                                        value: formatDateShort(cert.trainingDate),
                                    },
                                    {
                                        key: "dguv1",
                                        label: "Rechtsgrundlage",
                                        value: "DGUV Vorschrift 68 – Flurförderzeuge",
                                    },
                                    {
                                        key: "dguv2",
                                        label: "Durchführung",
                                        value: "DGUV Grundsatz 308-001",
                                    },
                                    {
                                        key: "verify",
                                        label: "Echtheit prüfen",
                                        value: verifyUrl,
                                    },
                                ],
                            },
                            barcode: {
                                message: verifyUrl,
                                format: "PKBarcodeFormatQR",
                                messageEncoding: "iso-8859-1",
                                altText: cert.verificationCode,
                            },
                        })
                    ),
                    "icon.png": Buffer.alloc(0),   // Replace with real icon
                    "icon@2x.png": Buffer.alloc(0),
                    "logo.png": Buffer.alloc(0),    // Replace with real logo
                    "logo@2x.png": Buffer.alloc(0),
                },
                certificates: {
                    wwdr: Buffer.from(wwdrBase64, "base64"),
                    signerCert: Buffer.from(certBase64, "base64"),
                    signerKey: Buffer.from(certBase64, "base64"),
                    signerKeyPassphrase: certPassword,
                },
            }
        );

        const passBuffer = await pass.getAsBuffer();
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Staplerschein-${cert.verificationCode}.pkpass"`
        );
        res.send(passBuffer);
    } catch (err: any) {
        console.error("Apple Wallet error:", err);
        res.status(500).json({ message: "Fehler beim Erstellen des Apple Wallet Passes", error: err.message });
    }
};

// ─── GOOGLE WALLET ────────────────────────────────────────────────────────────

export const getGoogleWalletUrl = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { certId } = req.params;
        if (!userId) return res.status(401).json({ message: "Nicht autorisiert" });

        const cert = await Certificate.findOne({ _id: certId, userId }).lean();
        if (!cert) return res.status(404).json({ message: "Zertifikat nicht gefunden" });
        if (cert.revokedAt) return res.status(410).json({ message: "Zertifikat widerrufen" });

        if (!GOOGLE_SERVICE_ACCOUNT || !GOOGLE_ISSUER_ID) {
            return res.status(503).json({
                message: "Google Wallet noch nicht konfiguriert.",
                setup: "Setzen Sie GOOGLE_WALLET_SERVICE_ACCOUNT und GOOGLE_WALLET_ISSUER_ID in .env",
            });
        }

        const verifyUrl = `${FRONTEND_URL}/verify/${cert.verificationCode}`;

        const genericObject = {
            id: `${GOOGLE_ISSUER_ID}.${cert.verificationCode}`,
            classId: GOOGLE_CLASS_ID,
            genericType: "GENERIC_TYPE_UNSPECIFIED",
            hexBackgroundColor: "#0f172a",
            logo: {
                sourceUri: {
                    uri: `${FRONTEND_URL}/logo-wallet.png`,
                },
                contentDescription: {
                    defaultValue: { language: "de-DE", value: "STAPLERO Logo" },
                },
            },
            cardTitle: {
                defaultValue: { language: "de-DE", value: "STAPLERO" },
            },
            subheader: {
                defaultValue: { language: "de-DE", value: "Befähigungsnachweis" },
            },
            header: {
                defaultValue: { language: "de-DE", value: cert.userName },
            },
            textModulesData: [
                {
                    id: "certId",
                    header: "Zertifikat-Nr.",
                    body: cert.verificationCode,
                },
                {
                    id: "regulation",
                    header: "Rechtsgrundlage",
                    body: "DGUV Vorschrift 68 · DGUV Grundsatz 308-001",
                },
                {
                    id: "trainingDate",
                    header: "Ausbildungsdatum",
                    body: formatDateShort(cert.trainingDate),
                },
                {
                    id: "issued",
                    header: "Ausgestellt am",
                    body: formatDateShort(cert.issuedAt),
                },
                {
                    id: "location",
                    header: "Ausbildungsort",
                    body: cert.trainingLocation || "STAPLERO Ausbildungszentrum",
                },
            ],
            linksModuleData: {
                uris: [
                    {
                        uri: verifyUrl,
                        description: "Zertifikat verifizieren",
                        id: "verify",
                    },
                ],
            },
            barcode: {
                type: "QR_CODE",
                value: verifyUrl,
                alternateText: cert.verificationCode,
            },
            state: "ACTIVE",
        };

        // Sign JWT
        const serviceAccountEmail = GOOGLE_SERVICE_ACCOUNT.client_email;
        const serviceAccountKey = GOOGLE_SERVICE_ACCOUNT.private_key;

        const claims = {
            iss: serviceAccountEmail,
            aud: "google",
            origins: [FRONTEND_URL],
            typ: "savetowallet",
            payload: {
                genericObjects: [genericObject],
            },
        };

        const token = jwt.sign(claims, serviceAccountKey, { algorithm: "RS256" });
        const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

        res.json({ url: saveUrl });
    } catch (err: any) {
        console.error("Google Wallet error:", err);
        res.status(500).json({ message: "Fehler beim Erstellen des Google Wallet Passes", error: err.message });
    }
};

// ─── PUBLIC VERIFY ────────────────────────────────────────────────────────────

export const verifyCertificate = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const cert = await Certificate.findOne({ verificationCode: code }).lean();

        if (!cert) {
            return res.status(404).json({
                valid: false,
                message: "Zertifikat nicht gefunden",
            });
        }

        if (cert.revokedAt) {
            return res.status(410).json({
                valid: false,
                revoked: true,
                message: "Dieses Zertifikat wurde widerrufen",
                revokedAt: cert.revokedAt,
            });
        }

        res.json({
            valid: true,
            type: cert.type,
            userName: cert.userName,
            courseName: cert.courseName,
            trainingDate: cert.trainingDate,
            trainingLocation: cert.trainingLocation,
            issuedAt: cert.issuedAt,
            verificationCode: cert.verificationCode,
            ...(cert.score !== undefined && { score: cert.score }),
        });
    } catch (err) {
        res.status(500).json({ message: "Serverfehler", error: err });
    }
};

// ─── ADMIN: Get all certificates ──────────────────────────────────────────────

export const adminGetAllCertificates = async (req: AuthRequest, res: Response) => {
    try {
        const { type, search, page = "1", limit = "20", revoked } = req.query;

        const filter: any = {};
        if (type) filter.type = type;
        if (revoked === "true") filter.revokedAt = { $exists: true };
        else if (revoked === "false") filter.revokedAt = { $exists: false };

        if (search) {
            filter.$or = [
                { userName: { $regex: search, $options: "i" } },
                { userEmail: { $regex: search, $options: "i" } },
                { verificationCode: { $regex: search, $options: "i" } },
            ];
        }

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const [certs, total] = await Promise.all([
            Certificate.find(filter).sort({ issuedAt: -1 }).skip(skip).limit(limitNum).lean(),
            Certificate.countDocuments(filter),
        ]);

        res.json({
            success: true,
            certificates: certs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Serverfehler", error: err });
    }
};

// ─── ADMIN: Revoke certificate ────────────────────────────────────────────────

export const adminRevokeCertificate = async (req: AuthRequest, res: Response) => {
    try {
        const { certId } = req.params;
        const { reason } = req.body;

        const cert = await Certificate.findByIdAndUpdate(
            certId,
            {
                revokedAt: new Date(),
                revokedReason: reason || "Widerrufen durch Administrator",
            },
            { new: true }
        );

        if (!cert) return res.status(404).json({ message: "Zertifikat nicht gefunden" });

        res.json({ success: true, message: "Zertifikat widerrufen", certificate: cert });
    } catch (err) {
        res.status(500).json({ message: "Serverfehler", error: err });
    }
};

// ─── ADMIN: Restore revoked certificate ───────────────────────────────────────

export const adminRestoreCertificate = async (req: AuthRequest, res: Response) => {
    try {
        const { certId } = req.params;

        const cert = await Certificate.findByIdAndUpdate(
            certId,
            { $unset: { revokedAt: 1, revokedReason: 1 } },
            { new: true }
        );

        if (!cert) return res.status(404).json({ message: "Zertifikat nicht gefunden" });

        res.json({ success: true, message: "Zertifikat wiederhergestellt", certificate: cert });
    } catch (err) {
        res.status(500).json({ message: "Serverfehler", error: err });
    }
};

// ─── ADMIN: Download any certificate PDF ─────────────────────────────────────

export const adminDownloadCertificate = async (req: AuthRequest, res: Response) => {
    try {
        const { certId } = req.params;

        const cert = await Certificate.findById(certId).lean();
        if (!cert) return res.status(404).json({ message: "Zertifikat nicht gefunden" });

        const pdfBuffer = await generateCertificatePDF(cert);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Staplerschein-${cert.verificationCode}.pdf"`
        );
        res.send(pdfBuffer);
    } catch (err) {
        res.status(500).json({ message: "Serverfehler", error: err });
    }
};

// ─── ADMIN: Get stats ─────────────────────────────────────────────────────────

export const adminGetCertificateStats = async (req: AuthRequest, res: Response) => {
    try {
        const [total, online, practical, revoked, thisMonth] = await Promise.all([
            Certificate.countDocuments(),
            Certificate.countDocuments({ type: "online" }),
            Certificate.countDocuments({ type: "practical" }),
            Certificate.countDocuments({ revokedAt: { $exists: true } }),
            Certificate.countDocuments({
                issuedAt: { $gte: new Date(new Date().setDate(1)) },
            }),
        ]);

        res.json({ success: true, stats: { total, online, practical, revoked, thisMonth } });
    } catch (err) {
        res.status(500).json({ message: "Serverfehler", error: err });
    }
};