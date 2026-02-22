import { Request, Response } from "express";
import { generateChatResponse, generateCourseAssistantResponse } from "../services/openaiService";

export const handleChatMessage = async (req: Request, res: Response) => {
    try {
        const { message, conversationHistory } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                error: "Nachricht ist erforderlich"
            });
        }

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

export const handleCourseAssistant = async (req: Request, res: Response) => {
    try {
        const { message, conversationHistory, context } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "Wiadomość jest wymagana" });
        }

        if (!context || !context.courseTitle || !context.chapterTitle) {
            return res.status(400).json({ error: "Kontekst kursu jest wymagany" });
        }

        const aiResponse = await generateCourseAssistantResponse(
            message,
            conversationHistory || [],
            context
        );

        return res.status(200).json({
            response: aiResponse,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("Course Assistant Error:", error);
        return res.status(500).json({
            error: "Błąd asystenta kursu",
            details: error.message
        });
    }
};