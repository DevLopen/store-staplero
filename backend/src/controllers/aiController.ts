import { Request, Response } from "express";
import multer from "multer";
import { generateTopicContent, enhanceTopicContent, extractTextFromFile } from "../services/openaiService";

interface AuthRequest extends Request {
    user?: {
        _id: string;
        email: string;
        name: string;
        isAdmin: boolean;
    };
}

// Konfiguracja multer dla uploadów
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "text/plain", "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg", "image/png", "image/webp" // DODANO OBRAZY
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Format nieobsługiwany. Dozwolone: TXT, PDF, DOCX, JPG, PNG"));
        }
    }
});

export const uploadMiddleware = upload.array("files", 5); // max 5 plików

export const generateContent = async (req: AuthRequest, res: Response) => {
    try {
        const { title, prompt } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!title) {
            return res.status(400).json({
                message: "Ein Titel ist erforderlich, um die KI zu steuern."
            });
        }

        // Przekazujemy pełne obiekty plików do serwisu
        const generatedContent = await generateTopicContent({
            title,
            prompt: prompt || "",
            files: files || [], // Zmienione z fileContents
            language: "de"
        });

        res.json({
            success: true,
            content: generatedContent,
            filesProcessed: files?.length || 0
        });
    } catch (error: any) {
        res.status(500).json({ message: "Fehler bei der AI-Generierung", error: error.message });
    }
};

export const enhanceContent = async (req: AuthRequest, res: Response) => {
    try {
        const { existingContent, instructions } = req.body;

        if (!existingContent || !instructions) {
            return res.status(400).json({
                message: "Bestehender Inhalt und Anweisungen sind erforderlich"
            });
        }

        const enhancedContent = await enhanceTopicContent(existingContent, instructions);

        res.json({
            success: true,
            content: enhancedContent
        });

    } catch (error: any) {
        console.error("AI Enhancement Error:", error);
        res.status(500).json({
            message: "Fehler bei der AI-Verbesserung",
            error: error.message
        });
    }
};