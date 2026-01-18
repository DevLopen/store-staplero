export interface ProgressData {
    courseId: string;
    topics: Record<string, boolean>; // topicId => completed
}
