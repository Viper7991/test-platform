"use client";

import { useEffect, useState } from "react";

type PoolEntry = { _id: string; value: string; tags: string[] };

export default function AnswerPoolPage() {
  const [entries, setEntries] = useState<PoolEntry[]>([]);
  const [filterTag, setFilterTag] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadEntries(tag?: string) {
    setLoading(true);
    const url = tag ? `/api/admin/answer-pool?tag=${encodeURIComponent(tag)}` : "/api/admin/answer-pool";
    const res = await fetch(url);
    const data = await res.json();
    setEntries(data.entries || []);
    setLoading(false);
  }

  useEffect(() => {
    loadEntries();
  }, []);

  function handleFilter() {
    loadEntries(filterTag.trim() || undefined);
  }

  async function handleBulkAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const values = bulkText.split("\n").map((v) => v.trim()).filter(Boolean);
    const tags = tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

    if (values.length === 0 || tags.length === 0) {
      setMessage("Enter at least one value and one tag.");
      return;
    }

    const res = await fetch("/api/admin/answer-pool", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values, tags }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Something went wrong");
      return;
    }

    setMessage(
      `Added ${data.inserted.length} new entries` +
      (data.skipped > 0 ? ` (${data.skipped} already existed, skipped)` : "")
    );
    setBulkText("");
    loadEntries(filterTag.trim() || undefined);
  }

  async function handleDelete(id: string, value: string) {
    if (!confirm(`Remove "${value}" from the pool?`)) return;

    const res = await fetch(`/api/admin/answer-pool/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (data.wasUsedInQuestions > 0) {
      alert(
        `Note: "${value}" was used as a correct answer in ${data.wasUsedInQuestions} question(s). Those questions still reference it, but it's now removed from the pool.`
      );
    }

    loadEntries(filterTag.trim() || undefined);
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">Answer Pool</h1>

      {/* Bulk Add */}
      <form onSubmit={handleBulkAdd} className="border rounded p-4 mb-8 space-y-3">
        <h2 className="font-medium">Bulk Add Values</h2>

        <textarea
          placeholder={"One value per line, e.g.\nFrance\nGermany\nJapan"}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={6}
          className="w-full border rounded p-2 font-mono text-sm"
        />

        <input
          type="text"
          placeholder="Tags for all of the above, comma-separated (e.g. country)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full border rounded p-2"
        />

        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          Add All
        </button>

        {message && <p className="text-sm text-gray-700">{message}</p>}
      </form>

      {/* Filter + List */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Filter by tag (e.g. ceo)"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="flex-1 border rounded p-2"
        />
        <button onClick={handleFilter} className="border px-4 rounded">
          Filter
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-500">No entries found.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry._id}
              className="flex justify-between items-center border rounded p-3"
            >
              <div>
                <span className="font-medium">{entry.value}</span>
                <span className="text-gray-500 text-sm ml-2">
                  [{entry.tags.join(", ")}]
                </span>
              </div>
              <button
                onClick={() => handleDelete(entry._id, entry.value)}
                className="text-red-600 text-sm hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}