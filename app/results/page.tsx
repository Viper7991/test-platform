"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TestAttempt } from "@/lib/test-engine/types";
import { getAttempts } from "@/lib/test-engine/attempts";

export default function ResultsPage() {
    const [attempt, setAttempt] = useState<TestAttempt | null>(null);
    const [history, setHistory] = useState<TestAttempt[]>([]);
    const [showReview, setShowReview] = useState(false);

    useEffect(() => {
        const raw = sessionStorage.getItem("lastAttempt");
        if (!raw) return;
        const parsed: TestAttempt = JSON.parse(raw);
        setAttempt(parsed);
        setHistory(getAttempts(parsed.mode));
    }, []);

    if (!attempt) {
        return (
            <div className="p-8">
                <p className="text-gray-600">No recent test result found.</p>
                <Link href="/" className="text-blue-600 hover:underline">Go home</Link>
            </div>
        );
    }

    const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
    const minutes = Math.floor(attempt.timeTakenSeconds / 60);
    const seconds = attempt.timeTakenSeconds % 60;

    // Past attempts for this same mode, excluding the current one, most recent first
    const pastAttempts = history
        .filter((a) => a.testId !== attempt.testId)
        .sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">Test Complete</h1>
            {attempt.autoSubmitted && (
                <p className="text-sm text-orange-600 mb-4">
                    Time expired — this test was auto-submitted.
                </p>
            )}

            <div className="border rounded-lg p-5 mb-6">
                <p className="text-3xl font-bold">
                    {attempt.score} / {attempt.totalQuestions}{" "}
                    <span className="text-lg text-gray-500">({percentage}%)</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                    Time taken: {minutes}m {seconds}s
                </p>
            </div>

            {pastAttempts.length > 0 && (
                <div className="border rounded-lg p-5 mb-6">
                    <h2 className="font-semibold mb-3">Past Attempts ({attempt.mode})</h2>
                    <ul className="space-y-1 text-sm">
                        {pastAttempts.slice(0, 5).map((a) => {
                            const pct = Math.round((a.score / a.totalQuestions) * 100);
                            return (
                                <li key={a.testId} className="flex justify-between">
                                    <span>{new Date(a.submittedAt || 0).toLocaleString()}</span>
                                    <span>{a.score}/{a.totalQuestions} ({pct}%)</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <button
                onClick={() => setShowReview((s) => !s)}
                className="mb-4 text-blue-600 hover:underline text-sm"
            >
                {showReview ? "Hide" : "Show"} Answer Review
            </button>

            {showReview && (
                <div className="space-y-3 mb-6">
                    {attempt.answers.map((a, i) => (
                        <div
                            key={a.questionId}
                            className={`border rounded p-4 ${a.isCorrect ? "border-green-300" : "border-red-300"}`}
                        >
                            <p className="font-medium">
                                {i + 1}. {a.questionText}
                            </p>
                            <p className="text-sm mt-1">
                                Your answer:{" "}
                                <span className={a.isCorrect ? "text-green-700" : "text-red-700"}>
                                    {a.selected || "(not answered)"}
                                </span>
                            </p>
                            {!a.isCorrect && (
                                <p className="text-sm text-green-700">Correct answer: {a.correct}</p>
                            )}
                            {a.explanation && (
                                <p className="text-sm text-gray-600 mt-1 italic">{a.explanation}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <Link href="/" className="inline-block bg-black text-white px-4 py-2 rounded">
                Back to Home
            </Link>
        </div>
    );
}