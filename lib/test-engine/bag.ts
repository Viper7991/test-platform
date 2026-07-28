import { shuffle } from "./shuffle";

type BagState = {
  bag: string[];
  usageCount: Record<string, number>;
};

function loadState(key: string): BagState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(key: string, state: BagState) {
  localStorage.setItem(key, JSON.stringify(state));
}

/**
 * Draws `count` question IDs from a bag scoped to `key`.
 * - First pass: every ID appears once before any repeats.
 * - When the bag empties, it reshuffles a fresh cycle automatically.
 * - Automatically syncs in any new question IDs (added by admin since last visit)
 *   and drops any IDs no longer in `allIds` (deleted/deactivated questions).
 */
export function drawFromBag(key: string, allIds: string[], count: number): string[] {
  let state = loadState(key);

  if (!state) {
    state = { bag: shuffle(allIds), usageCount: {} };
  } else {
    const knownIds = new Set([...state.bag, ...Object.keys(state.usageCount)]);
    const newIds = allIds.filter((id) => !knownIds.has(id));

    // Add newly-created questions into the bag so they get picked soon
    state.bag = [...state.bag, ...shuffle(newIds)];

    // Drop stale IDs (deleted or deactivated questions)
    const allIdsSet = new Set(allIds);
    state.bag = state.bag.filter((id) => allIdsSet.has(id));
    for (const id of Object.keys(state.usageCount)) {
      if (!allIdsSet.has(id)) delete state.usageCount[id];
    }
  }

  const drawn: string[] = [];
  for (let i = 0; i < count; i++) {
    if (allIds.length === 0) break; // nothing to draw from

    if (state.bag.length === 0) {
      state.bag = shuffle(allIds); // start a new cycle
    }

    const id = state.bag.shift() as string;
    drawn.push(id);
    state.usageCount[id] = (state.usageCount[id] || 0) + 1;
  }

  saveState(key, state);
  return drawn;
}