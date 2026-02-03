import express from "express";
import { register, login, me, getAllUsers } from "../controllers/authController";
import { protect, admin } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", me);

// ⚠️ NOWA ROUTE - wymaga autoryzacji i uprawnień admina
router.get("/users", protect, admin, getAllUsers);

export default router;