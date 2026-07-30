"use client";

import { useEffect, useState } from "react";
import { parseCSV } from "@/lib/csv";

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

    const [csvPreview, setCsvPreview] = useState<any[]>([]);
    const [csvMessage, setCsvMessage] = useState("");

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        questionText: "", requiredTags: "", excludedTags: "", correctAnswer: "", explanation: "",
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filterCategory, setFilterCategory] = useState("");

    function toggleSelect(id: string) {
        setSelectedIds((prev) => {
            const updated = new Set(prev);
            if (updated.has(id)) updated.delete(id);
            else updated.add(id);
            return updated;
        });
    }

    function toggleSelectAll() {
        if (selectedIds.size === filteredQuestions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredQuestions.map((q) => q._id)));
        }
    }

    async function handleBulkDelete() {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} selected questions? This cannot be undone.`)) return;

        await fetch("/api/admin/questions/bulk-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: Array.from(selectedIds) }),
        });

        setSelectedIds(new Set());
        loadQuestions();
    }

    async function loadCategories() {
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        setCategories(data.categories || []);
    }

    function startEdit(q: Question) {
        setEditingId(q._id);
        setEditForm({
            questionText: q.questionText,
            requiredTags: q.requiredTags.join(", "),
            excludedTags: (q.excludedTags || []).join(", "),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
        });
    }

    function cancelEdit() {
        setEditingId(null);
    }

    async function saveEdit(id: string) {
        const requiredTags = editForm.requiredTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
        const excludedTags = editForm.excludedTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

        await fetch(`/api/admin/questions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                questionText: editForm.questionText,
                requiredTags,
                excludedTags,
                correctAnswer: editForm.correctAnswer,
                explanation: editForm.explanation,
            }),
        });
        cancelEdit();
        loadQuestions();
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

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const text = reader.result as string;
            const rows = parseCSV(text);
            const [header, ...dataRows] = rows;

            const idx = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
            const qIdx = idx("questionText");
            const catIdx = idx("topicCategory");
            const reqIdx = idx("requiredTags");
            const excIdx = idx("excludedTags");
            const ansIdx = idx("correctAnswer");
            const expIdx = idx("explanation");

            if ([qIdx, catIdx, reqIdx, ansIdx].some((i) => i === -1)) {
                setCsvMessage("CSV must have questionText, topicCategory, requiredTags, correctAnswer columns (excludedTags and explanation optional).");
                return;
            }

            const parsed = dataRows
                .filter((r) => r[qIdx]?.trim())
                .map((r) => ({
                    questionText: r[qIdx].trim(),
                    topicCategory: r[catIdx].trim(),
                    requiredTags: r[reqIdx].split(";").map((t) => t.trim()).filter(Boolean),
                    excludedTags: excIdx !== -1 ? r[excIdx].split(";").map((t) => t.trim()).filter(Boolean) : [],
                    correctAnswer: r[ansIdx].trim(),
                    explanation: expIdx !== -1 ? r[expIdx].trim() : "",
                }));

            setCsvPreview(parsed);
            setCsvMessage(`Parsed ${parsed.length} rows — review below, then click Import.`);
        };
        reader.readAsText(file);
    }

    async function handleCsvImport() {
        const res = await fetch("/api/admin/questions/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: csvPreview }),
        });
        const data = await res.json();

        setCsvMessage(`Imported: ${data.added} new` + (data.errors?.length ? ` (${data.errors.length} skipped — see below)` : ""));
        if (data.errors?.length) console.log("Import warnings:", data.errors);
        setCsvPreview([]);
        loadQuestions();
    }

    const filteredQuestions = filterCategory
        ? questions.filter((q) => q.topicCategory?._id === filterCategory)
        : questions;

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

            {/* CSV Import */}
            <div className="border rounded p-4 mb-8 space-y-3">
                <h2 className="font-medium">Import from CSV</h2>
                <p className="text-sm text-gray-600">
                    Columns: <code>questionText, topicCategory, requiredTags, excludedTags, correctAnswer, explanation</code>{" "}
                    (tags separated by semicolons). Categories not yet created will be added automatically. Duplicate question text is skipped.
                </p>

                <input type="file" accept=".csv" onChange={handleFileSelect} />

                {csvMessage && <p className="text-sm text-gray-700">{csvMessage}</p>}

                {csvPreview.length > 0 && (
                    <>
                        <div className="max-h-64 overflow-y-auto border rounded">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="text-left p-2">Question</th>
                                        <th className="text-left p-2">Category</th>
                                        <th className="text-left p-2">Correct Answer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {csvPreview.map((row, i) => (
                                        <tr key={i} className="border-t">
                                            <td className="p-2">{row.questionText.slice(0, 60)}...</td>
                                            <td className="p-2">{row.topicCategory}</td>
                                            <td className="p-2">{row.correctAnswer}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={handleCsvImport} className="bg-black text-white px-4 py-2 rounded">
                            Import {csvPreview.length} Questions
                        </button>
                    </>
                )}
            </div>

            <div className="flex items-center gap-2 mb-4">
                <label className="text-sm text-gray-600">Filter by category:</label>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="border rounded p-2 text-sm"
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.label}</option>
                    ))}
                </select>
                {filterCategory && (
                    <span className="text-sm text-gray-500">
                        Showing {filteredQuestions.length} of {questions.length} questions
                    </span>
                )}
            </div>

            {!loading && questions.length > 0 && (
                <div className="flex justify-between items-center mb-2">
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0}
                            onChange={toggleSelectAll}
                        />
                        Select All ({selectedIds.size} selected)
                    </label>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                            Delete Selected ({selectedIds.size})
                        </button>
                    )}
                </div>
            )}

            {loading ? (
                <p className="text-gray-500">Loading...</p>
            ) : filteredQuestions.length === 0 ? (
                <p className="text-gray-500">No questions yet.</p>
            ) : (
                <ul className="space-y-3">
                    {filteredQuestions.map((q) => (
                        <li key={q._id} className="border rounded p-4">
                            {editingId === q._id ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editForm.questionText}
                                        onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                                        className="w-full border rounded p-2"
                                        rows={2}
                                    />
                                    <input
                                        type="text"
                                        value={editForm.requiredTags}
                                        onChange={(e) => setEditForm({ ...editForm, requiredTags: e.target.value })}
                                        placeholder="required tags, comma-separated"
                                        className="w-full border rounded p-2"
                                    />
                                    <input
                                        type="text"
                                        value={editForm.excludedTags}
                                        onChange={(e) => setEditForm({ ...editForm, excludedTags: e.target.value })}
                                        placeholder="excluded tags, comma-separated"
                                        className="w-full border rounded p-2"
                                    />
                                    <input
                                        type="text"
                                        value={editForm.correctAnswer}
                                        onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                                        placeholder="correct answer"
                                        className="w-full border rounded p-2"
                                    />
                                    <textarea
                                        value={editForm.explanation}
                                        onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                                        placeholder="explanation"
                                        className="w-full border rounded p-2"
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => saveEdit(q._id)} className="bg-black text-white px-3 py-1 rounded text-sm">
                                            Save
                                        </button>
                                        <button onClick={cancelEdit} className="border px-3 py-1 rounded text-sm">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(q._id)}
                                            onChange={() => toggleSelect(q._id)}
                                            className="mt-1"
                                        />
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
                                    </div>
                                    <div className="flex gap-3 shrink-0 ml-3">
                                        <button onClick={() => startEdit(q)} className="text-blue-600 text-sm hover:underline">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(q._id)} className="text-red-600 text-sm hover:underline">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}