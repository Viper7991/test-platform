"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatModeLabel } from "@/lib/test-engine/formatMode";
import { useRouter } from 'next/navigation';
import { ArrowLeft02Icon } from 'hugeicons-react';
import Loading from '@/app/components/Loading';

type Attempt = {
    _id: string;
    testId: string;
    mode: string;
    reattemptOf?: string;
    score: number;
    totalQuestions: number;
    submittedAt: number;
    answers: { questionId: string }[];
};

export default function HistoryPage() {
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(true);
    const [categories, setCategories] = useState<{ _id: string; label: string }[]>([]);
    const router = useRouter();

    useEffect(() => {
        async function load() {
            const res = await fetch("/api/user/attempts");
            if (res.status === 401) {
                setLoggedIn(false);
                setLoading(false);
                return;
            }
            const data = await res.json();
            setAttempts(data.attempts || []);
            setLoading(false);
            const catRes = await fetch("/api/public/categories?subject=current-affairs");
            const catData = await catRes.json();
            setCategories(catData.categories || []);
        }
        load();
    }, []);

    if (loading) {
        return <Loading />;
    }

    if (!loggedIn) {
        return (
            <div className="p-8">
                <p className="text-gray-600 mb-4">Log in to see your synced test history.</p>
                <Link href="/login" className="text-blue-600 hover:underline">Log in</Link>
            </div>
        );
    }

    return (
        <div className="max-w-screen min-h-screen bg-white dark:bg-slate-900">
            <div className="p-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => router.push('/')}
                        aria-label="Back to Home"
                        className="inline-flex items-center justify-center p-1.5 rounded-xl border border-white/70 text-white font-bold bg-transparent transition-all duration-300 ease-in-out hover:border-amber-200 hover:text-amber-200 hover:bg-amber-400/5 hover:shadow-[0_0_18px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    >
                        <ArrowLeft02Icon size={20} />
                    </button>
                    <h1 className="text-2xl font-bold">Test History</h1>
                </div>
                {attempts.length === 0 ? (
                    <p className="text-gray-500">No synced attempts yet — take a test while logged in.</p>
                ) : (
                    <ul className="space-y-2">
                        {attempts.map((a) => {
                            const pct = Math.round((a.score / a.totalQuestions) * 100);
                            return (
                                <li key={a._id} className="border rounded p-3 flex justify-between items-center">
                                    <div className="flex w-full items-center gap-3">
                                        <div className="flex flex-col w-full md:px-4">
                                            <div className="flex items-center justify-between gap-2 w-full">
                                                <Link href={`/history/${a._id}`} className="flex-1">
                                                    <span className="font-medium">
                                                        {formatModeLabel(a.mode, categories)}
                                                        {a.reattemptOf && (
                                                            <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                                                ↻ Reattempt
                                                            </span>
                                                        )}
                                                    </span>

                                                </Link>
                                                <div className="md:hidden">
                                                    <Link href={`/test/reattempt/${a._id}`} className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-400/10 backdrop-blur-md border border-amber-200 hover:border-amber-200 transition-all duration-300 focus:outline-none">
                                                        Reattempt
                                                    </Link>
                                                </div>
                                            </div>
                                            <div className="mt-1 flex items-center justify-between gap-2">
                                                <span className="text-gray-300 text-sm">
                                                    {new Date(a.submittedAt).toLocaleString()}<span className="text-gray-100 text-[14px] font-medium">{`  `}|{`   `} <span className="text-green-500 text-[14px] font-medium">{a.score}/{a.totalQuestions} ({pct}%)</span></span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="hidden md:block">
                                            <Link href={`/test/reattempt/${a._id}`} className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-400/10 backdrop-blur-md border border-amber-200 hover:border-amber-200 transition-all duration-300 focus:outline-none">
                                                Reattempt
                                            </Link>
                                        </div>
                                    </div>

                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}