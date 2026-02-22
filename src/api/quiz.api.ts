import apiFetch from "./http";

export const getChapterQuiz = (courseId: string, chapterId: string) =>
  apiFetch(`/courses/${courseId}/chapters/${chapterId}/quiz`);

export const submitChapterQuiz = (
  courseId: string,
  chapterId: string,
  answers: Record<string, unknown>
) =>
  apiFetch(`/courses/${courseId}/chapters/${chapterId}/quiz`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });

export const getFinalQuiz = (courseId: string) =>
  apiFetch(`/courses/${courseId}/final-quiz`);

export const submitFinalQuiz = (courseId: string, answers: Record<string, unknown>) =>
  apiFetch(`/courses/${courseId}/final-quiz`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
