import express from "express";
import { getAllOrders, getOrderById, updateOrderStatus, syncOrderParticipants, resendOrderConfirmation } from "../controllers/orderController";
import { protect, admin } from "../middleware/authMiddleware";

const router = express.Router();

// ✅ Wszystkie routes wymagają autoryzacji (protect)
// ✅ getAllOrders automatycznie sprawdza czy user jest adminem i zwraca odpowiednie dane
router.get("/", protect, getAllOrders);

// ✅ Pojedyncze zamówienie - dostępne dla właściciela lub admina
router.get("/:id", protect, getOrderById);

// ✅ Aktualizacja statusu - tylko dla admina
router.put("/:id/status", protect, admin, updateOrderStatus);

// ✅ Dopisanie brakujących uczestników kursu praktycznego do opłaconego zamówienia - tylko admin
router.post("/:id/sync-participants", protect, admin, syncOrderParticipants);

// ✅ Ponowne wysłanie maila z informacjami o kursie - tylko admin
router.post("/:id/resend-confirmation", protect, admin, resendOrderConfirmation);

export default router;