"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMarkedQuestionIds } from "@/lib/test-engine/markedQuestions";

type Category = { _id: string; label: string };
type Question = { _id: string; topicCategory: { _id: string } };

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [markedCount, setMarkedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [catRes, qRes] = await Promise.all([
        fetch("/api/public/categories?subject=current-affairs"),
        fetch("/api/public/questions?subject=current-affairs"),
      ]);
      const catData = await catRes.json();
      const qData = await qRes.json();

      setCategories(catData.categories || []);
      setQuestions(qData.questions || []);
      setMarkedCount(getMarkedQuestionIds().length);
      setLoading(false);
    }
    load();
  }, []);

  function countInCategory(categoryId: string) {
    return questions.filter((q) => q.topicCategory._id === categoryId).length;
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Current Affairs</h1>
      <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
        View My Analytics →
      </Link>
      <p className="text-gray-600 mb-8">Choose how you'd like to practice.</p>

      {/* Mixed Test */}
      <div className="border rounded-lg p-5 mb-4">
        <h2 className="text-lg font-semibold">Mixed Test</h2>
        <p className="text-sm text-gray-600 mt-1">
          50 questions across all topics (max 5 per topic). {questions.length} total questions available.
        </p>
        <Link
          href="/test/mixed"
          className="inline-block mt-3 bg-black text-white px-4 py-2 rounded"
        >
          Start Mixed Test
        </Link>
      </div>

      {/* Marked Questions Test */}
      <div className="border rounded-lg p-5 mb-4">
        <h2 className="text-lg font-semibold">Marked Questions</h2>
        <p className="text-sm text-gray-600 mt-1">
          You have {markedCount} marked question{markedCount === 1 ? "" : "s"}.
        </p>
        {markedCount === 0 ? (
          <p className="text-sm text-gray-400 mt-3">
            Mark questions during any test to build this list.
          </p>
        ) : (
          <Link
            href="/test/marked"
            className="inline-block mt-3 bg-black text-white px-4 py-2 rounded"
          >
            Start Marked Questions Test
          </Link>
        )}
      </div>

      {/* Topic-wise Tests */}
      <div className="border rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-3">Topic-wise Tests</h2>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400">No categories yet.</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((cat) => {
              const count = countInCategory(cat._id);
              return (
                <li key={cat._id} className="flex justify-between items-center">
                  <span>
                    {cat.label}{" "}
                    <span className="text-sm text-gray-500">({count} questions)</span>
                  </span>
                  <Link
                    href={`/test/topic/${cat._id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Start Test
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}