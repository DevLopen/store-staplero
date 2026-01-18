import { useQuery } from "@tanstack/react-query";
import { fetchDashboard, mapDashboardCourses } from "@/api/dashboard.api";
import { DashboardCourse } from "@/types/dashboard";

export const useDashboard = () => {
    return useQuery<{ user: any; courses: DashboardCourse[]; orders: any[] }, Error>(
        ["dashboard"],
        async () => {
            const rawData = await fetchDashboard();

            const courses: DashboardCourse[] = mapDashboardCourses(
                rawData.courses,
                rawData.progress.topics,
                rawData.progress.quizzes
            );

            return {
                user: rawData.user,
                courses,
                orders: rawData.orders,
            };
        },
        {
            staleTime: 1000 * 60, // 1 minuta
        }
    );
};
