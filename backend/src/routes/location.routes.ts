import express from "express";
import { getAllLocations, createLocation, updateLocation, deleteLocation } from "../controllers/locationController";
import { protect, admin } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", getAllLocations);
router.post("/", protect, admin, createLocation);
router.put("/:id", protect, admin, updateLocation);
router.delete("/:id", protect, admin, deleteLocation);

export default router;