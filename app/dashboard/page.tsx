"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCategoryBreakdown, getOverallStats, CategoryStats } from "@/lib/test-engine/analytics";

export default function DashboardPage() {
  const [breakdown, setBreakdown] = useState<CategoryStats[]>([]);
  const [overall, setOverall] = useState({ totalTests: 0, totalQuestions: 0, overallAccuracy: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBreakdown(getCategoryBreakdown());
    setOverall(getOverallStats());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }

  if (overall.totalTests === 0) {
    return (
      <div className="p-8">
        <p className="text-gray-600 mb-4">No test history yet — take a test to see your analytics.</p>
        <Link href="/" className="text-blue-600 hover:underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Analytics</h1>

      <div className="border rounded-lg p-5 mb-6 flex gap-8">
        <div>
          <p className="text-2xl font-bold">{overall.totalTests}</p>
          <p className="text-sm text-gray-600">Tests Taken</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{overall.totalQuestions}</p>
          <p className="text-sm text-gray-600">Questions Attempted</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{overall.overallAccuracy}%</p>
          <p className="text-sm text-gray-600">Overall Accuracy</p>
        </div>
      </div>

      <h2 className="font-semibold mb-3">Accuracy by Topic (weakest first)</h2>
      <ul className="space-y-2">
        {breakdown.map((stat) => (
          <li key={stat.category} className="border rounded p-3">
            <div className="flex justify-between mb-1">
              <span className="font-medium">{stat.category}</span>
              <span
                className={
                  stat.accuracy < 50
                    ? "text-red-600"
                    : stat.accuracy < 75
                    ? "text-orange-600"
                    : "text-green-600"
                }
              >
                {stat.accuracy}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded h-2">
              <div
                className="bg-black h-2 rounded"
                style={{ width: `${stat.accuracy}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stat.correct} / {stat.attempted} correct
            </p>
          </li>
        ))}
      </ul>

      <Link href="/" className="inline-block mt-6 text-blue-600 hover:underline">
        Back to Home
      </Link>
    </div>
  );
}