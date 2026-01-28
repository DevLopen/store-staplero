import { Request, Response } from "express";
import { generateChatResponse } from "../services/openaiService";

export const handleChatMessage = async (req: Request, res: Response) => {
    try {
        const { message, conversationHistory } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Nachricht ist erforderlich"
            });
        }

        // Generiere AI-Antwort
        const aiResponse = await generateChatResponse(
            message,
            conversationHistory || []
        );

        return res.status(200).json({
            response: aiResponse,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return res.status(500).json({
            error: "Fehler bei der Verarbeitung Ihrer Nachricht",
            details: error.message
        });
    }
};
