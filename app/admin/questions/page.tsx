"use client";

import { useEffect, useState } from "react";

type Category = { _id: string; label: string };
type Question = {
    _id: string;
    questionText: string;
    topicCategory: Category;
    requiredTags: string[];
    excludedTags: string[];
    correctAnswer: string;
    explanation?: string;
};

export default function QuestionsPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);

    const [questionText, setQuestionText] = useState("");
    const [topicCategory, setTopicCategory] = useState("");
    const [requiredTagsInput, setRequiredTagsInput] = useState("");
    const [excludedTagsInput, setExcludedTagsInput] = useState("");
    const [correctAnswer, setCorrectAnswer] = useState("");
    const [explanation, setExplanation] = useState("");

    const [matchCount, setMatchCount] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    async function loadCategories() {
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        setCategories(data.categories || []);
    }

    async function loadQuestions() {
        setLoading(true);
        const res = await fetch("/api/admin/questions");
        const data = await res.json();
        setQuestions(data.questions || []);
        setLoading(false);
    }

    useEffect(() => {
        loadCategories();
        loadQuestions();
    }, []);

    // Live match-count check whenever tags or correct answer change
    useEffect(() => {
        const requiredTags = requiredTagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
        const excludedTags = excludedTagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

        if (requiredTags.length === 0) {
            setMatchCount(null);
            return;
        }

        const timeout = setTimeout(async () => {
            const res = await fetch("/api/admin/answer-pool/match-count", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requiredTags, excludedTags, correctAnswer }),
            });
            const data = await res.json();
            setMatchCount(data.count);
        }, 400); // debounce

        return () => clearTimeout(timeout);
    }, [requiredTagsInput, excludedTagsInput, correctAnswer]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        const requiredTags = requiredTagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
        const excludedTags = excludedTagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

        const res = await fetch("/api/admin/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                questionText,
                topicCategory,
                requiredTags,
                excludedTags,
                correctAnswer,
                explanation,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || "Something went wrong");
            return;
        }

        // Reset form
        setQuestionText("");
        setRequiredTagsInput("");
        setExcludedTagsInput("");
        setCorrectAnswer("");
        setExplanation("");
        setMatchCount(null);
        loadQuestions();
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this question?")) return;
        await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
        loadQuestions();
    }

    return (
        <div className="p-8 max-w-3xl">
            <h1 className="text-2xl font-semibold mb-6">Questions</h1>

            <form onSubmit={handleSubmit} className="border rounded p-4 mb-8 space-y-3">
                <textarea
                    placeholder="Question text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={2}
                    className="w-full border rounded p-2"
                    required
                />

                <p className="text-sm text-gray-600 mb-4">
                    Don't see the category you need?{" "}
                    <a href="/admin/categories" target="_blank" className="text-blue-600 hover:underline">
                        Manage Topic Categories
                    </a>{" "}
                    (opens in a new tab)
                </p>
                <select
                    value={topicCategory}
                    onChange={(e) => setTopicCategory(e.target.value)}
                    className="w-full border rounded p-2"
                    required
                >
                    <option value="">Select Topic Category</option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.label}</option>
                    ))}
                </select>

                <input
                    type="text"
                    placeholder="Required tags, comma-separated (e.g. female, ceo)"
                    value={requiredTagsInput}
                    onChange={(e) => setRequiredTagsInput(e.target.value)}
                    className="w-full border rounded p-2"
                    required
                />

                <input
                    type="text"
                    placeholder="Excluded tags, comma-separated (optional, e.g. india)"
                    value={excludedTagsInput}
                    onChange={(e) => setExcludedTagsInput(e.target.value)}
                    className="w-full border rounded p-2"
                />

                <input
                    type="text"
                    placeholder="Correct answer"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full border rounded p-2"
                    required
                />

                {matchCount !== null && (
                    <p className={`text-sm ${matchCount < 3 ? "text-red-600" : "text-green-600"}`}>
                        {matchCount} matching wrong-answer option{matchCount === 1 ? "" : "s"} found
                        {matchCount < 3 && " — need at least 3 for a 4-option question"}
                    </p>
                )}

                <textarea
                    placeholder="Explanation (optional)"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    rows={2}
                    className="w-full border rounded p-2"
                />

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button type="submit" className="bg-black text-white px-4 py-2 rounded">
                    Add Question
                </button>
            </form>

            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ) : questions.length === 0 ? (
                <p className="text-gray-500">No questions yet.</p>
            ) : (
                <ul className="space-y-3">
                    {questions.map((q) => (
                        <li key={q._id} className="border rounded p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{q.questionText}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Category: {q.topicCategory?.label} | Correct: {q.correctAnswer}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Required: [{q.requiredTags.join(", ")}]
                                        {q.excludedTags?.length > 0 && ` | Excluded: [${q.excludedTags.join(", ")}]`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(q._id)}
                                    className="text-red-600 text-sm hover:underline"
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}