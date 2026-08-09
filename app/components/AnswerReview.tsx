"use client";

import { useState } from "react";

type Answer = {
  questionId: string;
  questionText: string;
  selected: string | null;
  correct: string;
  isCorrect: boolean;
  explanation?: string;
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
              <p className="font-medium">{a.questionText}</p>
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