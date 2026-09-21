import express from "express";
import { register, login, me, getAllUsers, forgotPassword, validateResetToken, resetPassword } from "../controllers/authController";
import { forgotPasswordRateLimiter, resetPasswordRateLimiter } from "../middleware/rateLimiter";
import { protect, admin } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", me);

// Reset hasła (publiczne, z limitami)
router.post("/forgot-password", forgotPasswordRateLimiter, forgotPassword);
router.get("/reset-password/:token", resetPasswordRateLimiter, validateResetToken);
router.post("/reset-password", resetPasswordRateLimiter, resetPassword);

// ⚠️ NOWA ROUTE - wymaga autoryzacji i uprawnień admina
router.get("/users", protect, admin, getAllUsers);

export default router;