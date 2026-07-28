import { TestAttempt } from "./types";

const MODE_PREFIX = "test_history:";

export function getAllAttempts(): TestAttempt[] {
  if (typeof window === "undefined") return [];
  const all: TestAttempt[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(MODE_PREFIX)) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          all.push(...JSON.parse(raw));
        } catch {
          // skip malformed entries
        }
      }
    }
  }

  return all;
}

export type CategoryStats = {
  category: string;
  attempted: number;
  correct: number;
  accuracy: number;
};

export function getCategoryBreakdown(): CategoryStats[] {
  const attempts = getAllAttempts();
  const map: Record<string, { attempted: number; correct: number }> = {};

  for (const attempt of attempts) {
    for (const answer of attempt.answers) {
      const cat = answer.topicCategory;
      if (!map[cat]) map[cat] = { attempted: 0, correct: 0 };
      map[cat].attempted += 1;
      if (answer.isCorrect) map[cat].correct += 1;
    }
  }

  return Object.entries(map)
    .map(([category, { attempted, correct }]) => ({
      category,
      attempted,
      correct,
      accuracy: Math.round((correct / attempted) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy); // weakest first
}

export function getOverallStats() {
  const attempts = getAllAttempts();
  const totalTests = attempts.length;
  const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
  const totalCorrect = attempts.reduce((sum, a) => sum + a.score, 0);

  return {
    totalTests,
    totalQuestions,
    overallAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
  };
}