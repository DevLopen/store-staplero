import express from "express";
import { protect, admin } from "../middleware/authMiddleware";
import {
    getCertificate,
    getMyCertificates,
    getPracticalCertificate,
    downloadCertificate,
    getAppleWalletPass,
    getGoogleWalletUrl,
    verifyCertificate,
    adminGetAllCertificates,
    adminRevokeCertificate,
    adminRestoreCertificate,
    adminDownloadCertificate,
    adminGetCertificateStats,
} from "../controllers/certificateController";

const router = express.Router();

// ── PUBLIC ────────────────────────────────────────────────────────────────────
// GET /api/certificates/verify/:code
router.get("/verify/:code", verifyCertificate);

// ── USER ──────────────────────────────────────────────────────────────────────
// GET /api/certificates/my             – all my certificates
router.get("/my", protect, getMyCertificates);

// GET /api/certificates/online/:courseId   – get/create online cert
router.get("/online/:courseId", protect, getCertificate);

// GET /api/certificates/practical/:participantId
router.get("/practical/:participantId", protect, getPracticalCertificate);

// GET /api/certificates/:certId/download  – PDF
router.get("/:certId/download", protect, downloadCertificate);

// GET /api/certificates/:certId/wallet/apple
router.get("/:certId/wallet/apple", protect, getAppleWalletPass);

// GET /api/certificates/:certId/wallet/google
router.get("/:certId/wallet/google", protect, getGoogleWalletUrl);

// ── ADMIN ─────────────────────────────────────────────────────────────────────
// GET  /api/certificates/admin/all
router.get("/admin/all", protect, admin, adminGetAllCertificates);

// GET  /api/certificates/admin/stats
router.get("/admin/stats", protect, admin, adminGetCertificateStats);

// POST /api/certificates/admin/:certId/revoke
router.post("/admin/:certId/revoke", protect, admin, adminRevokeCertificate);

// POST /api/certificates/admin/:certId/restore
router.post("/admin/:certId/restore", protect, admin, adminRestoreCertificate);

// GET  /api/certificates/admin/:certId/download
router.get("/admin/:certId/download", protect, admin, adminDownloadCertificate);

export default router;

// ── ADMIN DEMO SEED (remove in production if desired) ─────────────────────────
// POST /api/certificates/admin/seed-demo   → creates demo certs for admin preview
// DELETE /api/certificates/admin/seed-demo → removes demo certs
import { seedDemoCertificate, deleteDemoCertificates } from "../controllers/seedController";
router.post("/admin/seed-demo",   protect, admin, seedDemoCertificate);
router.delete("/admin/seed-demo", protect, admin, deleteDemoCertificates);