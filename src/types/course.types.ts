export interface Topic {
    id: string;
    order: number;
    title: string;
    duration?: number;
    videoUrl?: string;
    minDurationSeconds?: number;
}

export interface Chapter {
    id: string;
    order: number;
    title: string;
    description: string;
    quizRequired: boolean;
    topics: Topic[];
}

export interface Course {
    id: string;
    title: string;
    description: string;
    chapters: Chapter[];
}
