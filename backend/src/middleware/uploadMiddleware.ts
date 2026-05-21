import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIMETYPES = new Set([
  // Images
  "image/jpeg", "image/png", "image/gif", "image/webp",
  // 3D Models
  "model/gltf-binary", "model/gltf+json",
  "application/octet-stream", // .glb + niektóre MP4 gdy browser nie rozpozna
  // Video - rozszerzona lista bo różne systemy/przeglądarki różnie raportują
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",   // macOS / iPhone .mp4 i .mov
  "video/x-m4v",       // iTunes/Apple
  "video/x-mp4",       // starsze enkodery
  "video/x-msvideo",   // .avi
  "video/mpeg",        // .mpeg
  // Documents
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp",
  ".glb", ".gltf",
  ".mp4", ".webm", ".ogg", ".mov", ".m4v", ".avi", ".mpeg", ".mpg",
  ".pdf",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  // Akceptuj jeśli rozszerzenie jest znane LUB mimetype jest znany
  if (ALLOWED_EXTENSIONS.has(ext) || ALLOWED_MIMETYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Typ pliku niedozwolony: ${file.mimetype} (${ext})`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB
  },
});

// ─── Middleware opakowujące multer który zwraca czytelny JSON przy błędzie ─────
// Bez tego Express zwraca HTML 500 gdy multer odrzuci plik lub przekroczy limit

export function handleUploadErrors(
    req: Request,
    res: Response,
    next: NextFunction
) {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          message: `Plik za duży. Maksymalny rozmiar to 200 MB.`,
        });
      }
      return res.status(400).json({ message: `Błąd uploadu: ${err.message}` });
    }

    // fileFilter error (niedozwolony typ)
    if (err instanceof Error) {
      return res.status(415).json({ message: err.message });
    }

    next(err);
  });
}