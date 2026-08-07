"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TestRunner from "../../TestRunner";
import { Question, PoolEntry } from "@/lib/test-engine/types";
import { formatModeLabel } from "@/lib/test-engine/formatMode";
import Loading from "@/app/components/Loading";


export default function ReattemptPage() {
    const params = useParams();
    const attemptId = params.attemptId as string;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [pool, setPool] = useState<PoolEntry[]>([]);
    const [questionIds, setQuestionIds] = useState<string[] | null>(null);
    const [timerSeconds, setTimerSeconds] = useState(3000);
    const [error, setError] = useState("");
    const [originalMode, setOriginalMode] = useState<string | null>(null);
    const [categories, setCategories] = useState<{ _id: string; label: string }[]>([]);
    const [originalTestId, setOriginalTestId] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            const attemptRes = await fetch(`/api/user/attempts/${attemptId}`);
            if (!attemptRes.ok) {
                setError("Couldn't load this past test — you may need to be logged in.");
                return;
            }
            const attemptData = await attemptRes.json();
            const originalQuestionIds = attemptData.attempt.answers.map((a: any) => a.questionId);
            setOriginalMode(attemptData.attempt.mode);
            setOriginalTestId(attemptData.attempt.testId);

            const catRes = await fetch("/api/public/categories?subject=current-affairs");
            const catData = await catRes.json();
            setCategories(catData.categories || []);

            const [qRes, poolRes, subRes] = await Promise.all([
                fetch("/api/public/questions?subject=current-affairs"),
                fetch("/api/public/answer-pool"),
                fetch("/api/public/subject?name=current-affairs"),
            ]);
            const qData = await qRes.json();
            const poolData = await poolRes.json();
            const subData = await subRes.json();

            const allQuestions: Question[] = qData.questions || [];
            // Only keep IDs that still exist (in case a question was deleted since)
            const validIds = originalQuestionIds.filter((id: string) =>
                allQuestions.some((q) => q._id === id)
            );

            if (validIds.length === 0) {
                setError("None of the questions from this past test are still available.");
                return;
            }

            setQuestions(allQuestions);
            setPool(poolData.entries || []);
            setTimerSeconds(subData.subject?.timerSeconds || 3000);
            setQuestionIds(validIds);
        }
        load();
    }, [attemptId]);

    if (error) {
        return <div className="p-8 text-red-600">{error}</div>;
    }

    if (questionIds === null) {
        return <Loading />;
    }

    return (
        <div>
            {originalMode && (
                <p className="hidden sm:block text-center bg-gray-600 text-sm text-white p-1">
                    Reattempting: {formatModeLabel(originalMode, categories)}
                </p>
            )}
            <TestRunner
                mode={originalMode || "mixed"}
                reattemptOf={originalTestId || undefined}
                questionIds={questionIds}
                allQuestions={questions}
                answerPool={pool}
                timerSeconds={timerSeconds}
            /></div>
    );
}