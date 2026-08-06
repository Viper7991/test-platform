"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TestAttempt } from "@/lib/test-engine/types";
import { getAttempts } from "@/lib/test-engine/attempts";
import { formatModeLabel } from "@/lib/test-engine/formatMode";
import AnswerReview from "@/app/components/AnswerReview";
import ScoreBarChart from "@/app/components/ScoreBarChart";
import { useRouter } from 'next/navigation';
import { ArrowLeft02Icon } from 'hugeicons-react';

export default function ResultsPage() {
    const [attempt, setAttempt] = useState<TestAttempt | null>(null);
    const [history, setHistory] = useState<TestAttempt[]>([]);
    const [showReview, setShowReview] = useState(false);
    const router = useRouter();
    const [categories, setCategories] = useState<{ _id: string; label: string }[]>([]);

    useEffect(() => {
        const raw = sessionStorage.getItem("lastAttempt");
        if (!raw) return;
        const parsed: TestAttempt = JSON.parse(raw);
        setAttempt(parsed);
        setHistory(getAttempts(parsed.mode));
        fetch("/api/public/categories?subject=current-affairs")
            .then((r) => r.json())
            .then((d) => setCategories(d.categories || []));
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
        <div className="w-screen min-h-screen bg-white dark:bg-slate-900">
            <div className="p-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => router.push('/')}
                    aria-label="Back to Home"
                    className="inline-flex items-center justify-center px-2 py-1.5 rounded-xl border border-white/70 text-white font-bold bg-transparent transition-all duration-300 ease-in-out hover:border-amber-200 hover:text-amber-200 hover:bg-amber-400/5 hover:shadow-[0_0_18px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                >
                    <ArrowLeft02Icon size={20} />
                </button>
                <h1 className="text-2xl font-bold">Test Complete</h1>
                </div>
                {attempt.autoSubmitted && (
                    <p className="text-sm text-orange-600 mb-4">
                        Time expired — this test was auto-submitted.
                    </p>
                )}

                <div className="border rounded-lg p-5 mb-4">
                    <p className="text-3xl font-bold">
                        {attempt.score} / {attempt.totalQuestions}{" "}
                        <span className="text-lg text-gray-500">({percentage}%)</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                        Time taken: {minutes}m {seconds}s
                    </p>
                </div>
                <div className="mb-4">
                    <ScoreBarChart
                        correct={attempt.score}
                        wrong={attempt.totalQuestions - attempt.score}
                    />
                </div>

                {pastAttempts.length > 0 && (
                    <div className="border rounded-lg p-5 mb-6">
                        <h2 className="font-semibold mb-3">Past Attempts ({formatModeLabel(attempt.mode, categories)})</h2>
                        <ul className="space-y-1 text-sm">
                            {pastAttempts.slice(0, 5).map((a) => {
                                const pct = Math.round((a.score / a.totalQuestions) * 100);
                                return (
                                    <li key={a.testId} className="flex justify-between items-center">
                                        <span>
                                            {new Date(a.submittedAt || 0).toLocaleString()}
                                            {a.reattemptOf && (
                                                <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                                    ↻ Reattempt
                                                </span>
                                            )}
                                        </span>
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
                    {showReview && <AnswerReview answers={attempt.answers} />}
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
            </div>
        </div>
    );
}