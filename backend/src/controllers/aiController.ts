import { Request, Response } from "express";
import multer from "multer";
import { generateTopicContent, enhanceTopicContent } from "../services/openaiService";

interface AuthRequest extends Request {
    user?: {
        _id: string;
        email: string;
        name: string;
        isAdmin: boolean;
    };
}

// Multer configuration for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "text/plain",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png",
            "image/webp"
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Format nieobsługiwany. Dozwolone: TXT, PDF, DOCX, JPG, PNG, WEBP"));
        }
    }
});

export const uploadMiddleware = upload.array("files", 5); // max 5 files

export const generateContent = async (req: AuthRequest, res: Response) => {
    try {
        const { title, prompt, outputFormat } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!title) {
            return res.status(400).json({
                message: "Ein Titel ist erforderlich, um die KI zu steuern."
            });
        }

        const result = await generateTopicContent({
            title,
            prompt: prompt || "",
            files: files || [],
            language: "de",
            outputFormat: outputFormat || "markdown" // "markdown" or "blocks"
        });

        // If blocks format requested, return blocks array
        if (outputFormat === "blocks") {
            res.json({
                success: true,
                blocks: result.blocks || [],
                blocksGenerated: result.blocks?.length || 0,
                filesProcessed: files?.length || 0
            });
        } else {
            // Legacy markdown format
            res.json({
                success: true,
                content: result.content || result,
                filesProcessed: files?.length || 0
            });
        }
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
