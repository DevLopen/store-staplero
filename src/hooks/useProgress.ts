import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProgress, startTopic as apiStartTopic, completeTopic as apiCompleteTopic } from "@/api/progress.api";
import { ProgressData } from "@/types/progress.types";

export const useProgress = (courseId?: string) => {
  const queryClient = useQueryClient();
  const queryKey = ["progress", courseId];

  const { data, isLoading } = useQuery<ProgressData>({
    queryKey,
    queryFn: () => getProgress(courseId!),
    enabled: !!courseId,
    staleTime: 0, // always fresh
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const startMutation = useMutation({
    mutationFn: apiStartTopic,
    onSuccess: invalidate,
  });

  const completeMutation = useMutation({
    mutationFn: apiCompleteTopic,
    onSuccess: invalidate,
  });

  const startTopic = (chapterId: string, topicId: string) => {
    if (!courseId) return;
    startMutation.mutate({ courseId, chapterId, topicId });
  };

  const markTopicComplete = async (chapterId: string, topicId: string) => {
    if (!courseId) return;
    await completeMutation.mutateAsync({ courseId, chapterId, topicId });
  };

  return {
    progress: data,
    isLoading,
    startTopic,
    markTopicComplete,
    topics: data?.topics ?? {},
    quizzes: data?.quizzes ?? {},
    finalQuizzes: data?.finalQuizzes ?? {},
    lastPosition: data?.lastPosition ?? null,
  };
};
