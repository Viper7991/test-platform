import { TestAttempt } from "./types";
import { enqueueForSync, trySyncQueue } from "./syncQueue";

function keyFor(mode: string) {
  return `test_history:${mode}`;
}

export function saveAttempt(attempt: TestAttempt, isLoggedIn: boolean) {
  // Always save locally first — this never fails, regardless of connection
  const key = keyFor(attempt.mode);
  const existing = getAttempts(attempt.mode);
  existing.push(attempt);
  localStorage.setItem(key, JSON.stringify(existing));

  // If logged in, also queue it for the cloud and try immediately
  if (isLoggedIn) {
    enqueueForSync(attempt);
    trySyncQueue();
  }
}

export function getAttempts(mode: string): TestAttempt[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(keyFor(mode));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}