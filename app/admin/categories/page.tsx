"use client";

import { useEffect, useState } from "react";

type Category = { _id: string; name: string; label: string };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadCategories() {
    setLoading(true);
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    setLabel("");
    loadCategories();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Questions using it will be affected.")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    loadCategories();
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Topic Categories</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="e.g. Sports, National Awards"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="flex-1 border rounded p-2"
          required
        />
        <button type="submit" className="bg-black text-white px-4 rounded">
          Add
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : categories.length === 0 ? (
        <p className="text-gray-500">No categories yet — add one above.</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li
              key={cat._id}
              className="flex justify-between items-center border rounded p-3"
            >
              <span>{cat.label}</span>
              <button
                onClick={() => handleDelete(cat._id)}
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