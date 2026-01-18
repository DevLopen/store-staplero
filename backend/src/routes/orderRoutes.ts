import express from "express";
import { getUserOrders } from "../controllers/orderController";

const router = express.Router();

router.get("/", getUserOrders);

export default router;
