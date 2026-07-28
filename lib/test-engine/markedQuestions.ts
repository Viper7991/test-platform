const MARKED_KEY = "markedQuestions";

export function getMarkedQuestionIds(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(MARKED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function toggleMarkedQuestion(questionId: string): string[] {
  const current = getMarkedQuestionIds();
  const updated = current.includes(questionId)
    ? current.filter((id) => id !== questionId)
    : [...current, questionId];
  localStorage.setItem(MARKED_KEY, JSON.stringify(updated));
  return updated;
}

export function isQuestionMarked(questionId: string): boolean {
  return getMarkedQuestionIds().includes(questionId);
}