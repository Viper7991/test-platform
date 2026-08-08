"use client";

import { useEffect, useState } from "react";
import { parseCSV } from "@/lib/csv";

type PoolEntry = { _id: string; value: string; tags: string[] };

export default function AnswerPoolPage() {
  const [entries, setEntries] = useState<PoolEntry[]>([]);
  const [filterTag, setFilterTag] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [csvPreview, setCsvPreview] = useState<{ value: string; tags: string[] }[]>([]);
  const [csvMessage, setCsvMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editTags, setEditTags] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  function startEdit(entry: PoolEntry) {
    setEditingId(entry._id);
    setEditValue(entry.value);
    setEditTags(entry.tags.join(", "));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);
      return updated;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map((e) => e._id)));
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected entries? This cannot be undone.`)) return;

    await fetch("/api/admin/answer-pool/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });

    setSelectedIds(new Set());
    loadEntries(filterTag.trim() || undefined);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
    setEditTags("");
  }

  async function saveEdit(id: string) {
    const tags = editTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    await fetch(`/api/admin/answer-pool/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: editValue, tags }),
    });
    cancelEdit();
    loadEntries(filterTag.trim() || undefined);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const rows = parseCSV(text);
      const [header, ...dataRows] = rows;

      const valueIdx = header.findIndex((h) => h.trim().toLowerCase() === "value");
      const tagsIdx = header.findIndex((h) => h.trim().toLowerCase() === "tags");

      if (valueIdx === -1 || tagsIdx === -1) {
        setCsvMessage('CSV must have "value" and "tags" columns.');
        return;
      }

      const parsed = dataRows
        .filter((r) => r[valueIdx]?.trim())
        .map((r) => ({
          value: r[valueIdx].trim(),
          tags: r[tagsIdx].split(";").map((t) => t.trim()).filter(Boolean),
        }));

      setCsvPreview(parsed);
      setCsvMessage(`Parsed ${parsed.length} rows — review below, then click Import.`);
    };
    reader.readAsText(file);
  }

  async function handleCsvImport() {
    const res = await fetch("/api/admin/answer-pool/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: csvPreview }),
    });
    const data = await res.json();

    setCsvMessage(
      `Imported: ${data.added} new, ${data.updated} updated` +
      (data.errors?.length ? ` (${data.errors.length} skipped)` : "")
    );
    setCsvPreview([]);
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
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Answer Pool
          </h1>
          <a
            href="/api/admin/answer-pool/export"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Backup CSV
          </a>
        </div>

        {/* Bulk Add Card */}
        <form onSubmit={handleBulkAdd} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">
            Bulk Add Values
          </h2>
          <textarea
            placeholder={"One value per line, e.g.\nFrance\nGermany\nJapan"}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={6}
            className="w-full border text-black border-gray-300 rounded-lg p-3 font-mono text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          />
          <input
            type="text"
            placeholder="Tags for all of the above, comma-separated (e.g. country)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full border text-black border-gray-300 rounded-lg p-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          />
          <div className="pt-2">
            <button type="submit" className="bg-gray-900 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors shadow-sm">
              Add All
            </button>
          </div>
          {message && (
            <p className="text-sm font-medium text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100 mt-3">
              {message}
            </p>
          )}
        </form>

        {/* CSV Import Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">
            Import from CSV
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            CSV must have two columns: <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">value</code> and <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">tags</code> (tags separated by semicolons, e.g. <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">military-chief;male</code>). Existing values get their tags merged in; new values get added.
          </p>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-all cursor-pointer border border-gray-200 rounded-lg p-1.5"
          />

          {csvMessage && (
            <p className="text-sm font-medium text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
              {csvMessage}
            </p>
          )}

          {csvPreview.length > 0 && (
            <div className="mt-6 space-y-4 pt-4 border-t border-gray-100">
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl shadow-inner">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 shadow-sm z-10">
                    <tr>
                      <th className="text-gray-700 font-semibold p-3">Value</th>
                      <th className="text-gray-700 font-semibold p-3">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {csvPreview.map((row, i) => (
                      <tr key={i} className="bg-white hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-medium text-gray-900">{row.value}</td>
                        <td className="p-3 text-gray-500">{row.tags.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={handleCsvImport}
                className="w-full sm:w-auto bg-gray-900 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors shadow-sm"
              >
                Import {csvPreview.length} Rows
              </button>
            </div>
          )}
        </div>

        {/* Filter & List Section */}
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Filter by tag (e.g. ceo)"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="flex-1 border text-black border-gray-300 rounded-lg p-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
            <button
              onClick={handleFilter}
              className="bg-white border border-gray-300 text-gray-700 font-medium px-6 py-3 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors shadow-sm"
            >
              Filter
            </button>
          </div>

          {/* Select All / Delete Toolbar */}
          {!loading && entries.length > 0 && (
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.size === entries.length && entries.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-gray-900 bg-gray-100 border-gray-300 rounded focus:ring-gray-900 cursor-pointer"
                />
                Select All ({selectedIds.size} selected)
              </label>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white font-medium px-4 py-1.5 rounded-lg text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors shadow-sm"
                >
                  Delete Selected ({selectedIds.size})
                </button>
              )}
            </div>
          )}

          {/* Entries List */}
          {loading ? (
            <div className="text-center p-8 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <p className="text-gray-500 font-medium animate-pulse">Loading entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center p-12 bg-white border-2 border-gray-200 border-dashed rounded-2xl shadow-sm">
              <p className="text-gray-500">No entries found.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {entries.map((entry) => (
                <li key={entry._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                  {editingId === entry._id ? (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full border text-black border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="tags, comma-separated"
                        className="w-full border text-black border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => saveEdit(entry._id)}
                          className="bg-gray-900 text-white font-medium px-4 py-1.5 rounded-lg text-sm hover:bg-black transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-white border border-gray-300 text-gray-700 font-medium px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <div className="flex items-start sm:items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(entry._id)}
                          onChange={() => toggleSelect(entry._id)}
                          className="w-4 h-4 mt-1 sm:mt-0 text-gray-900 bg-gray-100 border-gray-300 rounded focus:ring-gray-900 cursor-pointer"
                        />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="font-semibold text-gray-900">{entry.value}</span>
                          {entry.tags && entry.tags.length > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              {entry.tags.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-8 sm:ml-0">
                        <button
                          onClick={() => startEdit(entry)}
                          className="text-blue-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors focus:outline-none"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(entry._id, entry.value)}
                          className="text-red-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors focus:outline-none"
                        >
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
      </div>
    </div>
  );
}