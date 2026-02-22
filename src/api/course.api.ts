import apiFetch from "./http";
import { Course } from "@/types/course.types";

const base = "/courses";

// ── User endpoints ─────────────────────────────────────────────────────────────
export const getCourse = (courseId: string): Promise<Course> =>
  apiFetch(`${base}/${courseId}`);

export const getChapter = (courseId: string, chapterId: string) =>
  apiFetch(`${base}/${courseId}/chapters/${chapterId}`);

export const getTopic = (courseId: string, chapterId: string, topicId: string) =>
  apiFetch(`${base}/${courseId}/chapters/${chapterId}/topics/${topicId}`);

// ── Admin endpoints ────────────────────────────────────────────────────────────
export const adminGetCourses = (): Promise<{ courses: Course[] }> =>
  apiFetch(`${base}/admin`);

export const adminGetCourse = (courseId: string): Promise<Course> =>
  apiFetch(`${base}/admin/${courseId}`);

export const adminCreateCourse = (data: {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  certificateEnabled?: boolean;
}): Promise<Course> =>
  apiFetch(`${base}/admin`, { method: "POST", body: JSON.stringify(data) });

export const adminUpdateCourse = (courseId: string, data: Partial<Course>): Promise<Course> =>
  apiFetch(`${base}/admin/${courseId}`, { method: "PUT", body: JSON.stringify(data) });

export const adminDeleteCourse = (courseId: string): Promise<void> =>
  apiFetch(`${base}/admin/${courseId}`, { method: "DELETE" });

// Chapters
export const adminAddChapter = (courseId: string, data: { title: string; description?: string }) =>
  apiFetch(`${base}/admin/${courseId}/chapters`, { method: "POST", body: JSON.stringify(data) });

export const adminUpdateChapter = (courseId: string, chapterId: string, data: { title?: string; description?: string; order?: number }) =>
  apiFetch(`${base}/admin/${courseId}/chapters/${chapterId}`, { method: "PUT", body: JSON.stringify(data) });

export const adminReorderChapters = (courseId: string, order: string[]) =>
  apiFetch(`${base}/admin/${courseId}/chapters/reorder`, { method: "PUT", body: JSON.stringify({ order }) });

export const adminDeleteChapter = (courseId: string, chapterId: string) =>
  apiFetch(`${base}/admin/${courseId}/chapters/${chapterId}`, { method: "DELETE" });

// Topics
export const adminAddTopic = (courseId: string, chapterId: string, data: { title: string; duration?: string; blocks?: any[] }) =>
  apiFetch(`${base}/admin/${courseId}/chapters/${chapterId}/topics`, { method: "POST", body: JSON.stringify(data) });

export const adminUpdateTopic = (courseId: string, chapterId: string, topicId: string, data: { title?: string; duration?: string; blocks?: any[]; order?: number }) =>
  apiFetch(`${base}/admin/${courseId}/chapters/${chapterId}/topics/${topicId}`, { method: "PUT", body: JSON.stringify(data) });

export const adminReorderTopics = (courseId: string, chapterId: string, order: string[]) =>
  apiFetch(`${base}/admin/${courseId}/chapters/${chapterId}/topics/reorder`, { method: "PUT", body: JSON.stringify({ order }) });

export const adminDeleteTopic = (courseId: string, chapterId: string, topicId: string) =>
  apiFetch(`${base}/admin/${courseId}/chapters/${chapterId}/topics/${topicId}`, { method: "DELETE" });

// Quizzes
export const adminSaveQuiz = (courseId: string, chapterId: string, data: any) =>
  apiFetch(`${base}/admin/${courseId}/quizzes/${chapterId}`, { method: "POST", body: JSON.stringify(data) });

export const adminDeleteQuiz = (courseId: string, chapterId: string) =>
  apiFetch(`${base}/admin/${courseId}/quizzes/${chapterId}`, { method: "DELETE" });
