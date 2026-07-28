import { drawFromBag } from "./bag";
import { shuffle } from "./shuffle";
import { TEST_LENGTH, MAX_PER_CATEGORY_MIXED } from "./config";

type Question = {
  _id: string;
  topicCategory: { _id: string; label: string };
  [key: string]: any;
};

export function generateTopicTest(categoryId: string, allQuestions: Question[]): string[] {
  const idsInCategory = allQuestions
    .filter((q) => q.topicCategory._id === categoryId)
    .map((q) => q._id);

  const key = `bag_state:topic:${categoryId}`;
  return drawFromBag(key, idsInCategory, TEST_LENGTH.topic);
}

export function generateMixedTest(allQuestions: Question[]): string[] {
  const categoryIds = [...new Set(allQuestions.map((q) => q.topicCategory._id))];
  const idsByCategory: Record<string, string[]> = {};
  for (const catId of categoryIds) {
    idsByCategory[catId] = allQuestions
      .filter((q) => q.topicCategory._id === catId)
      .map((q) => q._id);
  }

  const result: string[] = [];
  const countPerCategory: Record<string, number> = {};
  let cap = MAX_PER_CATEGORY_MIXED;
  let stuckRounds = 0;

  while (result.length < TEST_LENGTH.mixed && stuckRounds < 3) {
    const beforeCount = result.length;
    const shuffledCategories = shuffle(categoryIds);

    for (const catId of shuffledCategories) {
      if (result.length >= TEST_LENGTH.mixed) break;
      const drawnSoFar = countPerCategory[catId] || 0;
      if (drawnSoFar >= cap) continue;
      if (idsByCategory[catId].length === 0) continue;

      const key = `bag_state:mixed:${catId}`;
      const [id] = drawFromBag(key, idsByCategory[catId], 1);
      if (id) {
        result.push(id);
        countPerCategory[catId] = drawnSoFar + 1;
      }
    }

    if (result.length === beforeCount) {
      stuckRounds++;
      cap += 1; // relax the per-category cap if we're stuck (not enough categories to fill 50 at cap 5)
    } else {
      stuckRounds = 0;
    }
  }

  return result;
}

export function generateMarkedTest(markedIds: string[]): string[] {
  const key = "bag_state:marked";
  return drawFromBag(key, markedIds, TEST_LENGTH.marked);
}