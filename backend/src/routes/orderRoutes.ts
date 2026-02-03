import express from "express";
import { getAllOrders, getOrderById, updateOrderStatus } from "../controllers/orderController";
import { protect, admin } from "../middleware/authMiddleware";

const router = express.Router();

// ✅ Wszystkie routes wymagają autoryzacji (protect)
// ✅ getAllOrders automatycznie sprawdza czy user jest adminem i zwraca odpowiednie dane
router.get("/", protect, getAllOrders);

// ✅ Pojedyncze zamówienie - dostępne dla właściciela lub admina
router.get("/:id", protect, getOrderById);

// ✅ Aktualizacja statusu - tylko dla admina
router.put("/:id/status", protect, admin, updateOrderStatus);

export default router;