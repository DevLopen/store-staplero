import { Chapter } from "@/types/course.types";
import { ProgressData } from "@/types/progress.types";

export const isChapterAccessible = (
    chapter: Chapter,
    progress: ProgressData | undefined,
    quizResults?: Record<string, { passed: boolean }>
) => {
    if (!chapter) return false;
    if (!chapter.quizRequired) return true;

    const result = quizResults?.[chapter.id];
    return result?.passed ?? false;
};

export const needsQuiz = (
    chapter: Chapter,
    progress: ProgressData | undefined,
    quizResults?: Record<string, { passed: boolean }>
) => {
    if (!chapter.quizRequired) return false;
    const result = quizResults?.[chapter.id];
    return !result?.passed;
};
