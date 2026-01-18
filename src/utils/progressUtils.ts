import { Course } from "@/types/course.types";
import { ProgressData } from "@/types/progress.types";

export const isTopicAccessible = (
    chapterId: string,
    topicId: string,
    course: Course,
    progress: ProgressData
) => {
    return true;
    const chapterIndex = course.chapters.findIndex(ch => ch.id === chapterId);
    if (chapterIndex === -1) return false;

    const chapter = course.chapters[chapterIndex];
    const topicIndex = chapter.topics.findIndex(t => t.id === topicId);
    if (topicIndex === -1) return false;

    // 1️⃣ Pierwszy rozdział i pierwszy temat → dostępne
    if (chapterIndex === 0 && topicIndex === 0) return true;

    // 2️⃣ Sprawdź poprzedni temat w tym rozdziale
    if (topicIndex > 0) {
        const prevTopic = chapter.topics[topicIndex - 1];
        if (!progress.topics[prevTopic.id]) return false;
    } else if (chapterIndex > 0) {
        // 3️⃣ Pierwszy temat w rozdziale, sprawdź czy poprzedni rozdział jest ukończony
        const prevChapter = course.chapters[chapterIndex - 1];
        const allPrevTopicsCompleted = prevChapter.topics.every(
            t => progress.topics[t.id]
        );
        if (!allPrevTopicsCompleted) return false;
    }

    return true;
};
