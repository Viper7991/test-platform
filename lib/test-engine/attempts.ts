import { TestAttempt } from "./types";

function keyFor(mode: string) {
  return `test_history:${mode}`;
}

export function saveAttempt(attempt: TestAttempt) {
  const key = keyFor(attempt.mode);
  const existing = getAttempts(attempt.mode);
  existing.push(attempt);
  localStorage.setItem(key, JSON.stringify(existing));
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