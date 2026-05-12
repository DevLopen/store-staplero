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

// Stufen definitions per DGUV Grundsatz 308-001
const STUFEN: Record<string, string> = {
    "stufe1": "Stufe 1 – Frontgabelstapler / Mitgänger-Flurförderzeuge (DGUV G 308-001)",
    "stufe2": "Stufe 2 – Schubmaststapler / Teleskopstapler / Containerstapler (Zusatzqualifizierung)",
    "stufe2_anbau": "Stufe 2 – Zusatzqualifizierung Anbaugeräte (Klammern >1 t etc.)",
};

const TH: {n:string;t:string;p:string}[] = [
    { n:"1",  t:"Rechtliche Grundlagen",                             p:"10–15%" },
    { n:"2",  t:"Unfallgeschehen",                                   p:"5%"     },
    { n:"3",  t:"Aufbau/Funktion von Flurförderzeugen/Anbaugeräten", p:"5–10%"  },
    { n:"4",  t:"Antriebsarten",                                     p:"5–10%"  },
    { n:"5",  t:"Standsicherheit",                                   p:"10–15%" },
    { n:"6",  t:"Betrieb allgemein",                                 p:"15–20%" },
    { n:"7",  t:"Regelmäßige Prüfung",                               p:"5%"     },
    { n:"8",  t:"Umgang mit Last",                                   p:"10–15%" },
    { n:"9",  t:"Sondereinsätze",                                    p:"10–15%" },
    { n:"10", t:"Verkehrsregeln / Verkehrswege",                     p:""       },
];
const PR: {n:string;t:string;p:string}[] = [
    { n:"1",  t:"Einweisung am Flurförderzeug",                      p:"10–20%" },
    { n:"2",  t:"Tägliche Einsatzprüfung",                           p:""       },
    { n:"3",  t:"Lastschwerpunkt, Gewichtsverteilung, zul. Lasten",  p:""       },
    { n:"4",  t:"Gefahrstellen am Flurförderzeug",                   p:""       },
    { n:"5",  t:"Gewöhnung an das Flurförderzeug",                   p:"5%"     },
    { n:"6",  t:"Verlassen des Flurförderzeugs",                     p:""       },
    { n:"7",  t:"Fahr- und Stapelübungen",                           p:"55–65%" },
    { n:"8",  t:"Abschlussprüfung (15–20 min/Teilnehmer)",           p:"20%"    },
];
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
            const isP = cert.type === "practical";
            const verifyUrl = `${FRONTEND_URL}/verify/${cert.verificationCode}`;
            const fmtD = (d: any) => new Date(d).toLocaleDateString("de-DE",
                {day:"2-digit", month:"2-digit", year:"numeric"});

            const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
                margin:1, width:200,
                color:{ dark: isP ? "#1e3a5f" : "#1e3a7f", light:"#ffffff" },
                errorCorrectionLevel:"M",
            });
            const qrBuf = Buffer.from(qrDataUrl.split(",")[1], "base64");

            const _fs   = require("fs");
            const _path = require("path");
            const logoPath = _path.join(__dirname, "../assets/staplero_logo.jpeg");
            const logoBuf: Buffer | null = _fs.existsSync(logoPath) ? _fs.readFileSync(logoPath) : null;

            const doc = new PDFDocument({ size:"A4", layout:"landscape",
                margins:{top:0,bottom:0,left:0,right:0} });
            const chunks: Buffer[] = [];
            doc.on("data", (c: Buffer) => chunks.push(c));
            doc.on("end",  () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            const W = doc.page.width;   // 841.89
            const H = doc.page.height;  // 595.28
            const bm = 16;

            // Palette
            const navy  = "#1e3a5f";
            const acc   = isP ? "#f59e0b" : "#2563eb";
            const accBg = isP ? "#FEFCE8" : "#EFF6FF";
            const bg    = isP ? "#FAFAF7" : "#F5F8FF";
            const dark  = "#1f2937";
            const mid   = "#4b5563";
            const muted = "#9ca3af";

            // Background + frame
            doc.rect(0,0,W,H).fill(bg);
            doc.rect(bm,bm,W-bm*2,H-bm*2).lineWidth(2.2).strokeColor(navy).stroke();
            doc.rect(bm+4,bm+4,W-(bm+4)*2,H-(bm+4)*2).lineWidth(0.5).strokeColor(acc).stroke();
            [[bm+20,bm+20],[W-bm-20,bm+20],[bm+20,H-bm-20],[W-bm-20,H-bm-20]].forEach(([cx,cy])=>{
                doc.save().translate(cx,cy).rotate(45).rect(-3,-3,6,6).fill(acc).restore();
            });

            const CX = W/2;
            const pad = 14;

            // ════════════════════════════════════════════════════════════════
            // ZONE A — TOP BANNER
            // logo left | ZERTIFIKAT + title centre | org right
            // ════════════════════════════════════════════════════════════════
            const aY = bm + pad;

            if (logoBuf) {
                doc.image(logoBuf, bm+pad, aY, {width:100, height:40, fit:[100,40]});
            }

            // Titles centred
            doc.fontSize(7.5).fillColor(acc).font("Helvetica-Bold")
                .text("ZERTIFIKAT", 0, aY+2, {width:W, align:"center", characterSpacing:3});
            doc.fontSize(15).fillColor(navy).font("Helvetica-Bold")
                .text("BEFÄHIGUNGSNACHWEIS", 0, aY+13, {width:W, align:"center"});
            doc.fontSize(7.5).fillColor(mid).font("Helvetica")
                .text(isP ? "GABELSTAPLER · THEORIE & PRAXIS" : "GABELSTAPLER · THEORIEKURS",
                    0, aY+32, {width:W, align:"center"});

            // Org right
            doc.fontSize(6.5).fillColor(muted).font("Helvetica")
                .text("STAPLERO Ausbildungszentrum", W-bm-pad-115, aY+4, {width:115, align:"right"});
            doc.fontSize(6.5).fillColor(muted).font("Helvetica")
                .text("Jakobstr. 13 · 02826 Görlitz", W-bm-pad-115, aY+13, {width:115, align:"right"});
            doc.fontSize(6.5).fillColor(navy).font("Helvetica-Bold")
                .text("staplero.com", W-bm-pad-115, aY+22, {width:115, align:"right"});

            // Rule
            const rY = aY + 46;
            doc.moveTo(bm+pad, rY).lineTo(CX-16, rY).lineWidth(1).strokeColor(acc).stroke();
            doc.moveTo(CX+16, rY).lineTo(W-bm-pad, rY).lineWidth(1).strokeColor(acc).stroke();
            doc.circle(CX, rY, 3.5).fill(acc);

            // ════════════════════════════════════════════════════════════════
            // ZONE B — NAME + QUALIFICATION (full width, centred)
            // ════════════════════════════════════════════════════════════════
            let y = rY + 10;

            doc.fontSize(8.5).fillColor(mid).font("Helvetica")
                .text("Hiermit wird bestätigt, dass", 0, y, {width:W, align:"center"});
            y += 12;

            const nl  = cert.userName.length;
            const nfs = nl>28?24:nl>22?28:nl>16?33:38;
            doc.fontSize(nfs).fillColor(dark).font("Helvetica-Bold")
                .text(cert.userName, 60, y, {width:W-120, align:"center"});
            y += nfs + 4;

            // Underline
            const ulw = Math.min(nl*nfs*0.43, W-180);
            doc.moveTo(CX-ulw/2, y).lineTo(CX+ulw/2, y).lineWidth(2.5).strokeColor(acc).stroke();
            y += 9;

            doc.fontSize(9).fillColor(mid).font("Helvetica")
                .text("die Ausbildung zum Führen von Gabelstaplern gemäß", 0, y, {width:W, align:"center"});
            y += 12;
            doc.fontSize(10.5).fillColor(navy).font("Helvetica-Bold")
                .text("DGUV Vorschrift 68  ·  DGUV Grundsatz 308-001", 0, y, {width:W, align:"center"});
            y += 12;

            if (isP) {
                // Authorisation text
                doc.fontSize(9).fillColor(mid).font("Helvetica")
                    .text("erfolgreich abgeschlossen hat und ist berechtigt,", 0, y, {width:W, align:"center"});
                y += 11;
                doc.fontSize(10).fillColor(navy).font("Helvetica-Bold")
                    .text("Flurförderzeuge (Gabelstapler) selbstständig zu führen.", 0, y, {width:W, align:"center"});
                y += 13;
            } else {
                // Warning — compact, readable
                const wW=460, wH=24, wX=CX-wW/2;
                // Subtle warning — no bold bar, just a clean framed note
                doc.rect(wX, y, wW, wH).fill("#FFF5F5");
                doc.rect(wX, y, wW, wH).lineWidth(0.6).strokeColor("#fca5a5").stroke();
                doc.fontSize(7.5).fillColor("#991b1b").font("Helvetica-Bold")
                    .text("Dieser Nachweis berechtigt NICHT zum selbstständigen Führen eines Flurförderzeugs.", wX+12, y+5, {width:wW-24, align:"center"});
                doc.fontSize(6.5).fillColor("#b91c1c").font("Helvetica")
                    .text("Für die Fahrberechtigung ist eine zusätzliche praktische Ausbildung nach DGUV Grundsatz 308-001 erforderlich.",
                        wX+12, y+14, {width:wW-24, align:"center"});
                y += wH + 6;
            }

            if (cert.score !== undefined) {
                doc.fontSize(8).fillColor(muted).font("Helvetica")
                    .text(`Prüfungsergebnis Theorie: ${cert.score} %`, 0, y, {width:W, align:"center"});
                y += 11;
            }

            // Dashed separator
            const sepY = y + 3;
            doc.moveTo(bm+pad, sepY).lineTo(W-bm-pad, sepY)
                .lineWidth(0.4).strokeColor(muted).dash(2,{space:3}).stroke();
            doc.undash();
            y = sepY + 8;

            // ════════════════════════════════════════════════════════════════
            // ZONE C — 3 COLUMNS: data+sigs | curriculum | QR+nr
            // ════════════════════════════════════════════════════════════════
            const zC  = y;
            const colL = 185;
            const colR = 96;
            const colM = W - bm*2 - pad*2 - colL - colR - 16;
            const xL   = bm + pad;
            const xM   = xL + colL + 8;
            const xR   = xM + colM + 8;

            // ── LEFT col: date box + stufen + forklift + sigs ────────────────
            let ly = zC;

            // Single date box — Kursdatum only
            const dateLabel = isP ? "KURSDATUM" : "AUSBILDUNGSDATUM";
            const dateVal   = fmtD(cert.trainingDate);
            const dbH = 34;
            doc.rect(xL, ly, colL, dbH).fill(accBg);
            doc.rect(xL, ly, colL, 2.5).fill(acc);
            doc.fontSize(6).fillColor(muted).font("Helvetica-Bold")
                .text(dateLabel, xL+6, ly+5, {width:colL-12});
            doc.fontSize(13).fillColor(dark).font("Helvetica-Bold")
                .text(dateVal, xL+6, ly+14, {width:colL-12});
            ly += dbH + 6;

            // Location + instructor in smaller boxes side by side
            const smallBoxes = [
                ...(cert.trainingLocation?[{l:"AUSBILDUNGSORT",v:cert.trainingLocation.split("–")[0].trim()}]:[]),
                ...(cert.instructorName  ?[{l:"AUSBILDER",     v:cert.instructorName}]:[]),
            ];
            if (smallBoxes.length > 0) {
                const sbW = smallBoxes.length===1 ? colL : Math.floor((colL-6)/2);
                let sx = xL;
                smallBoxes.forEach(b => {
                    doc.rect(sx, ly, sbW, 28).fill(accBg);
                    doc.rect(sx, ly, sbW, 2).fill(acc);
                    doc.fontSize(5.5).fillColor(muted).font("Helvetica-Bold")
                        .text(b.l, sx+5, ly+4, {width:sbW-10});
                    doc.fontSize(b.v.length>16?7.5:8.5).fillColor(dark).font("Helvetica-Bold")
                        .text(b.v, sx+5, ly+13, {width:sbW-10});
                    sx += sbW + 6;
                });
                ly += 34;
            }

            // Stufen / Fahrzeugklassen
            const stufen = cert.stufen || (isP ? ["stufe1"] : []);
            if (stufen.length > 0) {
                ly += 3;
                doc.fontSize(6).fillColor(muted).font("Helvetica-Bold")
                    .text("QUALIFIZIERUNGSSTUFEN:", xL, ly, {characterSpacing:0.5});
                ly += 9;
                stufen.forEach((s: string) => {
                    const label = STUFEN[s] || s;
                    doc.circle(xL+4, ly+3.5, 2).fill(acc);
                    doc.fontSize(7).fillColor(dark).font("Helvetica")
                        .text(label, xL+11, ly, {width:colL-14});
                    ly += 11;
                });
            }

            // Sig lines pinned to bottom of left col
            const sigY = H - bm - pad - 14;
            const sw   = (colL-6)/2;
            [xL, xL+sw+6].forEach((sx,i) => {
                doc.moveTo(sx, sigY).lineTo(sx+sw, sigY).lineWidth(0.4).strokeColor("#cbd5e1").stroke();
                doc.fontSize(5.5).fillColor(muted).font("Helvetica")
                    .text(i===0?"Unterschrift Ausbilder":"Stempel / Siegel",
                        sx, sigY+4, {width:sw, align:"center"});
            });

            // ── CENTRE col: curriculum ───────────────────────────────────────
            let ry = zC;
            const rowH = 11;

            // Theorie band
            doc.rect(xM, ry, colM, 13).fill(navy);
            doc.fontSize(6.5).fillColor("#fff").font("Helvetica-Bold")
                .text("THEORIE  –  Ausbildungsinhalte", xM+6, ry+3, {characterSpacing:0.5});
            ry += 15;

            TH.forEach(t => {
                doc.fontSize(6.5).fillColor(acc).font("Helvetica-Bold")
                    .text(t.n+".", xM, ry, {width:13});
                doc.fontSize(7).fillColor(dark).font("Helvetica")
                    .text(t.t, xM+13, ry, {width:colM-55, lineBreak:false});
                if (t.p) doc.fontSize(6.5).fillColor(muted).font("Helvetica-Bold")
                    .text(t.p, xM+colM-40, ry, {width:40, align:"right"});
                ry += rowH;
            });

            if (isP) {
                ry += 4;
                doc.rect(xM, ry, colM, 13).fill(acc);
                doc.fontSize(6.5).fillColor("#000").font("Helvetica-Bold")
                    .text("PRAXIS  –  Ausbildungsinhalte", xM+6, ry+3, {characterSpacing:0.5});
                ry += 15;

                PR.forEach(t => {
                    doc.fontSize(6.5).fillColor(acc).font("Helvetica-Bold")
                        .text(t.n+".", xM, ry, {width:13});
                    doc.fontSize(7).fillColor(dark).font("Helvetica")
                        .text(t.t, xM+13, ry, {width:colM-55, lineBreak:false});
                    if (t.p) doc.fontSize(6.5).fillColor(muted).font("Helvetica-Bold")
                        .text(t.p, xM+colM-40, ry, {width:40, align:"right"});
                    ry += rowH;
                });
            }

            // DGUV note bottom of centre col
            const noteY = H - bm - pad - 18;
            doc.rect(xM, noteY, colM, 16).fill(accBg);
            doc.rect(xM, noteY, 2.5, 16).fill(acc);
            doc.fontSize(5.5).fillColor(mid).font("Helvetica")
                .text("DGUV Vorschrift 68 · DGUV Grundsatz 308-001",
                    xM+7, noteY+3, {width:colM-10});
            doc.fontSize(5.5).fillColor(muted).font("Helvetica")
                .text("Ausgestellt von STAPLERO Ausbildungszentrum Görlitz",
                    xM+7, noteY+10, {width:colM-10});

            // ── RIGHT col: QR + cert number ──────────────────────────────────
            const qs  = 76;
            const qrx = xR + (colR-qs)/2;
            const qry = zC + 4;
            doc.rect(qrx-4, qry-4, qs+8, qs+8).fill("#fff");
            doc.rect(qrx-4, qry-4, qs+8, qs+8).lineWidth(1).strokeColor(acc).stroke();
            doc.image(qrBuf, qrx, qry, {width:qs, height:qs});

            doc.fontSize(5.5).fillColor(acc).font("Helvetica-Bold")
                .text("QR · ECHTHEIT PRÜFEN", xR, qry+qs+5,
                    {width:colR, align:"center", characterSpacing:0.5});

            // Cert nr pill
            const nrY = qry + qs + 16;
            const nrH = H - bm - pad - 8 - nrY;
            doc.rect(xR, nrY, colR, nrH).fill(navy);
            doc.fontSize(5.5).fillColor("rgba(255,255,255,0.45)").font("Helvetica-Bold")
                .text("ZERTIFIKAT-NR.", xR, nrY+5, {width:colR, align:"center", characterSpacing:0.5});
            const code = cert.verificationCode;
            const cfs  = code.length>14 ? 7 : 8.5;
            doc.fontSize(cfs).fillColor(acc).font("Helvetica-Bold")
                .text(code, xR, nrY+14, {width:colR, align:"center", characterSpacing:1});
            doc.fontSize(5).fillColor("rgba(255,255,255,0.25)").font("Helvetica")
                .text("staplero.com/verify", xR, nrY+nrH-10, {width:colR, align:"center"});

            doc.end();
        } catch(e) { reject(e); }
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
            instructorName: cert.instructorName,
            issuedAt: cert.issuedAt,
            verificationCode: cert.verificationCode,
            ...(cert.score !== undefined && { score: cert.score }),
            ...(cert.stufen?.length && { stufen: cert.stufen }),
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