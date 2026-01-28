import { Request, Response, NextFunction } from "express";

// Store dla śledzenia suspicious activity
const suspiciousIPs = new Map<string, {
    count: number;
    firstSeen: Date;
    lastSeen: Date;
    messages: string[];
}>();

// Store dla tymczasowego blokowania
const blockedIPs = new Map<string, Date>();

interface SpamDetectionConfig {
    maxMessageLength: number;
    maxDuplicateMessages: number;
    maxSameMessageWindow: number; // w milisekundach
    minMessageInterval: number; // minimalna przerwa między wiadomościami (ms)
    blockDuration: number; // czas blokady (ms)
}

const config: SpamDetectionConfig = {
    maxMessageLength: 500,
    maxDuplicateMessages: 3,
    maxSameMessageWindow: 60000, // 1 minuta
    minMessageInterval: 1000, // 1 sekunda
    blockDuration: 30 * 60 * 1000 // 30 minut
};

// Czyszczenie starych wpisów co 5 minut
setInterval(() => {
    const now = Date.now();

    // Czyszczenie suspiciousIPs
    for (const [ip, data] of suspiciousIPs.entries()) {
        if (now - data.lastSeen.getTime() > 3600000) { // 1 godzina
            suspiciousIPs.delete(ip);
        }
    }

    // Czyszczenie blockedIPs
    for (const [ip, blockedUntil] of blockedIPs.entries()) {
        if (now > blockedUntil.getTime()) {
            blockedIPs.delete(ip);
        }
    }
}, 5 * 60 * 1000);

export const spamDetectionMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const { message } = req.body;
    const now = new Date();

    // 1. Sprawdź czy IP jest zablokowane
    const blockedUntil = blockedIPs.get(ip);
    if (blockedUntil && now < blockedUntil) {
        const minutesLeft = Math.ceil((blockedUntil.getTime() - now.getTime()) / 60000);
        return res.status(429).json({
            error: `Ihr Konto wurde vorübergehend gesperrt. Bitte versuchen Sie es in ${minutesLeft} Minuten erneut.`,
            blockedUntil: blockedUntil.toISOString()
        });
    }

    // 2. Sprawdź długość wiadomości
    if (message && message.length > config.maxMessageLength) {
        trackSuspiciousActivity(ip, "Zu lange Nachricht");
        return res.status(400).json({
            error: `Nachricht zu lang. Maximum ${config.maxMessageLength} Zeichen.`
        });
    }

    // 3. Sprawdź czy wiadomość nie jest pusta lub tylko spacje
    if (!message || message.trim().length === 0) {
        return res.status(400).json({
            error: "Nachricht darf nicht leer sein."
        });
    }

    // 4. Sprawdź duplikaty wiadomości
    const userData = suspiciousIPs.get(ip) || {
        count: 0,
        firstSeen: now,
        lastSeen: now,
        messages: []
    };

    // Filtruj tylko ostatnie wiadomości w oknie czasowym
    const recentMessages = userData.messages.filter((msg: string) => {
        // Założenie: wiadomości są w formacie "timestamp:message"
        const parts = msg.split(":");
        if (parts.length < 2) return false;
        const timestamp = parseInt(parts[0]);
        return (now.getTime() - timestamp) < config.maxSameMessageWindow;
    });

    const currentMessageKey = `${now.getTime()}:${message.trim().toLowerCase()}`;
    const duplicateCount = recentMessages.filter((msg: string) => {
        const msgContent = msg.split(":").slice(1).join(":");
        return msgContent === message.trim().toLowerCase();
    }).length;

    if (duplicateCount >= config.maxDuplicateMessages) {
        blockIP(ip, "Zu viele identische Nachrichten");
        return res.status(429).json({
            error: "Zu viele identische Nachrichten. Bitte warten Sie 30 Minuten."
        });
    }

    // 5. Sprawdź interval między wiadomościami
    if (recentMessages.length > 0) {
        const lastMessageTime = parseInt(recentMessages[recentMessages.length - 1].split(":")[0]);
        const timeSinceLastMessage = now.getTime() - lastMessageTime;

        if (timeSinceLastMessage < config.minMessageInterval) {
            trackSuspiciousActivity(ip, "Zu schnelle Nachrichten");
            return res.status(429).json({
                error: "Bitte warten Sie einen Moment zwischen den Nachrichten."
            });
        }
    }

    // 6. Sprawdź podejrzane wzorce (URLs, scripti, itp.)
    if (containsSuspiciousContent(message)) {
        trackSuspiciousActivity(ip, "Verdächtiger Inhalt");
        return res.status(400).json({
            error: "Nachricht enthält nicht erlaubten Inhalt."
        });
    }

    // Aktualizuj dane użytkownika
    userData.messages.push(currentMessageKey);
    userData.lastSeen = now;
    userData.messages = userData.messages.slice(-10); // Zachowaj tylko ostatnie 10
    suspiciousIPs.set(ip, userData);

    next();
};

// Funkcje pomocnicze
function trackSuspiciousActivity(ip: string, reason: string) {
    const data = suspiciousIPs.get(ip) || {
        count: 0,
        firstSeen: new Date(),
        lastSeen: new Date(),
        messages: []
    };

    data.count++;
    data.lastSeen = new Date();
    suspiciousIPs.set(ip, data);

    console.warn(`⚠️ Suspicious activity from ${ip}: ${reason} (count: ${data.count})`);

    // Automatyczna blokada po 5 suspicious activities
    if (data.count >= 5) {
        blockIP(ip, "Mehrfache verdächtige Aktivitäten");
    }
}

function blockIP(ip: string, reason: string) {
    const blockedUntil = new Date(Date.now() + config.blockDuration);
    blockedIPs.set(ip, blockedUntil);
    console.error(`🚫 IP blocked: ${ip} - Reason: ${reason} - Until: ${blockedUntil.toISOString()}`);
}

function containsSuspiciousContent(message: string): boolean {
    const suspiciousPatterns = [
        // URLs
        /https?:\/\//gi,
        /www\./gi,

        // Potencjalne script injection
        /<script/gi,
        /javascript:/gi,
        /on\w+\s*=/gi, // onclick=, onload=, etc.

        // SQL injection
        /(\bor\b|\band\b).*=.*('|")/gi,
        /union.*select/gi,
        /drop.*table/gi,

        // Nadmierne powtórzenia znaków
        /(.)\1{10,}/g, // ten sam znak 10+ razy

        // Spam keywords (możesz dodać więcej)
        /viagra|casino|poker|lottery/gi,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(message));
}

// Export konfiguracji dla testów
export const getSpamConfig = () => config;
export const updateSpamConfig = (newConfig: Partial<SpamDetectionConfig>) => {
    Object.assign(config, newConfig);
};

// Funkcja do manualnego odblokowania IP (dla adminów)
export const unblockIP = (ip: string): boolean => {
    return blockedIPs.delete(ip);
};

// Funkcja do sprawdzenia statusu IP
export const getIPStatus = (ip: string) => {
    return {
        blocked: blockedIPs.has(ip),
        blockedUntil: blockedIPs.get(ip),
        suspicious: suspiciousIPs.has(ip),
        suspiciousData: suspiciousIPs.get(ip)
    };
};
