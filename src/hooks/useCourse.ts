import { useQuery } from "@tanstack/react-query";
import { getCourse } from "@/api/course.api";
import { Course } from "@/types/course.types";

export const useCourse = (courseId?: string) => {
    const { data, isLoading, error } = useQuery<Course, Error>({
        queryKey: ["course", courseId],
        queryFn: () => getCourse(courseId!),
        enabled: !!courseId,
    });

    return {
        course: data,
        isLoading,
        error,
    };
};
