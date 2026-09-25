import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import Certificate from "../models/Certificate";
import Course from "../models/Course";
import QuizResult from "../models/QuizResult";
import PracticalCourseParticipant from "../models/PracticalCourseParticipant";
import { AuthRequest } from "../types";
import { Jimp } from "jimp";
import { assetPath, readAsset, loadCertificatePhoto, buildWalletBanner } from "../services/walletBanner.service";

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
            `attachment; filename="${cert.type === "practical" ? "Staplerschein" : "Theorienachweis"}-${cert.verificationCode}.pdf"`
        );
        res.send(pdfBuffer);
    } catch (err) {
        res.status(500).json({ message: "Serverfehler", error: err });
    }
};

// ─── PDF GENERATOR ────────────────────────────────────────────────────────────

// Kolory i fonty jak na stronie i w mailach
const CERT = {
    dark: "#212121", ink: "#111111", body: "#39393b", muted: "#707072",
    line: "#e5e5e5", orange: "#F97706", red: "#7f1d1d", redBg: "#fdf2f2", redLine: "#f5c2c2", alert: "#b91c1c",
};

const siteHost = () => {
    try { return new URL(FRONTEND_URL).host.replace(/^www\./, ""); } catch { return "staplero.de"; }
};

const qualificationShort = (stufen: string[]) =>
    stufen.some((s) => s.startsWith("stufe2")) ? "Stufe 1 + 2" : "Stufe 1";

// Zdjęcie z uploadu bywa duże (kilka MB), a PDF idzie mailem: zmniejszamy do ~600 px JPEG
const shrinkPhoto = async (buf: Buffer | null): Promise<Buffer | null> => {
    if (!buf) return null;
    try {
        const img = await Jimp.read(buf);
        img.cover({ w: 420, h: 540 });
        return await img.getBuffer("image/jpeg", { quality: 85 });
    } catch {
        return buf;
    }
};

export async function generateCertificatePDF(cert: any): Promise<Buffer> {
    const isP = cert.type === "practical";
    const verifyUrl = `${FRONTEND_URL}/verify/${cert.verificationCode}`;
    const fmtD = (d: any) => new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 0, width: 360, color: { dark: CERT.ink, light: "#ffffff" }, errorCorrectionLevel: "M",
    });
    const qrBuf = Buffer.from(qrDataUrl.split(",")[1], "base64");
    const logoBuf = readAsset("staplero-logo.png");
    const photoBuf = isP ? await shrinkPhoto(loadCertificatePhoto(cert)) : null;

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: "A4", layout: "landscape", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
            const chunks: Buffer[] = [];
            doc.on("data", (c: Buffer) => chunks.push(c));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            // Fonty (fallback na Helvetica, gdyby plików nie było)
            const font = (name: string, file: string, fallback: string) => {
                const p = assetPath("fonts", file);
                if (p) doc.registerFont(name, p); else doc.registerFont(name, fallback);
            };
            font("display", "BarlowCondensed-ExtraBold.ttf", "Helvetica-Bold");
            font("reg", "Inter-Regular.ttf", "Helvetica");
            font("semi", "Inter-SemiBold.ttf", "Helvetica-Bold");
            font("bold", "Inter-Bold.ttf", "Helvetica-Bold");
            font("mono", "JetBrainsMono-Bold.ttf", "Courier-Bold");

            const W = doc.page.width;   // 841.89
            const H = doc.page.height;  // 595.28
            const M = 35;               // margines boczny
            const sideW = 147;
            const xSide = W - M - sideW;
            const mainW = xSide - 30 - M;

            // ── Pas z logo ──────────────────────────────────────────────────
            const bandH = 77;
            doc.rect(0, 0, W, bandH).fill(CERT.dark);
            if (logoBuf) doc.image(logoBuf, M, (bandH - 34) / 2, { height: 34 });
            doc.font("semi").fontSize(8).fillColor("#ffffff")
                .text("STAPLERO Ausbildungszentrum", M, 28, { width: W - 2 * M, align: "right" });
            doc.font("reg").fontSize(8).fillColor("#bdbdbd")
                .text(`Jakobstr. 13 · 02826 Görlitz · ${siteHost()}`, M, 40, { width: W - 2 * M, align: "right" });
            doc.rect(0, bandH, W, 3.8).fill(isP ? CERT.orange : CERT.alert);

            let y = bandH + 28;
            if (!isP) {
                // Znak wodny na całej kartce: dokumentu nie da się pokazać jako uprawnienia
                doc.save().rotate(-24, { origin: [W / 2, H / 2 + 20] }).fillOpacity(0.06).fillColor(CERT.alert).font("display").fontSize(64);
                ["NUR THEORIE", "KEINE FAHRBERECHTIGUNG"].forEach((line, i) =>
                    doc.text(line, -60, H / 2 - 50 + i * 70, { width: W + 120, align: "center", lineBreak: false }));
                doc.restore().fillOpacity(1);

                // Czerwony pas na całą szerokość, zanim ktokolwiek zobaczy nazwisko
                const aH = 46;
                doc.rect(0, bandH + 3.8, W, aH).fill(CERT.alert);
                doc.font("display").fontSize(22).fillColor("#ffffff")
                    .text("KEINE FAHRBERECHTIGUNG", M, bandH + 3.8 + 12, { lineBreak: false });
                doc.font("semi").fontSize(9).fillColor("#ffffff")
                    .text("Dieser Nachweis berechtigt NICHT zum Führen von Gabelstaplern oder anderen Flurförderzeugen.", M + 230, bandH + 3.8 + 12, { width: W - 2 * M - 230, lineGap: 1 });
                y = bandH + 3.8 + aH + 22;
            }

            // ── Nagłówek i imię ─────────────────────────────────────────────
            doc.font("bold").fontSize(8.4).fillColor(isP ? CERT.orange : CERT.alert)
                .text(isP ? "ZERTIFIKAT · DGUV VORSCHRIFT 68" : "NUR THEORIETEIL · KEIN FAHRAUSWEIS", M, y, { characterSpacing: 2.2 });
            y += 14;
            doc.font("display").fontSize(33).fillColor(CERT.ink).text(isP ? "BEFÄHIGUNGSNACHWEIS" : "THEORIENACHWEIS", M, y, { lineBreak: false });
            y += 40;
            doc.font("semi").fontSize(9.5).fillColor(CERT.muted)
                .text(isP ? "GABELSTAPLER · THEORIE & PRAXIS" : "GABELSTAPLER · THEORETISCHER TEIL DER AUSBILDUNG (ONLINE)", M, y, { characterSpacing: 1 });
            y += 26;
            doc.font("reg").fontSize(10).fillColor(CERT.muted).text("Hiermit wird bestätigt, dass", M, y);
            y += 14;

            const name = String(cert.userName || "").toUpperCase();
            let nfs = 47;
            doc.font("display");
            while (nfs > 24 && doc.fontSize(nfs).widthOfString(name) > mainW) nfs -= 1;
            doc.fontSize(nfs).fillColor(CERT.ink).text(name, M, y, { width: mainW, lineBreak: false });
            y += nfs + 10;

            // Oświadczenie z pogrubieniami
            const rich = (parts: Array<[string, boolean]>) => {
                doc.fontSize(10.8).fillColor(CERT.body);
                parts.forEach(([txt, b], i) => {
                    const opts = { width: mainW - 60, continued: i < parts.length - 1, lineGap: 3 };
                    doc.font(b ? "bold" : "reg").fillColor(b ? CERT.ink : CERT.body);
                    if (i === 0) doc.text(txt, M, y, opts); else doc.text(txt, opts);
                });
            };
            if (isP) {
                rich([
                    ["die Ausbildung zum Führen von Gabelstaplern gemäß ", false], ["DGUV Vorschrift 68", true], [" und ", false],
                    ["DGUV Grundsatz 308-001", true], [" erfolgreich abgeschlossen hat und berechtigt ist, ", false],
                    ["Flurförderzeuge (Gabelstapler) selbstständig zu führen.", true],
                ]);
            } else {
                rich([
                    ["die theoretische Ausbildung zum Führen von Gabelstaplern gemäß ", false], ["DGUV Vorschrift 68", true],
                    [" und ", false], ["DGUV Grundsatz 308-001", true], [" erfolgreich abgeschlossen hat.", false],
                ]);
            }
            y = doc.y + 16;

            // ── Rząd danych ─────────────────────────────────────────────────
            const stufen: string[] = cert.stufen || (isP ? ["stufe1"] : []);
            const facts: Array<[string, string]> = isP
                ? [
                    ["KURSDATUM", fmtD(cert.trainingDate)],
                    ...(cert.trainingLocation ? [["AUSBILDUNGSORT", String(cert.trainingLocation).split("–")[0].trim()] as [string, string]] : []),
                    ...(cert.instructorName ? [["AUSBILDER", String(cert.instructorName)] as [string, string]] : []),
                    ["QUALIFIZIERUNG", qualificationShort(stufen)],
                ]
                : [
                    ["PRÜFUNGSDATUM", fmtD(cert.trainingDate)],
                    ...(cert.score !== undefined && cert.score !== null ? [["PRÜFUNGSERGEBNIS", `${cert.score} %`] as [string, string]] : []),
                    ["AUSBILDUNGSFORM", "Online"],
                    ["FAHRBERECHTIGUNG", "NEIN"],
                ];
            const factH = 38;
            doc.moveTo(M, y).lineTo(M + mainW, y).lineWidth(0.8).strokeColor(CERT.line).stroke();
            doc.moveTo(M, y + factH).lineTo(M + mainW, y + factH).stroke();
            const colW = mainW / facts.length;
            facts.forEach(([label, value], i) => {
                const x = M + i * colW;
                if (i > 0) doc.moveTo(x, y).lineTo(x, y + factH).stroke();
                const px = i > 0 ? x + 10 : x;
                doc.font("bold").fontSize(6.7).fillColor(CERT.muted).text(label, px, y + 8, { width: colW - 14, characterSpacing: 1.1, lineBreak: false });
                doc.font("bold").fontSize(11.2).fillColor(value === "NEIN" ? CERT.alert : CERT.ink).text(value, px, y + 19, { width: colW - 14, lineBreak: false, ellipsis: true });
            });
            y += factH + 7;

            // Pełne opisy stopni (treść prawna jak dotąd)
            if (stufen.length) {
                doc.font("reg").fontSize(7.4).fillColor(CERT.muted);
                stufen.forEach((s) => {
                    doc.text(STUFEN[s] || s, M, y, { width: mainW });
                    y = doc.y + 1;
                });
            }
            y += 10;

            // ── Program szkolenia (bez procentów) ───────────────────────────
            const rowH = 12.6;
            const list = (title: string, items: typeof TH, x: number, w: number, top: number, perCol = items.length, cols = 1) => {
                doc.font("bold").fontSize(7.2).fillColor(CERT.ink).text(title, x, top, { characterSpacing: 1.4, lineBreak: false });
                doc.font("semi").fontSize(7.2).fillColor(CERT.muted)
                    .text(`${items.length} THEMEN`, x, top, { width: cols * w + (cols - 1) * 22, align: "right", characterSpacing: 0.4 });
                items.forEach((it, i) => {
                    const c = Math.floor(i / perCol);
                    const cx = x + c * (w + 22);
                    const ry = top + 13 + (i % perCol) * rowH;
                    doc.font("bold").fontSize(7.7).fillColor(CERT.orange).text(`${it.n}.`, cx, ry + 2.5, { width: 14, lineBreak: false });
                    doc.font("reg").fontSize(7.7).fillColor(CERT.body).text(it.t, cx + 15, ry + 2.5, { width: w - 15, lineBreak: false, ellipsis: true });
                    doc.moveTo(cx, ry + rowH).lineTo(cx + w, ry + rowH).lineWidth(0.5).strokeColor("#efefef").stroke();
                });
            };
            const colGap = 22;
            const half = (mainW - colGap) / 2;
            if (isP) {
                list("THEORIE", TH, M, half, y);
                list("PRAXIS", PR, M + half + colGap, half, y);
            } else {
                list("THEORIE", TH, M, half, y, Math.ceil(TH.length / 2), 2);
            }

            // ── Kolumna boczna: zdjęcie + QR ────────────────────────────────
            let sy = isP ? bandH + 28 : bandH + 3.8 + 46 + 22;
            if (isP) {
                const pw = 97, ph = Math.round(pw * 45 / 35);
                const px = xSide + (sideW - pw) / 2;
                doc.save().roundedRect(px, sy, pw, ph, 4).clip();
                if (photoBuf) {
                    try { doc.image(photoBuf, px, sy, { cover: [pw, ph], align: "center", valign: "center" }); }
                    catch (e) { console.error("[Certificate] Foto konnte nicht eingebettet werden:", (e as Error).message); doc.rect(px, sy, pw, ph).fill("#eceae6"); }
                } else {
                    doc.rect(px, sy, pw, ph).fill("#eceae6");
                }
                doc.restore();
                sy += ph + 12;
            }
            const boxH = 148;
            doc.roundedRect(xSide, sy, sideW, boxH, 5).lineWidth(0.8).strokeColor(CERT.line).stroke();
            const qs = 88;
            doc.image(qrBuf, xSide + (sideW - qs) / 2, sy + 12, { width: qs, height: qs });
            doc.font("bold").fontSize(6.6).fillColor(CERT.muted)
                .text("ECHTHEIT PRÜFEN", xSide, sy + qs + 20, { width: sideW, align: "center", characterSpacing: 1.2 });
            const code = String(cert.verificationCode);
            doc.font("mono").fontSize(code.length > 14 ? 8.5 : 10.5).fillColor(CERT.ink)
                .text(code, xSide, sy + qs + 31, { width: sideW, align: "center", characterSpacing: 1 });
            doc.font("reg").fontSize(6.9).fillColor(CERT.muted)
                .text(`${siteHost()}/verify`, xSide, sy + qs + 45, { width: sideW, align: "center" });

            // ── Online: pasek „Hinweis” ─────────────────────────────────────
            const footY = H - 22;
            if (!isP) {
                const hY = H - 62 - 34, hH = 34;
                doc.roundedRect(M, hY, W - 2 * M, hH, 5).fillAndStroke(CERT.redBg, CERT.redLine);
                doc.roundedRect(M + 12, hY + 10, 52, 14, 7).fill("#b91c1c");
                doc.font("bold").fontSize(6.7).fillColor("#ffffff").text("HINWEIS", M + 12, hY + 13.5, { width: 52, align: "center", characterSpacing: 1 });
                doc.font("bold").fontSize(8.6).fillColor(CERT.red)
                    .text("Kein Fahrausweis. Dieser Nachweis berechtigt nicht zum selbstständigen Führen eines Flurförderzeugs. ", M + 76, hY + 7, { width: W - 2 * M - 90, continued: true, lineGap: 2 })
                    .font("reg").text("Für die Fahrberechtigung ist zusätzlich eine praktische Ausbildung mit Prüfung nach DGUV Grundsatz 308-001 erforderlich.");
            }

            // ── Stopka: podpisy + podstawa prawna ───────────────────────────
            const sigW = 143;
            [["Unterschrift Ausbilder", M], ["Stempel / Siegel", M + sigW + 25]].forEach(([label, x]) => {
                doc.moveTo(x as number, footY - 12).lineTo((x as number) + sigW, footY - 12).lineWidth(0.8).strokeColor("#bdbdbd").stroke();
                doc.font("reg").fontSize(6.7).fillColor(CERT.muted).text(label as string, x as number, footY - 8, { width: sigW, lineBreak: false });
            });
            doc.font("semi").fontSize(6.9).fillColor(CERT.ink)
                .text("DGUV Vorschrift 68 · DGUV Grundsatz 308-001", M, footY - 22, { width: W - 2 * M, align: "right" });
            doc.font("reg").fontSize(6.9).fillColor(CERT.muted)
                .text(`Ausgestellt am ${fmtD(cert.issuedAt || new Date())} · STAPLERO Ausbildungszentrum Görlitz`, M, footY - 11, { width: W - 2 * M, align: "right" });

            doc.end();
        } catch (e) { reject(e); }
    });
}

// ─── WALLET: wspólne dane obu kart ────────────────────────────────────────────

const API_URL = process.env.API_URL || "https://api.staplero.com";

const walletData = (cert: any) => {
    const isP = cert.type === "practical";
    const stufen: string[] = cert.stufen || (isP ? ["stufe1"] : []);
    return {
        verifyUrl: `${FRONTEND_URL}/verify/${cert.verificationCode}`,
        bannerUrl: `${API_URL}/api/certificates/wallet-banner/${cert.verificationCode}.png`,
        title: isP ? "Staplerschein" : "Theorienachweis",
        front: [
            { key: "certId", label: "Zertifikat-Nr.", value: cert.verificationCode },
            { key: "issued", label: "Ausgestellt", value: formatDateShort(cert.issuedAt) },
            isP
                ? { key: "location", label: "Ort", value: cert.trainingLocation ? String(cert.trainingLocation).split("–")[0].trim() : "STAPLERO" }
                : { key: "driving", label: "Fahrberechtigung", value: "NEIN – nur Theorie" },
            { key: "regulation", label: "Grundlage", value: "DGUV V68" },
        ],
        details: [
            { key: "courseName", label: "Kurs", value: cert.courseName },
            { key: "trainingDate", label: isP ? "Kursdatum" : "Prüfungsdatum", value: formatDateShort(cert.trainingDate) },
            ...(isP ? [{ key: "qualification", label: "Qualifizierung", value: stufen.map((s) => STUFEN[s] || s).join("\n") }] : []),
            ...(cert.instructorName ? [{ key: "instructor", label: "Ausbilder", value: cert.instructorName }] : []),
            ...(!isP ? [{ key: "notice", label: "KEINE FAHRBERECHTIGUNG", value: "Kein Fahrausweis. Dieser Nachweis berechtigt nicht zum Führen von Gabelstaplern oder anderen Flurförderzeugen. Dafür ist zusätzlich eine praktische Ausbildung mit Prüfung nach DGUV Grundsatz 308-001 nötig." }] : []),
            { key: "legal", label: "Rechtsgrundlage", value: "DGUV Vorschrift 68 · DGUV Grundsatz 308-001" },
            { key: "verify", label: "Echtheit prüfen", value: `${FRONTEND_URL}/verify/${cert.verificationCode}` },
            { key: "issuer", label: "Aussteller", value: "STAPLERO Ausbildungszentrum · Jakobstr. 13 · 02826 Görlitz" },
        ],
    };
};

// ─── WALLET BANNER (publiczny, pobiera go Google) ─────────────────────────────

export const getWalletBanner = async (req: Request, res: Response) => {
    try {
        const code = String(req.params.code || "").replace(/\.png$/i, "");
        const cert = await Certificate.findOne({ verificationCode: code }).lean();
        if (!cert || cert.revokedAt) return res.status(404).send("Nicht gefunden");
        const png = await buildWalletBanner(cert);
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.send(png);
    } catch (err: any) {
        console.error("Wallet banner error:", err);
        res.status(500).send("Fehler");
    }
};

// ─── APPLE WALLET ─────────────────────────────────────────────────────────────

export const getAppleWalletPass = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { certId } = req.params;
        if (!userId) return res.status(401).json({ message: "Nicht autorisiert" });

        const cert = await Certificate.findOne({ _id: certId, userId }).lean();
        if (!cert) return res.status(404).json({ message: "Zertifikat nicht gefunden" });
        if (cert.revokedAt) return res.status(410).json({ message: "Zertifikat widerrufen" });

        const certBase64 = process.env.APPLE_PASS_CERTIFICATE;
        const certPassword = process.env.APPLE_PASS_CERTIFICATE_PASSWORD || "";
        const keyBase64 = process.env.APPLE_PASS_KEY || certBase64;
        const wwdrBase64 = process.env.APPLE_WWDR_CERTIFICATE;
        const passTypeId = process.env.APPLE_PASS_TYPE_ID;
        const teamId = process.env.APPLE_TEAM_ID;

        if (!certBase64 || !wwdrBase64 || !passTypeId || !teamId) {
            return res.status(503).json({
                message: "Apple Wallet noch nicht konfiguriert.",
                setup: "Setzen Sie APPLE_PASS_CERTIFICATE, APPLE_PASS_KEY, APPLE_WWDR_CERTIFICATE, APPLE_PASS_TYPE_ID und APPLE_TEAM_ID in .env",
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PKPass } = require("passkit-generator");
        const d = walletData(cert);

        // storeCard: jedyny typ z banerem (strip) pod logo
        const passJson = {
            formatVersion: 1,
            passTypeIdentifier: passTypeId,
            serialNumber: cert.verificationCode,
            teamIdentifier: teamId,
            organizationName: "STAPLERO",
            description: `${d.title} – Befähigungsnachweis Gabelstapler`,
            logoText: "STAPLERO",
            backgroundColor: "rgb(33, 33, 33)",
            foregroundColor: "rgb(255, 255, 255)",
            labelColor: "rgb(168, 168, 168)",
            storeCard: {
                // Apple pozwala na maks. 4 pola secondary + auxiliary razem
                secondaryFields: [
                    { key: "holder", label: "INHABER", value: cert.userName },
                ],
                auxiliaryFields: d.front.slice(0, 3).map((f) => ({ key: f.key, label: f.label.toUpperCase(), value: f.value })),
                backFields: [
                    { key: "regulationFront", label: "Grundlage", value: "DGUV V68" },
                    ...d.details.map((f) => ({ key: f.key, label: f.label, value: f.value })),
                ],
            },
            barcodes: [{ message: d.verifyUrl, format: "PKBarcodeFormatQR", messageEncoding: "iso-8859-1", altText: cert.verificationCode }],
        };

        const stripSizes: Array<[string, number]> = [["strip.png", 375], ["strip@2x.png", 750], ["strip@3x.png", 1125]];
        const strips = await Promise.all(stripSizes.map(async ([n, w]) => [n, await buildWalletBanner(cert, w)] as const));
        const files: Record<string, Buffer> = { "pass.json": Buffer.from(JSON.stringify(passJson)) };
        for (const n of ["icon.png", "icon@2x.png", "icon@3x.png", "logo.png", "logo@2x.png", "logo@3x.png"]) {
            const b = readAsset("wallet", n);
            if (b) files[n] = b;
        }
        strips.forEach(([n, b]) => { files[n] = b; });

        const pass = new PKPass(files, {
            wwdr: Buffer.from(wwdrBase64, "base64"),
            signerCert: Buffer.from(certBase64, "base64"),
            signerKey: Buffer.from(keyBase64!, "base64"),
            signerKeyPassphrase: certPassword,
        });

        const passBuffer = pass.getAsBuffer();
        res.setHeader("Content-Type", "application/vnd.apple.pkpass");
        res.setHeader("Content-Disposition", `attachment; filename="Staplerschein-${cert.verificationCode}.pkpass"`);
        res.send(passBuffer);
    } catch (err: any) {
        console.error("Apple Wallet error:", err);
        res.status(500).json({ message: "Fehler beim Erstellen des Apple Wallet Passes", error: err.message });
    }
};

// ─── GOOGLE WALLET ────────────────────────────────────────────────────────────

export const buildGoogleGenericObject = (cert: any) => {
    const d = walletData(cert);
    const lang = (value: string) => ({ defaultValue: { language: "de-DE", value } });
    return {
        id: `${GOOGLE_ISSUER_ID}.${cert.verificationCode}`,
        classId: GOOGLE_CLASS_ID,
        genericType: "GENERIC_TYPE_UNSPECIFIED",
        hexBackgroundColor: "#212121",
        logo: { sourceUri: { uri: `${FRONTEND_URL}/logo-wallet.png` }, contentDescription: lang("STAPLERO") },
        cardTitle: lang("STAPLERO"),
        subheader: lang(cert.type === "practical" ? "Inhaber" : "Inhaber · keine Fahrberechtigung"),
        header: lang(cert.userName),
        // Pierwsze 4 moduły to siatka 2×2 na przodzie karty, reszta trafia do szczegółów
        textModulesData: [
            ...d.front.map((f) => ({ id: f.key, header: f.label, body: f.value })),
            ...d.details.filter((f) => f.key !== "verify").map((f) => ({ id: f.key, header: f.label, body: f.value })),
        ],
        heroImage: { sourceUri: { uri: d.bannerUrl }, contentDescription: lang(`${d.title} · ${cert.userName}`) },
        linksModuleData: { uris: [{ uri: d.verifyUrl, description: "Echtheit prüfen", id: "verify" }] },
        barcode: { type: "QR_CODE", value: d.verifyUrl, alternateText: cert.verificationCode },
        state: "ACTIVE",
    };
};

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

        const claims = {
            iss: GOOGLE_SERVICE_ACCOUNT.client_email,
            aud: "google",
            origins: [FRONTEND_URL],
            typ: "savetowallet",
            payload: { genericObjects: [buildGoogleGenericObject(cert)] },
        };
        const token = jwt.sign(claims, GOOGLE_SERVICE_ACCOUNT.private_key, { algorithm: "RS256" });
        res.json({ url: `https://pay.google.com/gp/v/save/${token}` });
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
            `attachment; filename="${cert.type === "practical" ? "Staplerschein" : "Theorienachweis"}-${cert.verificationCode}.pdf"`
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