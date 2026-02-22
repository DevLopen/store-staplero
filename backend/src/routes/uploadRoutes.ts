import express from "express";
import { protect, admin } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";
import { uploadFile, deleteFile } from "../controllers/uploadController";

const router = express.Router();

// Only admins can upload / delete files
router.post("/",             protect, admin, upload.single("file"), uploadFile);
router.delete("/:filename",  protect, admin, deleteFile);

export default router;
