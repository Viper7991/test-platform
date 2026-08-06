"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ScoreBarChart from "@/app/components/ScoreBarChart";
import AnswerReview from "@/app/components/AnswerReview";
import { formatModeLabel } from "@/lib/test-engine/formatMode";
import { useRouter } from 'next/navigation';
import { ArrowLeft02Icon } from 'hugeicons-react';
import Loading from '@/app/components/Loading';

export default function AttemptDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const [attempt, setAttempt] = useState<any>(null);
    const [categories, setCategories] = useState<{ _id: string; label: string }[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const [attemptRes, catRes] = await Promise.all([
                fetch(`/api/user/attempts/${id}`),
                fetch("/api/public/categories?subject=current-affairs"),
            ]);

            if (!attemptRes.ok) {
                setError("Couldn't load this attempt.");
                setLoading(false);
                return;
            }

            const attemptData = await attemptRes.json();
            const catData = await catRes.json();
            setAttempt(attemptData.attempt);
            setCategories(catData.categories || []);
            setLoading(false);
        }
        load();
    }, [id]);

    if (loading) {
        return <Loading />;
    }
    if (error) return <div className="p-8 text-red-600">{error}</div>;
    if (!attempt) return null;

    const correct = attempt.answers.filter((a: any) => a.isCorrect).length;
    const wrong = attempt.answers.length - correct;

    return (
        <div className="max-w-screen min-h-screen bg-white dark:bg-slate-900">
        <div className="p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => router.push('/history')}
                    aria-label="Back to History"
                    className="inline-flex items-center justify-center p-1.5 rounded-xl border border-white/40 text-white font-bold bg-transparent transition-all duration-300 ease-in-out hover:border-amber-200 hover:text-amber-200 hover:bg-amber-400/5 hover:shadow-[0_0_18px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                >
                    <ArrowLeft02Icon size={20} />
                </button>

                <h1 className="text-2xl font-bold text-white">
                    {formatModeLabel(attempt.mode, categories)}
                </h1>
            </div>

            <p className="text-sm text-gray-600 mb-6">
                {new Date(attempt.submittedAt).toLocaleString()}
                {attempt.reattemptOf && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                        ↻ Reattempt
                    </span>
                )}
            </p>

            <div className="border rounded-lg p-5 mb-6">
                <p className="text-2xl font-bold mb-4">
                    {attempt.score} / {attempt.totalQuestions}
                </p>
                <ScoreBarChart correct={correct} wrong={wrong} />
            </div>

            <AttemptQuestionDetail answers={attempt.answers} />
        </div>
        </div>
    );
}

// Fetches question text/explanation to enrich the lean stored answers before display
function AttemptQuestionDetail({ answers }: { answers: any[] }) {
    const [enriched, setEnriched] = useState<any[] | null>(null);

    useEffect(() => {
        async function enrich() {
            const res = await fetch("/api/public/questions?subject=current-affairs");
            const data = await res.json();
            const allQuestions = data.questions || [];

            const merged = answers.map((a) => {
                const q = allQuestions.find((q: any) => q._id === a.questionId);
                return {
                    questionId: a.questionId,
                    questionText: q?.questionText || "(question no longer available)",
                    selected: a.selected,
                    correct: q?.correctAnswer || "",
                    isCorrect: a.isCorrect,
                    explanation: q?.explanation,
                };
            });
            setEnriched(merged);
        }
        enrich();
    }, [answers]);

    if (!enriched) return <p className="text-gray-500 text-sm">Loading question details...</p>;

    return <AnswerReview answers={enriched} />;
}