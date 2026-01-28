import axios, { AxiosError } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface ChatResponse {
    response: string;
    timestamp: string;
}

interface ErrorResponse {
    error: string;
    retryAfter?: string;
    blockedUntil?: string;
}

export class RateLimitError extends Error {
    retryAfter?: string;

    constructor(message: string, retryAfter?: string) {
        super(message);
        this.name = "RateLimitError";
        this.retryAfter = retryAfter;
    }
}

export class SpamBlockError extends Error {
    blockedUntil?: string;

    constructor(message: string, blockedUntil?: string) {
        super(message);
        this.name = "SpamBlockError";
        this.blockedUntil = blockedUntil;
    }
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
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<ErrorResponse>;

            // Rate limit error (429)
            if (axiosError.response?.status === 429) {
                const errorData = axiosError.response.data;

                if (errorData.blockedUntil) {
                    // Permanent block
                    throw new SpamBlockError(
                        errorData.error || "Ihr Konto wurde vorübergehend gesperrt.",
                        errorData.blockedUntil
                    );
                } else {
                    // Rate limit
                    throw new RateLimitError(
                        errorData.error || "Zu viele Anfragen. Bitte warten Sie einen Moment.",
                        errorData.retryAfter
                    );
                }
            }

            // Bad request (400) - spam detection
            if (axiosError.response?.status === 400) {
                throw new Error(
                    axiosError.response.data?.error ||
                    "Ungültige Nachricht. Bitte überprüfen Sie Ihre Eingabe."
                );
            }

            // Server error (500)
            if (axiosError.response?.status === 500) {
                throw new Error(
                    "Serverfehler. Bitte versuchen Sie es später erneut."
                );
            }

            // Network error
            if (axiosError.request && !axiosError.response) {
                throw new Error(
                    "Keine Verbindung zum Server. Bitte überprüfen Sie Ihre Internetverbindung."
                );
            }
        }

        // Generic error
        throw new Error("Ein unerwarteter Fehler ist aufgetreten.");
    }
};

// Funkcja pomocnicza do formatowania czasu pozostałego do odblokowania
export const formatBlockedTime = (blockedUntil: string): string => {
    const now = new Date();
    const until = new Date(blockedUntil);
    const diffMs = until.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / 60000);

    if (diffMins <= 0) {
        return "Sie können es jetzt erneut versuchen";
    } else if (diffMins === 1) {
        return "Bitte warten Sie noch 1 Minute";
    } else if (diffMins < 60) {
        return `Bitte warten Sie noch ${diffMins} Minuten`;
    } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `Bitte warten Sie noch ${hours}h ${mins}min`;
    }
};