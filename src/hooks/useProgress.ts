import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProgress, startTopic, completeTopic } from "@/api/progress.api";
import { ProgressData } from "@/types/progress.types";

export const useProgress = (courseId?: string) => {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<ProgressData>({
        queryKey: ["progress", courseId],
        queryFn: () => getProgress(courseId!),
        enabled: !!courseId,
    });

    const startTopicMutation = useMutation({
        mutationFn: startTopic,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["progress", courseId],
            });
        },
    });

    const completeTopicMutation = useMutation({
        mutationFn: completeTopic,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["progress", courseId],
            });
        },
    });

    const markTopicComplete = async (_chapterId: string, topicId: string) => {
        await completeTopicMutation.mutateAsync({ topicId });
    };

    return {
        progress: data,
        isLoading,
        startTopic: startTopicMutation.mutateAsync,
        markTopicComplete,
    };
};
