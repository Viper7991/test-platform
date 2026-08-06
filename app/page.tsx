"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMarkedQuestionIds } from "@/lib/test-engine/markedQuestions";
import Loading from '@/app/components/Loading';


type Category = { _id: string; label: string };
type Question = { _id: string; topicCategory: { _id: string } };

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [markedCount, setMarkedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    async function load() {
      const [catRes, qRes] = await Promise.all([
        fetch("/api/public/categories?subject=current-affairs"),
        fetch("/api/public/questions?subject=current-affairs"),
      ]);
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      setUser(meData.user);
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
    return <Loading />;
  }

  return (
    <div className=" lg:w-full min-h-screen bg-white dark:bg-slate-900">
    <div className="p-8 max-w-2xl mx-auto">
      
      <div className="mb-6 flex text-sm items-center justify-between">
        <h1 className="text-3xl font-bold">Current Affairs</h1>
        {user ? (
          <span className="inline-flex items-center justify-center border-2 px-3.5 py-1.5 rounded-xl text-sm text-gray-400 bg-amber-400/10 backdrop-blur-md border-gray-300 hover:scale-105 transition-all duration-300 focus:outline-none">
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.reload();
              }}
              className="text-white"
            >
              Log out
            </button>
          </span>
        ) : (
          <span onClick={() => window.location.href = '/login'} className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-400/10 backdrop-blur-md border border-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.8)] hover:scale-105 hover:border-amber-200 hover:shadow-[0_0_30px_rgba(251,191,36)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400">
            <button onClick={() => window.location.href = '/login'} className="text-amber-200">
              Log in
            </button>
          </span>
        )}
      </div>
      <div className="mb-4 text-sm text-gray-600 flex items-center justify-around gap-4">
        <span onClick={() => window.location.href = '/dashboard'} className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-400/10 backdrop-blur-md border border-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.8)] hover:scale-105 hover:border-amber-200 hover:shadow-[0_0_30px_rgba(251,191,36)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400">
          <button>My Analytics</button>
        </span>
        <span onClick={() => window.location.href = '/history'} className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-400/10 backdrop-blur-md border border-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.8)] hover:scale-105 hover:border-amber-200 hover:shadow-[0_0_30px_rgba(251,191,36)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400">
          <button>Test History</button>
        </span>
      </div>
      
      <p className="text-gray-200 mt-8 mb-2">Choose how you'd like to practice.</p>

      {/* Mixed Test */}
      <div className="border rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Mixed Test</h2>
        <span>
          <Link
          href="/test/mixed"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-400/10 backdrop-blur-md border border-amber-200 hover:border-amber-200 transition-all duration-300 focus:outline-none "
        >
          Start Test
        </Link>
        </span>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          50 questions across all topics
        </p>
      </div>

      {/* Marked Questions Test */}
      <div className="border rounded-lg p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Marked Questions</h2>
        <span>
          {markedCount === 0 ? (
          <p className="text-sm text-gray-400 mt-3">
            Mark questions during any test to build this list.
          </p>
        ) : (
          <Link
            href="/test/marked"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-400/10 backdrop-blur-md border border-amber-200 hover:border-amber-200 transition-all duration-300 focus:outline-none"
          >
            Start Test
          </Link>
        )}
        </span>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          You have {markedCount} marked question{markedCount === 1 ? "" : "s"}.
        </p>
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
                  </span>
                  <Link
                    href={`/test/topic/${cat._id}`}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-400/10 backdrop-blur-md border border-amber-200 hover:border-amber-200 transition-all duration-300 focus:outline-none "
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
    </div>
  );
}