"use client";

import { useEffect, useState } from "react";
import { generateMixedTest } from "@/lib/test-engine/generateTest";
import TestRunner from "../TestRunner";
import { Question, PoolEntry } from "@/lib/test-engine/types";

export default function MixedTestPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pool, setPool] = useState<PoolEntry[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(3000);
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

      setQuestions(qData.questions || []);
      setPool(poolData.entries || []);
      setTimerSeconds(subData.subject?.timerSeconds || 3000);
      setQuestionIds(generateMixedTest(qData.questions || []));
    }
    load();
  }, []);

  if (questionIds === null) {
    return <div className="p-8 text-gray-500">Loading test...</div>;
  }

  return (
    <TestRunner
      mode="mixed"
      questionIds={questionIds}
      allQuestions={questions}
      answerPool={pool}
      timerSeconds={timerSeconds}
    />
  );
}