import { ProgressData } from "@/types/progress.types";

export const getProgress = async (courseId: string) => {
    const res = await fetch(`/api/progress?courseId=${courseId}`, {
        credentials: "include",
    });
    if (!res.ok) throw new Error("Fehler beim Laden des Fortschritts");
    return res.json();
};

export const startTopic = async ({ chapterId, topicId }: { chapterId: string; topicId: string }) => {
    // jeśli nie potrzebne, można zostawić pustym lub do implementacji w przyszłości
    return null;
};

const API_BASE = "http://localhost:5000";

export const completeTopic = async ({ userId, topicId }: { userId?: string, topicId: string }) => {
    const token = localStorage.getItem("token"); // albo jak trzymasz JWT
    const res = await fetch(`${API_BASE}/api/progress/topic`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // <-- ważne
        },
        body: JSON.stringify({ topicId }),
    });

    if (!res.ok) throw new Error("Fehler beim Markieren des Themas als abgeschlossen");
    return res.json();
};
