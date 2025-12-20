import express from "express";
import { getCourses } from "../controllers/courseController";

const router = express.Router();

router.get("/", getCourses);

export default router;
