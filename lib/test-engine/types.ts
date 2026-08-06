export type PoolEntry = { value: string; tags: string[] };

export type Question = {
  _id: string;
  questionText: string;
  topicCategory: { _id: string; label: string };
  requiredTags: string[];
  excludedTags?: string[];
  correctAnswer: string;
  explanation?: string;
};

export type TestAttempt = {
  testId: string;
  mode: "mixed" | "marked" | string; // string = category slug for topic mode
  reattemptOf?: string;
  startedAt: number;
  submittedAt: number | null;
  autoSubmitted: boolean;
  answers: {
    questionId: string;
    questionText: string;
    topicCategory: string;
    selected: string | null;
    correct: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
  score: number;
  totalQuestions: number;
  timeTakenSeconds: number;
};