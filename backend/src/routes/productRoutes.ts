import express from "express";
import {
  getPublicProducts,
  getPublicProductBySlug,
  adminGetProducts,
  adminGetProductById,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from "../controllers/productController";
import {
  createNotifyRequest,
  adminListNotifyRequests,
  adminDeleteNotifyRequest,
  adminMarkNotifyRequestDone,
} from "../controllers/notifyRequestController";
import { protect, admin } from "../middleware/authMiddleware";
import { notifyRequestRateLimiter } from "../middleware/rateLimiter";

const router = express.Router();

// ── ADMIN: Notify requests (musi być PRZED "/admin/:productId", inaczej zostanie przechwycone) ──
router.get("/admin/notify-requests", protect, admin, adminListNotifyRequests);
router.put("/admin/notify-requests/:id/notified", protect, admin, adminMarkNotifyRequestDone);
router.delete("/admin/notify-requests/:id", protect, admin, adminDeleteNotifyRequest);

// ── ADMIN: Product CRUD ────────────────────────────────────────────────────────
router.get("/admin", protect, admin, adminGetProducts);
router.post("/admin", protect, admin, adminCreateProduct);
router.get("/admin/:productId", protect, admin, adminGetProductById);
router.put("/admin/:productId", protect, admin, adminUpdateProduct);
router.delete("/admin/:productId", protect, admin, adminDeleteProduct);

// ── PUBLIC: Product listing & detail ───────────────────────────────────────────
router.get("/", getPublicProducts);
router.post("/:slug/notify", notifyRequestRateLimiter, createNotifyRequest);
router.get("/:slug", getPublicProductBySlug);

export default router;
