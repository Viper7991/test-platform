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
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
          Topic Categories
        </h1>

        <form onSubmit={handleAdd} className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="e.g. Sports, National Awards"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 border border-gray-300 text-black rounded-lg p-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            required
          />
          <button
            type="submit"
            className="bg-gray-900 text-white font-medium px-6 py-3 rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors shadow-sm"
          >
            Add
          </button>
        </form>

        {error && (
          <p className="text-red-700 text-sm bg-red-50 p-4 rounded-lg border border-red-200 mb-6 shadow-sm">
            {error}
          </p>
        )}

        {loading ? (
          <div className="text-center p-8 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <p className="text-gray-500 font-medium animate-pulse">Loading...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center p-12 bg-white border-2 border-gray-200 border-dashed rounded-2xl shadow-sm">
            <p className="text-gray-500">No categories yet — add one above.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {categories.map((cat) => (
              <li
                key={cat._id}
                className="flex justify-between items-center bg-white border border-gray-100 shadow-sm rounded-xl p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200"
              >
                <span className="text-gray-800 font-medium">{cat.label}</span>
                <button
                  onClick={() => handleDelete(cat._id)}
                  className="text-red-600 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}