import express from "express";
import {
    getInvitation, registerFromInvitation, loginFromInvitation, forgotFromInvitation, claimFromInvitation,
} from "../controllers/invitationController";
import { protect } from "../middleware/authMiddleware";
import {
    invitationInfoRateLimiter, invitationActionRateLimiter, loginRateLimiter, registerRateLimiter, forgotPasswordRateLimiter,
} from "../middleware/rateLimiter";

// Zaproszenia na miejsca: /einladung/:token na stronie
const router = express.Router();

router.get("/:token", invitationInfoRateLimiter, getInvitation);
router.post("/:token/register", invitationActionRateLimiter, registerRateLimiter, registerFromInvitation);
router.post("/:token/login", invitationActionRateLimiter, loginRateLimiter, loginFromInvitation);
router.post("/:token/forgot", invitationActionRateLimiter, forgotPasswordRateLimiter, forgotFromInvitation);
router.post("/:token/claim", invitationActionRateLimiter, protect, claimFromInvitation);

export default router;
