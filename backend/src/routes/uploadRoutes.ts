import express from "express";
import { protect, admin } from "../middleware/authMiddleware";
import { handleUploadErrors } from "../middleware/uploadMiddleware";
import { uploadFile, listFiles, deleteFile } from "../controllers/uploadController";

const router = express.Router();

router.get("/",              protect, admin, listFiles);
router.post("/",             protect, admin, handleUploadErrors, uploadFile);
router.delete("/:filename",  protect, admin, deleteFile);

export default router;