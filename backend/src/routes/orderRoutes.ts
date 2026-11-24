import express from "express";
import {
    getAllOrders, getOrderById, updateOrderStatus, syncOrderParticipants, resendOrderConfirmation,
    getOrderSeatsForOwner, updateOwnedSeat, resendOwnedSeat, withdrawOwnedSeat,
    revokeOrderAccessAdmin, resetSeatAdmin,
} from "../controllers/orderController";
import { seatActionRateLimiter } from "../middleware/rateLimiter";
import { protect, admin } from "../middleware/authMiddleware";

const router = express.Router();

// ✅ Wszystkie routes wymagają autoryzacji (protect)
// ✅ getAllOrders automatycznie sprawdza czy user jest adminem i zwraca odpowiednie dane
router.get("/", protect, getAllOrders);

// ✅ Miejsca (OrderSeat) zamówienia - właściciel albo admin (bez hashy tokenów)
router.get("/:id/seats", protect, getOrderSeatsForOwner);
// ✅ Zmiany miejsc w panelu kupującego: e-mail / język / imię i nazwisko, ponowna wysyłka, cofnięcie
router.patch("/:id/seats/:seatId", seatActionRateLimiter, protect, updateOwnedSeat);
router.post("/:id/seats/:seatId/resend", seatActionRateLimiter, protect, resendOwnedSeat);
router.post("/:id/seats/:seatId/withdraw", seatActionRateLimiter, protect, withdrawOwnedSeat);

// ✅ Admin: zajęte miejsce z powrotem wolne (zmiana osoby tylko przez admina)
router.post("/:id/seats/:seatId/reset", protect, admin, resetSeatAdmin);
// ✅ Admin: ręczne odebranie wszystkich dostępów z zamówienia (zwroty właściciel robi sam w Stripe)
router.post("/:id/revoke-access", protect, admin, revokeOrderAccessAdmin);

// ✅ Pojedyncze zamówienie - dostępne dla właściciela lub admina
router.get("/:id", protect, getOrderById);

// ✅ Aktualizacja statusu - tylko dla admina
router.put("/:id/status", protect, admin, updateOrderStatus);

// ✅ Dopisanie brakujących uczestników kursu praktycznego do opłaconego zamówienia - tylko admin
router.post("/:id/sync-participants", protect, admin, syncOrderParticipants);

// ✅ Ponowne wysłanie maila z informacjami o kursie - tylko admin
router.post("/:id/resend-confirmation", protect, admin, resendOrderConfirmation);

export default router;