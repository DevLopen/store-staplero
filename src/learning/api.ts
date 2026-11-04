import { useMutation, useQuery } from "@tanstack/react-query";
import { API, authHeaders } from "@/components/dashboard/panelUtils";
import { Lesson, LText } from "./types";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
    const r = await fetch(`${API}/learning${path}`, { ...init, headers: { "Content-Type": "application/json", ...authHeaders(), ...(init?.headers ?? {}) } });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(body.message || `HTTP ${r.status}`), { status: r.status, body });
    return body as T;
}

export interface LessonResponse {
    courseId: string;
    courseTitle: LText;
    chapter: { id: string; title: LText };
    lesson: Lesson;
    prevLessonId: string | null;
    nextLessonId: string | null;
    progress: { step: number; completed: boolean };
}

export interface MyCourse {
    id: string; kind?: "bank"; slug: string; coverUrl?: string; title: LText; lessonCount: number; lessonsDone: number; lastLessonId: string | null; lastStep: number; expiresAt: string | null;
    /** tylko z ?all=1: zakup wygasł */
    expired?: boolean;
    /** katalog pytań: liczba zrobionych testów i ostatni wynik */
    testsDone?: number; lastTest?: { at: string; n: number; right: number; passed: boolean };
}
/** test modułu (gate) albo egzamin końcowy rozdziału — z GET /courses/:id */
export interface CourseTest { lessonId: string; kind: "gate" | "exam"; step: number; count: number; passPercent: number; minutes?: number }
export interface CourseOutline {
    id: string; slug: string; coverUrl?: string; title: LText; description?: LText; expiresAt: string | null;
    chapters: { id: string; title: LText; description?: LText; locked?: boolean; gateLessonId?: string | null; test?: CourseTest | null; lessons: { id: string; title: LText; durationMin?: number; stepCount: number }[] }[];
    progress: Record<string, { step: number; completed: boolean; passed?: boolean; score?: number; total?: number }>;
}

export const useMyCourses = (withExpired = false) =>
    useQuery({ queryKey: ["learning", "my", withExpired], queryFn: () => req<MyCourse[]>(withExpired ? "/my?all=1" : "/my"), staleTime: 30_000 });

export const useCourseOutline = (courseId: string, draft = false) =>
    useQuery({
        queryKey: ["learning", "course", courseId, draft],
        queryFn: () => req<CourseOutline>(`/courses/${courseId}${draft ? "?draft=1" : ""}`),
        retry: (n, e: any) => e?.status !== 403 && e?.status !== 404 && n < 2,
    });

export const useLesson = (courseId: string, lessonId: string, draft = false) =>
    useQuery({
        queryKey: ["learning", "lesson", courseId, lessonId, draft],
        queryFn: () => req<LessonResponse>(`/courses/${courseId}/lessons/${lessonId}${draft ? "?draft=1" : ""}`),
        staleTime: 60_000,
        retry: (n, e: any) => e?.status !== 403 && e?.status !== 404 && n < 2,
    });

export const submitCheck = (courseId: string, lessonId: string, answers: number[]) =>
    req<{ score: number; total: number; need: number; passed: boolean }>(`/courses/${courseId}/lessons/${lessonId}/check`, { method: "PUT", body: JSON.stringify({ answers }) });

export const useSaveProgress = (courseId: string, lessonId: string) =>
    useMutation({
        mutationFn: (p: { step: number; completed?: boolean }) =>
            req(`/courses/${courseId}/lessons/${lessonId}/progress`, { method: "PUT", body: JSON.stringify(p) }),
    });

/* ── katalog pytań (nauka z odpowiedziami) ── */
export interface BankMedia { type: "image" | "video"; src: string; name?: string }
export interface BankQuestion { id: string; topic: string; q: LText; o: LText[]; c: number[]; num?: number; unit?: string; media?: BankMedia; hidden?: boolean; wait?: string }
export interface BankTopic { key: string; title: LText }
export interface BankTestResult { at: string; n: number; right: number; passed: boolean; topic?: string }
export interface BankResponse { id: string; title: LText; description?: LText; topics: BankTopic[]; questions: BankQuestion[]; answers: Record<string, { ok: boolean; n: number }>; expiresAt: string | null; tests?: BankTestResult[]; passPercent?: number }
export const useBank = (bankId: string) =>
    useQuery({ queryKey: ["learning", "bank", bankId], queryFn: () => req<BankResponse>(`/banks/${bankId}`), retry: (n, e: any) => e?.status !== 403 && e?.status !== 404 && n < 2 });
export const answerBank = (bankId: string, qid: string, a: number) =>
    req<{ ok: boolean }>(`/banks/${bankId}/answers/${encodeURIComponent(qid)}`, { method: "PUT", body: JSON.stringify({ a }) });
export const submitBankTest = (bankId: string, answers: Record<string, number>, topic?: string) =>
    req<BankTestResult & { results: Record<string, boolean>; passPercent: number }>(`/banks/${bankId}/tests`, { method: "POST", body: JSON.stringify({ answers, topic }) });
export const resetBank = (bankId: string) => req<{ ok: boolean }>(`/banks/${bankId}/progress`, { method: "DELETE" });

export interface AdminBankSummary { id: string; slug: string; title: LText; count: number; active: number; updatedAt: string }
export interface AdminBank { id: string; slug: string; title: LText; topics: BankTopic[]; questions: BankQuestion[]; updatedAt: string }
export const adminBanks = () => req<AdminBankSummary[]>("/admin/banks");
export const adminBank = (bankId: string) => req<AdminBank>(`/admin/banks/${bankId}`);
export type BankQuestionInput = Omit<BankQuestion, "id"> & { kind: "single" | "multi" | "num" };
export const adminSaveQuestion = (bankId: string, qid: string | null, body: BankQuestionInput) =>
    req<BankQuestion>(`/admin/banks/${bankId}/questions${qid ? `/${encodeURIComponent(qid)}` : ""}`, { method: qid ? "PUT" : "POST", body: JSON.stringify(body) });
export const adminDeleteQuestion = (bankId: string, qid: string) =>
    req<{ ok: boolean }>(`/admin/banks/${bankId}/questions/${encodeURIComponent(qid)}`, { method: "DELETE" });
