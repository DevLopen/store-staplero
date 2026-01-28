import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface ChatResponse {
    response: string;
    timestamp: string;
}

export const sendChatMessage = async (
    message: string,
    conversationHistory: ChatMessage[]
): Promise<string> => {
    try {
        const response = await axios.post<ChatResponse>(
            `${API_BASE_URL}/chat`,
            {
                message,
                conversationHistory
            },
            {
                headers: {
                    "Content-Type": "application/json"
                },
                timeout: 30000 // 30 sekund timeout
            }
        );

        return response.data.response;
    } catch (error: any) {
        console.error("Chat API Error:", error);

        if (error.response) {
            // Błąd z serwera
            throw new Error(
                error.response.data?.error ||
                "Fehler bei der Kommunikation mit dem Server"
            );
        } else if (error.request) {
            // Brak odpowiedzi
            throw new Error("Keine Antwort vom Server. Bitte überprüfen Sie Ihre Internetverbindung.");
        } else {
            // Inny błąd
            throw new Error("Ein unerwarteter Fehler ist aufgetreten.");
        }
    }
};