import { Request, Response } from "express";
import path from "path";
import fs from "fs";

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_MODEL_TYPES = [
  "model/gltf-binary",
  "model/gltf+json",
  "application/octet-stream", // .glb often arrives as this
];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];
const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];

// ─── Upload Single File ───────────────────────────────────────────────────────

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Brak pliku" });

    const file = req.file;
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;

    // Determine category by mimetype
    let category: "image" | "model3d" | "video" | "document" | "other" = "other";
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) category = "image";
    else if (ALLOWED_MODEL_TYPES.includes(file.mimetype) || file.originalname.endsWith(".glb") || file.originalname.endsWith(".gltf")) category = "model3d";
    else if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) category = "video";
    else if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) category = "document";

    res.status(201).json({
      url: fileUrl,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      category,
    });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err });
  }
};

// ─── Delete File ──────────────────────────────────────────────────────────────

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    // Safety: only allow filenames, no path traversal
    if (filename.includes("..") || filename.includes("/")) {
      return res.status(400).json({ message: "Nieprawidłowa nazwa pliku" });
    }

    const filePath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Plik nie znaleziony" });
    }

    fs.unlinkSync(filePath);
    res.json({ message: "Plik usunięty" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err });
  }
};
