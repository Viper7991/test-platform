"use client";

import { useEffect, useState } from "react";
import { generateMarkedTest } from "@/lib/test-engine/generateTest";
import { getMarkedQuestionIds } from "@/lib/test-engine/markedQuestions";
import TestRunner from "../TestRunner";
import { Question, PoolEntry } from "@/lib/test-engine/types";

export default function MarkedTestPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pool, setPool] = useState<PoolEntry[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(1800);
  const [questionIds, setQuestionIds] = useState<string[] | null>(null);

  useEffect(() => {
    async function load() {
      const [qRes, poolRes, subRes] = await Promise.all([
        fetch("/api/public/questions?subject=current-affairs"),
        fetch("/api/public/answer-pool"),
        fetch("/api/public/subject?name=current-affairs"),
      ]);
      const qData = await qRes.json();
      const poolData = await poolRes.json();
      const subData = await subRes.json();

      const allQuestions: Question[] = qData.questions || [];
      const markedIds = getMarkedQuestionIds();
      // Only test on marked questions that still actually exist (not deleted/deactivated)
      const validMarkedIds = markedIds.filter((id) =>
        allQuestions.some((q) => q._id === id)
      );

      setQuestions(allQuestions);
      setPool(poolData.entries || []);
      setTimerSeconds(subData.subject?.timerSeconds || 1800);
      setQuestionIds(generateMarkedTest(validMarkedIds));
    }
    load();
  }, []);

  if (questionIds === null) {
    return <div className="p-8 text-gray-500">Loading test...</div>;
  }

  if (questionIds.length === 0) {
    return (
      <div className="p-8">
        <p className="text-gray-600">You haven't marked any questions yet.</p>
      </div>
    );
  }

  return (
    <TestRunner
      mode="marked"
      questionIds={questionIds}
      allQuestions={questions}
      answerPool={pool}
      timerSeconds={timerSeconds}
    />
  );
}