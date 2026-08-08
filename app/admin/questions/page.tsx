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
        <div className="min-h-screen bg-white">
            <div className="p-6 md:p-8 max-w-4xl mx-auto bg-white text-gray-800 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Questions</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage, add, and export your questions database.</p>
                    </div>
                    <a
                        href="/api/admin/questions/export"
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export Backup CSV
                    </a>
                </div>

                {/* Add Question Form Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-semibold text-gray-800">Add New Question</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                            <textarea
                                placeholder="Enter the question text here..."
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                rows={2}
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm resize-y"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <div className="flex justify-between items-end mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Topic Category</label>
                                    <p className="text-xs text-gray-500">
                                        Need a new one?{" "}
                                        <a href="/admin/categories" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors">
                                            Manage Categories
                                        </a>
                                    </p>
                                </div>
                                <select
                                    value={topicCategory}
                                    onChange={(e) => setTopicCategory(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm bg-white"
                                    required
                                >
                                    <option value="" className="text-gray-400">Select Topic Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id} value={cat._id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Paris"
                                    value={correctAnswer}
                                    onChange={(e) => setCorrectAnswer(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Required Tags</label>
                                <input
                                    type="text"
                                    placeholder="e.g. female, ceo (comma-separated)"
                                    value={requiredTagsInput}
                                    onChange={(e) => setRequiredTagsInput(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Excluded Tags <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. india (comma-separated)"
                                    value={excludedTagsInput}
                                    onChange={(e) => setExcludedTagsInput(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {matchCount !== null && (
                            <div className={`p-4 rounded-lg border flex items-start gap-3 ${matchCount < 3 ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
                                <svg className={`w-5 h-5 shrink-0 mt-0.5 ${matchCount < 3 ? "text-red-500" : "text-green-500"}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm font-medium">
                                    {matchCount} matching wrong-answer option{matchCount === 1 ? "" : "s"} found
                                    {matchCount < 3 && <span className="block font-normal mt-1 opacity-90">— You need at least 3 to form a valid 4-option multiple choice question.</span>}
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Explanation <span className="text-gray-400 font-normal">(Optional)</span></label>
                            <textarea
                                placeholder="Provide context or an explanation for the correct answer..."
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                rows={2}
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm resize-y"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                Add Question
                            </button>
                        </div>
                    </form>
                </div>

                {/* CSV Import Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-semibold text-gray-800">Bulk Import via CSV</h2>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                            <p className="font-medium mb-1">Expected Format:</p>
                            <p className="opacity-90">
                                Columns required: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700">questionText</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700">topicCategory</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700">requiredTags</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700">excludedTags</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700">correctAnswer</code>, <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700">explanation</code>.
                            </p>
                            <p className="opacity-90 mt-2">
                                Note: Separate multiple tags with semicolons (;). Missing categories will be auto-created. Duplicates are skipped.
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer"
                            />
                        </div>

                        {csvMessage && <p className="text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">{csvMessage}</p>}

                        {csvPreview.length > 0 && (
                            <div className="space-y-4 pt-2 border-t border-gray-100">
                                <h3 className="font-medium text-gray-800">Preview ({csvPreview.length} questions)</h3>
                                <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg shadow-inner bg-white">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-600 font-medium sticky top-0 border-b border-gray-200 shadow-sm">
                                            <tr>
                                                <th className="px-4 py-3">Question</th>
                                                <th className="px-4 py-3 whitespace-nowrap">Category</th>
                                                <th className="px-4 py-3 whitespace-nowrap">Correct Answer</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {csvPreview.map((row, i) => (
                                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 text-gray-800">{row.questionText.length > 60 ? `${row.questionText.slice(0, 60)}...` : row.questionText}</td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">{row.topicCategory}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-800 font-medium">{row.correctAnswer}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={handleCsvImport} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                        Confirm Import
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls & List Section */}
                <div className="space-y-4 pt-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by:</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full sm:w-64 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm bg-white"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>{cat.label}</option>
                                ))}
                            </select>
                            {filterCategory && (
                                <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full whitespace-nowrap hidden sm:inline-block">
                                    {filteredQuestions.length} / {questions.length}
                                </span>
                            )}
                        </div>

                        {!loading && questions.length > 0 && (
                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-gray-200 pt-3 sm:pt-0">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    Select All <span className="text-gray-500 font-normal">({selectedIds.size})</span>
                                </label>

                                {selectedIds.size > 0 && (
                                    <button
                                        onClick={handleBulkDelete}
                                        className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Delete Selected
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* List */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                            <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <p className="text-gray-500 font-medium">Loading questions...</p>
                        </div>
                    ) : filteredQuestions.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                            <p className="text-gray-500 font-medium">No questions found.</p>
                            <p className="text-sm text-gray-400 mt-1">Add a new question above or import via CSV to get started.</p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {filteredQuestions.map((q) => (
                                <li key={q._id} className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${selectedIds.has(q._id) ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-200"}`}>
                                    {editingId === q._id ? (
                                        <div className="space-y-4 bg-gray-50 p-4 -m-2 rounded-lg border border-gray-200">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">Question Text</label>
                                                <textarea
                                                    value={editForm.questionText}
                                                    onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm bg-white"
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">Correct Answer</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.correctAnswer}
                                                        onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                                                        placeholder="Correct Answer"
                                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">Required Tags</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.requiredTags}
                                                        onChange={(e) => setEditForm({ ...editForm, requiredTags: e.target.value })}
                                                        placeholder="comma-separated tags"
                                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">Excluded Tags</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.excludedTags}
                                                        onChange={(e) => setEditForm({ ...editForm, excludedTags: e.target.value })}
                                                        placeholder="comma-separated tags"
                                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm bg-white"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">Explanation</label>
                                                <textarea
                                                    value={editForm.explanation}
                                                    onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                                                    placeholder="Explanation..."
                                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm bg-white"
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button onClick={() => saveEdit(q._id)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-sm transition-colors">
                                                    Save Changes
                                                </button>
                                                <button onClick={cancelEdit} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 rounded-lg text-sm shadow-sm transition-colors">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="pt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(q._id)}
                                                        onChange={() => toggleSelect(q._id)}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                    />
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                    <p className="font-semibold text-gray-900 text-base leading-relaxed">{q.questionText}</p>

                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                                        <div className="flex items-center gap-1.5 text-gray-600">
                                                            <span className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Category:</span>
                                                            <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs font-medium">{q.topicCategory?.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-gray-600">
                                                            <span className="font-medium text-gray-500 uppercase tracking-wider text-[10px]">Correct:</span>
                                                            <span className="text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded text-xs border border-green-100">{q.correctAnswer}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-3 text-xs pt-1">
                                                        {q.requiredTags?.length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-gray-400">Req:</span>
                                                                <div className="flex gap-1">
                                                                    {q.requiredTags.map((tag, idx) => (
                                                                        <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">{tag.trim()}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {q.excludedTags?.length > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-gray-400">Exc:</span>
                                                                <div className="flex gap-1">
                                                                    {q.excludedTags.map((tag, idx) => (
                                                                        <span key={idx} className="bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded line-through opacity-80">{tag.trim()}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                                                <button
                                                    onClick={() => startEdit(q)}
                                                    className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center justify-center tooltip-trigger"
                                                    title="Edit question"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(q._id)}
                                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center justify-center"
                                                    title="Delete question"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}