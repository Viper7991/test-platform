import { TestAttempt } from "./types";

const QUEUE_KEY = "pending_sync_attempts";

function getQueue(): TestAttempt[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function saveQueue(queue: TestAttempt[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueForSync(attempt: TestAttempt) {
  const queue = getQueue();
  queue.push(attempt);
  saveQueue(queue);
}

export function getPendingAttempts(): TestAttempt[] {
  return getQueue();
}

export async function trySyncQueue(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine) return;

  const queue = getQueue();
  if (queue.length === 0) return;

  const stillPending: TestAttempt[] = [];

  for (const attempt of queue) {
    try {
      const res = await fetch("/api/user/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: attempt.testId,
          mode: attempt.mode,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          autoSubmitted: attempt.autoSubmitted,
          answers: attempt.answers.map((a) => ({
            questionId: a.questionId,
            selected: a.selected,
            isCorrect: a.isCorrect,
          })),
          score: attempt.score,
          totalQuestions: attempt.totalQuestions,
          timeTakenSeconds: attempt.timeTakenSeconds,
        }),
      });
      if (!res.ok) stillPending.push(attempt); // 401 (logged out) or server error — keep for later
    } catch {
      stillPending.push(attempt); // network failure — keep for later
    }
  }

  saveQueue(stillPending);
}