"use client";

import { reportQuestion } from "@/lib/test-engine/reportQuestion";
import { useEffect, useState } from "react";
import { toggleMarkedQuestion, isQuestionMarked, pushMarkedToCloud } from "@/lib/test-engine/markedQuestions";

type Answer = {
  questionId: string;
  questionText: string;
  selected: string | null;
  correct: string;
  isCorrect: boolean;
  explanation?: string;
  options?: string[];
};

type Props = {
  answers: Answer[];
};

export default function AnswerReview({ answers }: Props) {
  const [filter, setFilter] = useState<"all" | "correct" | "wrong">("all");

  const filtered = answers.filter((a) => {
    if (filter === "correct") return a.isCorrect;
    if (filter === "wrong") return !a.isCorrect;
    return true;
  });

  async function handleReport(a: Answer) {
    const ok = await reportQuestion({
      questionId: a.questionId,
      questionText: a.questionText,
      options: a.options || [a.correct, a.selected || ""].filter(Boolean),
      correctAnswer: a.correct,
      selectedAnswer: a.selected,
      source: "review",
    });
    if (ok) alert("Thanks — this question has been reported.");
  }

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setIsLoggedIn(!!d.user));
    setStarredIds(new Set(answers.filter((a) => isQuestionMarked(a.questionId)).map((a) => a.questionId)));
  }, [answers]);

  async function handleToggleStar(questionId: string) {
    toggleMarkedQuestion(questionId);
    setStarredIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(questionId)) updated.delete(questionId);
      else updated.add(questionId);
      return updated;
    });
    if (isLoggedIn) {
      await pushMarkedToCloud();
    }
  }

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const wrongCount = answers.length - correctCount;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded text-sm border ${filter === "all" ? "bg-black text-white" : ""}`}
        >
          All ({answers.length})
        </button>
        <button
          onClick={() => setFilter("correct")}
          className={`px-3 py-1 rounded text-sm border ${filter === "correct" ? "bg-green-600 text-white" : "text-green-700"}`}
        >
          Correct ({correctCount})
        </button>
        <button
          onClick={() => setFilter("wrong")}
          className={`px-3 py-1 rounded text-sm border ${filter === "wrong" ? "bg-red-600 text-white" : "text-red-700"}`}
        >
          Wrong ({wrongCount})
        </button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm">No questions match this filter.</p>
        ) : (
          filtered.map((a, i) => (
            <div
              key={`${a.questionId}-${i}`}
              className={`border rounded p-4 ${a.isCorrect ? "border-green-300" : "border-red-300"}`}
            >
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium">{a.questionText}</p>
                <div className="flex flex-col md:flex-row items-center gap-1">
                  <button
                    onClick={() => handleToggleStar(a.questionId)}
                    className={`text-lg ${starredIds.has(a.questionId) ? "text-yellow-600" : "text-gray-400"}`}
                  >
                    {starredIds.has(a.questionId) ? "★" : "☆"}
                  </button>
                  <button onClick={() => handleReport(a)} className="text-sm text-gray-400 hover:text-red-600 shrink-0">
                    🚩
                  </button>
                </div>
              </div>
              <p className="text-sm mt-1">
                Your answer:{" "}
                <span className={a.isCorrect ? "text-green-500" : "text-red-600"}>
                  {a.selected || "(not answered)"}
                </span>
              </p>
              {!a.isCorrect && (
                <p className="text-sm text-green-500"><span className="font-bold">Correct answer:</span> {a.correct}</p>
              )}
              {a.explanation && (
                <p className="text-sm text-gray-300 mt-1 italic">{a.explanation}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}