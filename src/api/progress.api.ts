import apiFetch from "./http";
import { ProgressData } from "@/types/progress.types";

export const getProgress = (courseId: string): Promise<ProgressData> =>
  apiFetch(`/progress?courseId=${courseId}`);

export const startTopic = (data: { courseId: string; chapterId: string; topicId: string }) =>
  apiFetch("/progress/start", { method: "POST", body: JSON.stringify(data) });

export const completeTopic = (data: { courseId: string; chapterId: string; topicId: string }) =>
  apiFetch("/progress/complete", { method: "POST", body: JSON.stringify(data) });
