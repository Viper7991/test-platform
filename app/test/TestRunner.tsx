"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { generateOptions } from "@/lib/test-engine/generateOptions";
import { toggleMarkedQuestion, isQuestionMarked } from "@/lib/test-engine/markedQuestions";
import { saveAttempt } from "@/lib/test-engine/attempts";
import { Question, PoolEntry, TestAttempt } from "@/lib/test-engine/types";
import { pushMarkedToCloud } from "@/lib/test-engine/markedQuestions";
import QuestionNavigator from "@/app/components/QuestionNavigator";

type Props = {
  mode: string; // "mixed" | "marked" | category label used as mode key
  reattemptOf?: string;
  questionIds: string[];
  allQuestions: Question[];
  answerPool: PoolEntry[];
  timerSeconds: number;
};

export default function TestRunner({ mode, reattemptOf, questionIds, allQuestions, answerPool, timerSeconds }: Props) {
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setIsLoggedIn(!!d.user));
  }, []);

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

  useEffect(() => {
    if (!currentQuestion) return;
    setVisitedIds((prev) => new Set(prev).add(currentQuestion._id));
  }, [currentQuestion]);

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
    if (isLoggedIn) {
      pushMarkedToCloud();
    }
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
      reattemptOf,
      startedAt,
      submittedAt: Date.now(),
      autoSubmitted,
      answers,
      score,
      totalQuestions: testQuestions.length,
      timeTakenSeconds,
    };

    saveAttempt(attempt, isLoggedIn);
    sessionStorage.setItem("lastAttempt", JSON.stringify(attempt));
    router.push("/results");
  }

  function jumpToQuestion(index: number) {
    setCurrentIndex(index);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="max-w-screen min-h-screen bg-white dark:bg-slate-900">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col xl:flex-row gap-6 lg:gap-20">
          <div className="flex-1 lg:w-2xl lg:min-w-2xl min-h-8 h-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-white/80">
                Question {currentIndex + 1} of {testQuestions.length}
              </span>
              <span className={`font-mono ${timeLeft < 60 ? "text-red-600" : ""}`}>
                {minutes}:{seconds.toString().padStart(2, "0")}
              </span>
            </div>

            <div className="border rounded-lg p-5 mb-4">
              <div className="flex justify-between items-start mb-3">
                <p className="font-medium text-[15px]">{currentQuestion.questionText}</p>
                <button
                  onClick={toggleMark}
                  className={`text-sm ml-3 shrink-0 ${markedIds.has(currentQuestion._id) ? "text-yellow-600" : "text-gray-400"}`}
                  title="Mark for later review"
                >
                  {markedIds.has(currentQuestion._id) ? "★ Marked" : "☆ Mark"}
                </button>
              </div>

              <div className="space-y-2 text-[14px]">
                {currentOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => selectAnswer(option)}
                    className={`w-full text-left border-2 rounded p-3 ${selectedAnswers[currentQuestion._id] === option
                      ? "border-amber-200 text-amber-200 bg-amber-100/20 shadow-[0_0_18px_rgba(251,191,36,1)] focus:outline-none focus:ring-2 focus:ring-amber-400/20"
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
          <div className="lg:w-160 xl:w-110 w-full shrink-0 xl:ml-10">
            <QuestionNavigator
              totalQuestions={testQuestions.length}
              currentIndex={currentIndex}
              visitedIds={visitedIds}
              answeredIds={new Set(Object.keys(selectedAnswers))}
              markedIds={markedIds}
              questionIds={testQuestions.map((q) => q._id)}
              onJump={jumpToQuestion}
            />
          </div>
        </div>
      </div>
    </div>
  );
}