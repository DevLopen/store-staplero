import { Request, Response } from "express";
import path from "path";
import fs from "fs";

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_MODEL_TYPES = [
  "model/gltf-binary",
  "model/gltf+json",
  "application/octet-stream",
];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];
const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];

function getCategory(mimetype: string, filename: string): "image" | "model3d" | "video" | "document" | "other" {
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) return "image";
  if (ALLOWED_MODEL_TYPES.includes(mimetype) || filename.endsWith(".glb") || filename.endsWith(".gltf")) return "model3d";
  if (ALLOWED_VIDEO_TYPES.includes(mimetype)) return "video";
  if (ALLOWED_DOCUMENT_TYPES.includes(mimetype)) return "document";
  return "other";
}

// ─── Upload Single File ───────────────────────────────────────────────────────

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Brak pliku" });

    const file = req.file;
    // Trust X-Forwarded-Proto in production (reverse proxy)
    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl = `${protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;

    const category = getCategory(file.mimetype, file.originalname);

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

// ─── List Files ───────────────────────────────────────────────────────────────

export const listFiles = async (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      return res.json({ files: [] });
    }

    const protocol = req.headers["x-forwarded-proto"] || req.protocol;
    const baseUrl = `${protocol}://${req.get("host")}`;

    // Filter by category if provided
    const { category } = req.query;

    const filenames = fs.readdirSync(UPLOADS_DIR).filter(f => {
      const filePath = path.join(UPLOADS_DIR, f);
      return fs.statSync(filePath).isFile();
    });

    const files = filenames
        .map(filename => {
          const filePath = path.join(UPLOADS_DIR, filename);
          const stat = fs.statSync(filePath);
          const ext = path.extname(filename).toLowerCase();

          // Guess mimetype from extension
          const mimeMap: Record<string, string> = {
            ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
            ".gif": "image/gif", ".webp": "image/webp",
            ".mp4": "video/mp4", ".webm": "video/webm", ".ogg": "video/ogg",
            ".glb": "model/gltf-binary", ".gltf": "model/gltf+json",
            ".pdf": "application/pdf",
          };
          const mimetype = mimeMap[ext] || "application/octet-stream";
          const fileCategory = getCategory(mimetype, filename);

          return {
            filename,
            url: `${baseUrl}/uploads/${filename}`,
            size: stat.size,
            category: fileCategory,
            mimetype,
            createdAt: stat.birthtime || stat.mtime,
          };
        })
        .filter(f => !category || f.category === category)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ files });
  } catch (err) {
    res.status(500).json({ message: "Błąd listowania plików", error: err });
  }
};

// ─── Delete File ──────────────────────────────────────────────────────────────

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
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