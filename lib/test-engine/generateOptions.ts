import { shuffle } from "./shuffle";
import { OPTIONS_PER_QUESTION } from "./config";

type PoolEntry = { value: string; tags: string[] };
type QuestionLike = {
  requiredTags: string[];
  excludedTags?: string[];
  correctAnswer: string;
};

export function generateOptions(question: QuestionLike, answerPool: PoolEntry[]): string[] {
  const wrongCandidates = answerPool.filter((entry) => {
    const hasAllRequired = question.requiredTags.every((t) => entry.tags.includes(t));
    const hasNoExcluded = !(question.excludedTags || []).some((t) => entry.tags.includes(t));
    const isNotCorrectAnswer = entry.value !== question.correctAnswer;
    return hasAllRequired && hasNoExcluded && isNotCorrectAnswer;
  });

  const wrongOptions = shuffle(wrongCandidates)
    .slice(0, OPTIONS_PER_QUESTION - 1)
    .map((e) => e.value);

  return shuffle([question.correctAnswer, ...wrongOptions]);
}