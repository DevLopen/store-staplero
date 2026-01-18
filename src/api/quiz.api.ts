export const fetchQuiz = async (chapterId: string) => {
    const res = await fetch(`/api/quiz/${chapterId}`);
    if (!res.ok) throw new Error("Fehler beim Laden des Quiz");
    return res.json();
};

export const submitQuizAPI = async (chapterId: string, answers: Record<string, string>) => {
    const res = await fetch(`/api/quiz/${chapterId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
    });
    if (!res.ok) throw new Error("Fehler beim Abschicken des Quiz");
    return res.json();
};
