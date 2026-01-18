// ------------------------
// Typy lokalne
// ------------------------
export interface Topic {
    id: string;
    title: string;
    content?: string;
    duration?: string;
    videoUrl?: string | null;
    minDurationSeconds?: number | null;
    requireMinDuration?: boolean;
}

export interface QuizResult {
    passed: boolean;
}

export interface Quiz {
    id: string;
    chapterId?: string;
    title: string;
    description?: string;
    passingScore: number;
    isFinalQuiz?: boolean;
    questions: any[];
}

export interface Chapter {
    id: string;
    title: string;
    description?: string;
    order: number;
    topics: Topic[];
    quiz?: Quiz;
}

export interface Course {
    _id: string;
    title: string;
    description?: string;
    chapters: Chapter[];
    finalQuiz?: Quiz;
    progress?: Record<string, boolean>;
    quizResults?: Record<string, QuizResult>;
}

// ------------------------
// Funkcje
// ------------------------
export const isChapterComplete = (chapter: Chapter, progress: Record<string, boolean>): boolean => {
    if (!chapter) return false;
    if (!chapter.topics || chapter.topics.length === 0) return false;
    return chapter.topics.every(t => progress[t.id]);
};

export const isChapterAccessible = (chapter: Chapter, course: Course): boolean => {
    if (!course || !chapter) return true;

    const chapterIndex = course.chapters.findIndex(ch => ch.id === chapter.id);
    if (chapterIndex === -1) return false;
    if (chapterIndex === 0) return true;

    const prevChapter = course.chapters[chapterIndex - 1];
    const allPrevTopicsDone = prevChapter.topics.every(t => course.progress?.[t.id]);
    const quizPassed = prevChapter.quiz ? course.quizResults?.[prevChapter.id]?.passed : true;

    return allPrevTopicsDone && quizPassed;
};

export const needsQuiz = (chapter: Chapter, course: Course): boolean => {
    if (!chapter.quiz) return false;
    const chapterComplete = chapter.topics.every(t => course.progress?.[t.id]);
    const quizPassed = course.quizResults?.[chapter.id]?.passed;
    return chapterComplete && !quizPassed;
};


export const getFirstAccessibleTopic = (chapter: Chapter, progress: Record<string, boolean>): string | null => {
    for (const topic of chapter.topics) {
        if (!progress[topic.id]) return topic.id;
    }
    return chapter.topics[0]?.id || null;
};

// Final quiz dostępny, jeśli wszystkie rozdziały ukończone i nie zdany
export const isFinalQuizAvailable = (course: Course): boolean => {
    if (!course.finalQuiz) return false;
    const allChaptersComplete = course.chapters.every(ch => isChapterComplete(ch, course.progress || {}));
    const finalQuizPassed = course.quizResults?.["final-" + course._id]?.passed;
    return allChaptersComplete && !finalQuizPassed;
};
