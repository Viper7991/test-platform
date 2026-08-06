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

function setMarkedQuestionIds(ids: string[]) {
  localStorage.setItem(MARKED_KEY, JSON.stringify(ids));
}

export function toggleMarkedQuestion(questionId: string): string[] {
  const current = getMarkedQuestionIds();
  const updated = current.includes(questionId)
    ? current.filter((id) => id !== questionId)
    : [...current, questionId];
  setMarkedQuestionIds(updated);
  return updated;
}

export function isQuestionMarked(questionId: string): boolean {
  return getMarkedQuestionIds().includes(questionId);
}

// Cloud sync — only called when the user is logged in

export async function pushMarkedToCloud(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine) return;
  const questionIds = getMarkedQuestionIds();
  try {
    await fetch("/api/user/marked", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionIds }),
    });
  } catch {
    // offline or failed — local copy remains the source of truth for now, will retry on next toggle/load
  }
}

export async function pullMarkedFromCloud(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/user/marked");
    if (!res.ok) return; // not logged in, or offline
    const data = await res.json();
    const cloudIds: string[] = data.questionIds || [];

    // Merge cloud + local (union) so nothing marked offline gets lost on first sync
    const localIds = getMarkedQuestionIds();
    const merged = [...new Set([...localIds, ...cloudIds])];
    setMarkedQuestionIds(merged);
  } catch {
    // offline — local copy stays as-is
  }
}