/**
 * Pojedynczy temat (lekcja)
 */
export interface DashboardTopic {
    id: string;
    title: string;
    duration: string;
    order: number;
}

export interface DashboardQuiz {
    id: string;
    title: string;
    description?: string;
    passingScore: number;
}

export interface DashboardChapter {
    id: string;
    title: string;
    description: string;
    order: number;
    topics: DashboardTopic[];
    quiz?: DashboardQuiz;
    status?: "blocked" | "pending" | "complete";
}

export interface DashboardCourse {
    id: string;
    _id: string;
    title: string;
    description: string;
    chapters: DashboardChapter[];
    finalQuiz?: DashboardQuiz; // DODANE
}
