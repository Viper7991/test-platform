"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMarkedQuestionIds, toggleMarkedQuestion, pullMarkedFromCloud, pushMarkedToCloud } from "@/lib/test-engine/markedQuestions";
import { useRouter } from 'next/navigation';
import { ArrowLeft02Icon } from 'hugeicons-react';
import Loading from "../components/Loading";

type Question = {
    _id: string;
    questionText: string;
    correctAnswer: string;
};

export default function MarkedQuestionsListPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    async function load() {
        setLoading(true);

        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        const loggedIn = !!meData.user;
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
            await pullMarkedFromCloud();
        }

        const markedIds = getMarkedQuestionIds();
        const qRes = await fetch("/api/public/questions?subject=current-affairs");
        const qData = await qRes.json();
        const allQuestions: Question[] = qData.questions || [];

        const marked = allQuestions.filter((q) => markedIds.includes(q._id));
        setQuestions(marked);
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    async function handleUnmark(id: string) {
        toggleMarkedQuestion(id);
        if (isLoggedIn) {
            await pushMarkedToCloud();
        }
        setQuestions((prev) => prev.filter((q) => q._id !== id));
    }

    if (loading) return <Loading />;

    return (
        <div className=" lg:w-full min-h-screen bg-white dark:bg-slate-900">
        <div className="p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
                <button
                    onClick={() => router.push('/')}
                    aria-label="Back to Home"
                    className="inline-flex items-center justify-center p-1.5 rounded-xl border border-white/70 text-white font-bold bg-transparent transition-all duration-300 ease-in-out hover:border-amber-200 hover:text-amber-200 hover:bg-amber-400/5 hover:shadow-[0_0_18px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                >
                    <ArrowLeft02Icon size={20} />
                </button>
                <h1 className="text-2xl font-bold">Marked Questions</h1>
            </div>

            {questions.length === 0 ? (
                <p className="text-gray-500">
                    You haven't marked any questions yet — tap ☆ Mark during any test to add one here.
                </p>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-lg font-semibold">Want to attempt them?</h1>
                        <span>
                            <Link href="/test/marked" className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-400/10 backdrop-blur-md border border-amber-200 hover:border-amber-200 transition-all duration-300 focus:outline-none">
                                Start Test
                            </Link>
                        </span>
                    </div>
                    <ul className="space-y-2">
                        {questions.map((q) => (
                            <li key={q._id} className="border rounded p-3 flex flex-col justify-between items-start">
                                <div className="flex items-center justify-between w-full">
                                    <p className="text-sm">{q.questionText}</p>
                                    <button
                                        onClick={() => handleUnmark(q._id)}
                                        className="text-red-600 text-sm hover:underline ml-3 shrink-0"
                                    >
                                        Unmark
                                    </button>
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                    <p className="text-[14px] text-green-500 font-bold">Answer : </p><span className="text-[14px] text-green-400">{q.correctAnswer}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
        </div>
    );
}