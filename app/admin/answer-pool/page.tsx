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
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">Answer Pool</h1>
      <a
        href="/api/admin/answer-pool/export"
        className="inline-block mb-6 border px-4 py-2 rounded text-sm"
      >
        Export Backup CSV
      </a>



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

      {/* CSV Import */}
      <div className="border rounded p-4 mb-8 space-y-3">
        <h2 className="font-medium">Import from CSV</h2>
        <p className="text-sm text-gray-600">
          CSV must have two columns: <code>value</code> and <code>tags</code> (tags separated by semicolons, e.g. <code>military-chief;male</code>).
          Existing values get their tags merged in; new values get added.
        </p>

        <input type="file" accept=".csv" onChange={handleFileSelect} />

        {csvMessage && <p className="text-sm text-gray-700">{csvMessage}</p>}

        {csvPreview.length > 0 && (
          <>
            <div className="max-h-64 overflow-y-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Value</th>
                    <th className="text-left p-2">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{row.value}</td>
                      <td className="p-2 text-gray-600">{row.tags.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={handleCsvImport} className="bg-black text-white px-4 py-2 rounded">
              Import {csvPreview.length} Rows
            </button>
          </>
        )}
      </div>

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

      {
        !loading && entries.length > 0 && (
          <div className="flex justify-between items-center mb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedIds.size === entries.length && entries.length > 0}
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
        )
      }

      {
        loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-gray-500">No entries found.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li key={entry._id} className="border rounded p-3">
                {editingId === entry._id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full border rounded p-2"
                    />
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="tags, comma-separated"
                      className="w-full border rounded p-2"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(entry._id)} className="bg-black text-white px-3 py-1 rounded text-sm">
                        Save
                      </button>
                      <button onClick={cancelEdit} className="border px-3 py-1 rounded text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(entry._id)}
                        onChange={() => toggleSelect(entry._id)}
                      />
                      <div>
                        <span className="font-medium">{entry.value}</span>
                        <span className="text-gray-500 text-sm ml-2">[{entry.tags.join(", ")}]</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(entry)} className="text-blue-600 text-sm hover:underline">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(entry._id, entry.value)} className="text-red-600 text-sm hover:underline">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )
      }
    </div >
  );
}