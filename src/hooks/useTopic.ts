import { useQuery } from "@tanstack/react-query";
import { fetchTopicContent } from "@/api/course.api";

export const useTopic = (courseId: string, chapterId: string, topicId: string) => {
    return useQuery(
        ["topic", courseId, chapterId, topicId],
        () => fetchTopicContent(courseId, chapterId, topicId),
        {
            staleTime: 1000 * 60 * 5, // 5 min
            cacheTime: 1000 * 60 * 60, // 1h
        }
    );
};
