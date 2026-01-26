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
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "text/plain",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Nieunterstütztes Dateiformat. Nur TXT, PDF und DOCX erlaubt."));
        }
    }
});

export const uploadMiddleware = upload.array("files", 5); // max 5 plików

export const generateContent = async (req: AuthRequest, res: Response) => {
    try {
        const { title, prompt } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!title || !prompt) {
            return res.status(400).json({
                message: "Titel und Prompt sind erforderlich"
            });
        }

        // Wyciągnij tekst z uploadowanych plików
        const fileContents: string[] = [];
console.log(files);
        if (files && files.length > 0) {
            for (const file of files) {
                try {
                    const text = await extractTextFromFile(file.buffer, file.mimetype);
                    fileContents.push(`=== ${file.originalname} ===\n${text}`);
                } catch (err) {
                    console.error(`Fehler beim Extrahieren von ${file.originalname}:`, err);
                }
            }
        }

        // Generuj content z OpenAI
        const generatedContent = await generateTopicContent({
            title,
            prompt,
            fileContents,
            language: "de"
        });

        res.json({
            success: true,
            content: generatedContent,
            filesProcessed: fileContents.length
        });

    } catch (error: any) {
        console.error("AI Generation Error:", error);
        res.status(500).json({
            message: "Fehler bei der AI-Generierung",
            error: error.message
        });
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