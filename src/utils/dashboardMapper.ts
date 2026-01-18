import { DashboardCourse, DashboardChapter, DashboardTopic } from "../types/dashboard";

/**
 * Mapuje dane kursów z backendu na strukturę DashboardCourse dla frontend
 */
export const mapDashboardCourses = (
    courses: any[],
    topicProgress: { topicId: string; completed: boolean }[],
    quizResults: { chapterId?: string; quizId: string; passed: boolean }[]
): DashboardCourse[] => {
    return courses.map((course) => {
        let completedTopicsCount = 0;
        let totalTopicsCount = 0;

        const chapters: DashboardChapter[] = course.chapters.map((chapter: any, idx: number) => {
            const topics: DashboardTopic[] = chapter.topics.map((topic: any) => {
                const progress = topicProgress.find((p) => p.topicId === topic.id);
                const completed = progress?.completed ?? false;

                if (completed) completedTopicsCount += 1;
                totalTopicsCount += 1;

                return {
                    id: topic.id,
                    title: topic.title,
                    order: topic.order,
                    completed,
                    status: "available", // status będzie zmieniany poniżej
                };
            });

            // Procent ukończenia rozdziału
            const progressPercent = topics.length
                ? Math.round((topics.filter((t) => t.completed).length / topics.length) * 100)
                : 0;

            // Status rozdziału
            let status: "blocked" | "available" | "completed" = "available";

            if (idx > 0) {
                const prevChapter = course.chapters[idx - 1];
                const prevQuizPassed = quizResults.find((q) => q.chapterId === prevChapter.id)?.passed ?? true;
                const prevTopicsDone = prevChapter.topics.every((t: any) =>
                    topicProgress.find((p) => p.topicId === t.id)?.completed
                );

                if (!prevQuizPassed || !prevTopicsDone) status = "blocked";
            }

            if (progressPercent === 100) status = "completed";

            return {
                id: chapter.id,
                title: chapter.title,
                order: chapter.order,
                topics,
                status,
                progressPercent,
            };
        });

        const progressPercent = totalTopicsCount
            ? Math.round((completedTopicsCount / totalTopicsCount) * 100)
            : 0;

        return {
            id: course._id,
            title: course.title,
            description: course.description,
            chapters,
            progressPercent,
        };
    });
};
