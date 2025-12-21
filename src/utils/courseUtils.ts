// ------------------------
// Typy lokalne
// ------------------------
interface Topic {
    id: string;
    title: string;
    content?: string;
    duration?: string;
    videoUrl?: string | null;
    minDurationSeconds?: number | null;
    requireMinDuration?: boolean;
}

interface Chapter {
    id: string;
    title: string;
    description?: string;
    order: number;
    topics: Topic[];
    quiz?: any;
}

interface Course {
    _id: string;
    title: string;
    description?: string;
    chapters: Chapter[];
}

interface QuizResult {
    passed: boolean;
}

// ------------------------
// Funkcje
// ------------------------

export const getCourseProgress = (progress: Record<string, boolean>, course?: Course): number => {
    if (!course) return 0;
    const allTopics = course.chapters.flatMap(ch => ch.topics);
    if (allTopics.length === 0) return 0;
    const completed = allTopics.filter(t => progress[t.id]).length;
    return Math.round((completed / allTopics.length) * 100);
};

export const isChapterComplete = (chapterId: string, progress: Record<string, boolean>, course?: Course): boolean => {
    const chapter = course?.chapters.find(ch => ch.id === chapterId);
    if (!chapter) return false;
    if (chapter.topics.length === 0) return false;
    return chapter.topics.every(t => progress[t.id]);
};

export const isChapterAccessible = (
    chapterId: string,
    progress: Record<string, boolean>,
    quizResults: Record<string, QuizResult>,
    course?: Course
): boolean => {
    if (!course) return true;
    const chapterIndex = course.chapters.findIndex(ch => ch.id === chapterId);
    if (chapterIndex === -1) return false;
    if (chapterIndex === 0) return true;

    const prevChapter = course.chapters[chapterIndex - 1];
    const allPrevTopicsDone = prevChapter.topics.every(t => progress[t.id]);
    const quizPassed = prevChapter.quiz ? quizResults[prevChapter.id]?.passed : true;

    return allPrevTopicsDone && quizPassed;
};

export const isQuizPassed = (chapterId: string, quizResults: Record<string, QuizResult>): boolean => {
    return quizResults[chapterId]?.passed === true;
};

export const needsQuiz = (
    chapterId: string,
    progress: Record<string, boolean>,
    quizResults: Record<string, QuizResult>,
    course?: Course
): boolean => {
    const chapterComplete = isChapterComplete(chapterId, progress, course);
    const chapterQuizPassed = isQuizPassed(chapterId, quizResults);
    return chapterComplete && !chapterQuizPassed;
};

export const getFirstAccessibleTopic = (
    chapterId: string,
    progress: Record<string, boolean>,
    quizResults: Record<string, QuizResult>,
    course?: Course
): string | null => {
    const chapter = course?.chapters.find(ch => ch.id === chapterId);
    if (!chapter || chapter.topics.length === 0) return null;

    for (const topic of chapter.topics) {
        if (!progress[topic.id]) return topic.id;
    }
    return chapter.topics[0]?.id || null;
};
