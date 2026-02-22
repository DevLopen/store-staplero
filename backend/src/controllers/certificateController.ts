import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import Certificate from "../models/Certificate";
import Course from "../models/Course";
import QuizResult from "../models/QuizResult";
import { AuthRequest } from "../types";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

// ─── GET or Create Certificate ────────────────────────────────────────────────

export const getCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { courseId } = req.params;
    if (!userId) return res.status(401).json({ message: "Brak autoryzacji" });

    // Check if certificate already exists
    let cert = await Certificate.findOne({ userId, courseId }).lean();
    if (cert) return res.json(cert);

    // Verify final quiz passed
    const finalResult = await QuizResult.findOne({
      userId,
      courseId,
      isFinalQuiz: true,
      passed: true,
    });
    if (!finalResult)
      return res.status(403).json({ message: "Test końcowy nie został zaliczony" });

    const course = await Course.findById(courseId).lean();
    if (!course) return res.status(404).json({ message: "Kurs nie znaleziony" });
    if (!course.certificateEnabled)
      return res.status(403).json({ message: "Certyfikat nie jest dostępny dla tego kursu" });

    const user = req.user!;
    cert = await Certificate.create({
      userId,
      courseId,
      userName: user.name,
      courseName: course.title,
      score: finalResult.score,
    }).then(doc => doc.toObject());

    res.json(cert);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ─── GET Certificate PDF ──────────────────────────────────────────────────────

export const downloadCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { courseId } = req.params;
    if (!userId) return res.status(401).json({ message: "Brak autoryzacji" });

    const cert = await Certificate.findOne({ userId, courseId }).lean();
    if (!cert) return res.status(404).json({ message: "Certyfikat nie znaleziony" });

    const verifyUrl = `${FRONTEND_URL}/verify/${cert.verificationCode}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 120 });
    const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 40, bottom: 40, left: 60, right: 60 },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="certyfikat-${cert.verificationCode}.pdf"`
    );
    doc.pipe(res);

    // Background gradient-like
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0f172a");

    // Decorative border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(2)
        .stroke("#f59e0b");

    // Header
    doc.fontSize(11).fillColor("#f59e0b").font("Helvetica-Bold")
        .text("CERTYFIKAT UKOŃCZENIA KURSU", 0, 55, { align: "center" });

    // Main title
    doc.fontSize(36).fillColor("#ffffff").font("Helvetica-Bold")
        .text(cert.courseName, 0, 90, { align: "center" });

    // Recipient
    doc.moveDown(1.5);
    doc.fontSize(13).fillColor("#94a3b8").font("Helvetica")
        .text("Niniejszy certyfikat potwierdza, że", { align: "center" });

    doc.fontSize(28).fillColor("#f59e0b").font("Helvetica-Bold")
        .text(cert.userName, { align: "center" });

    doc.fontSize(13).fillColor("#94a3b8").font("Helvetica")
        .text(`pomyślnie ukończył(a) kurs z wynikiem ${cert.score}%`, { align: "center" });

    // Date
    const dateStr = new Date(cert.issuedAt).toLocaleDateString("pl-PL", {
      year: "numeric", month: "long", day: "numeric",
    });
    doc.moveDown(1);
    doc.fontSize(11).fillColor("#64748b").text(`Data wydania: ${dateStr}`, { align: "center" });

    // Verification code
    doc.fontSize(10).fillColor("#475569")
        .text(`Kod weryfikacyjny: ${cert.verificationCode}`, { align: "center" });

    // QR Code
    const qrX = doc.page.width - 140;
    const qrY = doc.page.height - 150;
    doc.image(qrBuffer, qrX, qrY, { width: 100 });
    doc.fontSize(8).fillColor("#64748b")
        .text("Weryfikuj certyfikat", qrX - 5, qrY + 104, { width: 110, align: "center" });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ─── GET Verify Certificate (public) ─────────────────────────────────────────

export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const cert = await Certificate.findOne({ verificationCode: code }).lean();
    if (!cert) return res.status(404).json({ valid: false, message: "Certyfikat nie znaleziony" });

    res.json({
      valid: true,
      userName: cert.userName,
      courseName: cert.courseName,
      score: cert.score,
      issuedAt: cert.issuedAt,
      verificationCode: cert.verificationCode,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};