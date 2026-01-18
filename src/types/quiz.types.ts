export interface QuizResult {
    passed: boolean;
    score: number;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
}
