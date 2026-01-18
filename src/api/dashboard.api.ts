import { apiFetch } from "./http.ts";
import { DashboardCourse } from "../types/dashboard.ts";

/* ======================
   AUTH / USER
====================== */

export const fetchMe = () => {
    return apiFetch<{
        user: {
            _id: string;
            name: string;
            email: string;
            isAdmin: boolean;
        };
    }>("/api/auth/me");
};

/* ======================
   COURSES
====================== */

export const fetchCourses = () => {
    return apiFetch<{
        courses: any[];
    }>("/api/courses");
};

export const fetchCourseById = (courseId: string) => {
    return apiFetch<any>(`/api/courses/${courseId}`);
};

/* ======================
   PROGRESS
====================== */

export const fetchUserProgress = (userId: string) => {
    return apiFetch<{
        topics: {
            topicId: string;
            completed: boolean;
        }[];
        quizzes: {
            chapterId?: string;
            quizId: string;
            passed: boolean;
            isFinalQuiz?: boolean;
        }[];
    }>(`/api/progress?userId=${userId}`);
};

/* ======================
   ORDERS
====================== */

export const fetchUserOrders = (email: string) => {
    return apiFetch<any[]>(`/api/orders?email=${email}`);
};

/**
 * Pobiera komplet danych dashboardu dla zalogowanego usera
 */
export const fetchDashboard = () => {
    return apiFetch<{
        user: { name: string; email: string; isAdmin: boolean };
        courses: any[];
        progress: {
            topics: { topicId: string; completed: boolean }[];
            quizzes: { chapterId?: string; quizId: string; passed: boolean; isFinalQuiz?: boolean }[];
        };
        orders: any[];
    }>("/dashboard");
};

/**
 * Mapper: Backend raw → UI-friendly DashboardCourse
 */
export const mapDashboardCourses = (
    coursesRaw: any[],
    progress: { topics: { topicId: string; completed: boolean }[]; quizzes: any[] }
): DashboardCourse[] => {
    return coursesRaw.map((course) => {
        let totalTopics = 0;
        let completedTopics = 0;

        const chapters = course.chapters.map((ch: any) => {
            const topics = ch.topics.map((t: any) => {
                totalTopics++;
                const completed = progress.topics.some((p) => p.topicId === t.id && p.completed);
                if (completed) completedTopics++;
                return {
                    id: t.id,
                    title: t.title,
                    order: t.order,
                    completed,
                    status: completed ? "completed" : "available",
                };
            });

            const chapterProgressPercent = topics.length
                ? Math.round((topics.filter((t) => t.completed).length / topics.length) * 100)
                : 0;

            const chapterStatus: "blocked" | "available" | "completed" =
                chapterProgressPercent === 100 ? "completed" : "available";

            return {
                id: ch.id,
                title: ch.title,
                order: ch.order,
                progressPercent: chapterProgressPercent,
                topics,
                status: chapterStatus,
            };
        });

        const courseProgressPercent = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

        return {
            id: course._id,
            title: course.title,
            description: course.description,
            chapters,
            progressPercent: courseProgressPercent,
        };
    });
};