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

export interface MyCourse { id: string; slug: string; coverUrl?: string; title: LText; lessonCount: number; lessonsDone: number; lastLessonId: string | null; lastStep: number; expiresAt: string | null }
export interface CourseOutline {
    id: string; slug: string; coverUrl?: string; title: LText; description?: LText; expiresAt: string | null;
    chapters: { id: string; title: LText; description?: LText; lessons: { id: string; title: LText; durationMin?: number; stepCount: number }[] }[];
    progress: Record<string, { step: number; completed: boolean }>;
}

export const useMyCourses = () =>
    useQuery({ queryKey: ["learning", "my"], queryFn: () => req<MyCourse[]>("/my"), staleTime: 30_000 });

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

export const useSaveProgress = (courseId: string, lessonId: string) =>
    useMutation({
        mutationFn: (p: { step: number; completed?: boolean }) =>
            req(`/courses/${courseId}/lessons/${lessonId}/progress`, { method: "PUT", body: JSON.stringify(p) }),
    });
