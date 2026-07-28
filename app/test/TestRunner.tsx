"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { generateOptions } from "@/lib/test-engine/generateOptions";
import { toggleMarkedQuestion, isQuestionMarked } from "@/lib/test-engine/markedQuestions";
import { saveAttempt } from "@/lib/test-engine/attempts";
import { Question, PoolEntry, TestAttempt } from "@/lib/test-engine/types";

type Props = {
  mode: string; // "mixed" | "marked" | category label used as mode key
  questionIds: string[];
  allQuestions: Question[];
  answerPool: PoolEntry[];
  timerSeconds: number;
};

export default function TestRunner({ mode, questionIds, allQuestions, answerPool, timerSeconds }: Props) {
  const router = useRouter();

  const testQuestions = useMemo(() => {
    return questionIds
      .map((id) => allQuestions.find((q) => q._id === id))
      .filter(Boolean) as Question[];
  }, [questionIds, allQuestions]);

  // Pre-generate options once per question so they don't reshuffle on re-render
  const optionsByQuestion = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const q of testQuestions) {
      map[q._id] = generateOptions(q, answerPool);
    }
    return map;
  }, [testQuestions, answerPool]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [startedAt] = useState(() => Date.now());
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, submitted]);

  useEffect(() => {
    const initialMarked = new Set(testQuestions.filter((q) => isQuestionMarked(q._id)).map((q) => q._id));
    setMarkedIds(initialMarked);
  }, [testQuestions]);

  if (testQuestions.length === 0) {
    return <div className="p-8">No questions available for this test.</div>;
  }

  const currentQuestion = testQuestions[currentIndex];
  const currentOptions = optionsByQuestion[currentQuestion._id] || [];

  function selectAnswer(value: string) {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion._id]: value }));
  }

  function toggleMark() {
    toggleMarkedQuestion(currentQuestion._id);
    setMarkedIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(currentQuestion._id)) {
        updated.delete(currentQuestion._id);
      } else {
        updated.add(currentQuestion._id);
      }
      return updated;
    });
  }

  function goNext() {
    if (currentIndex < testQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  function handleSubmit(autoSubmitted = false) {
    if (submitted) return;
    setSubmitted(true);

    const answers = testQuestions.map((q) => {
      const selected = selectedAnswers[q._id] || null;
      return {
        questionId: q._id,
        questionText: q.questionText,
        topicCategory: q.topicCategory.label,
        selected,
        correct: q.correctAnswer,
        isCorrect: selected === q.correctAnswer,
        explanation: q.explanation,
      };
    });

    const score = answers.filter((a) => a.isCorrect).length;
    const timeTakenSeconds = Math.round((Date.now() - startedAt) / 1000);

    const attempt: TestAttempt = {
      testId: `${mode}-${Date.now()}`,
      mode,
      startedAt,
      submittedAt: Date.now(),
      autoSubmitted,
      answers,
      score,
      totalQuestions: testQuestions.length,
      timeTakenSeconds,
    };

    saveAttempt(attempt);
    sessionStorage.setItem("lastAttempt", JSON.stringify(attempt));
    router.push("/results");
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600">
          Question {currentIndex + 1} of {testQuestions.length}
        </span>
        <span className={`font-mono ${timeLeft < 60 ? "text-red-600" : ""}`}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>

      <div className="border rounded-lg p-5 mb-4">
        <div className="flex justify-between items-start mb-3">
          <p className="font-medium">{currentQuestion.questionText}</p>
          <button
            onClick={toggleMark}
            className={`text-sm ml-3 shrink-0 ${markedIds.has(currentQuestion._id) ? "text-yellow-600" : "text-gray-400"}`}
            title="Mark for later review"
          >
            {markedIds.has(currentQuestion._id) ? "★ Marked" : "☆ Mark"}
          </button>
        </div>

        <div className="space-y-2">
          {currentOptions.map((option) => (
            <button
              key={option}
              onClick={() => selectAnswer(option)}
              className={`w-full text-left border rounded p-3 ${
                selectedAnswers[currentQuestion._id] === option
                  ? "border-black bg-gray-100"
                  : "border-gray-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="px-4 py-2 border rounded disabled:opacity-40"
        >
          Previous
        </button>

        {currentIndex === testQuestions.length - 1 ? (
          <button
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Submit Test
          </button>
        ) : (
          <button
            onClick={goNext}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}