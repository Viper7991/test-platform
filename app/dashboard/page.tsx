"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCategoryBreakdown, getOverallStats, CategoryStats } from "@/lib/test-engine/analytics";
import { useRouter } from 'next/navigation';
import { ArrowLeft02Icon } from 'hugeicons-react';
import Loading from "../components/Loading";
import {
  getCloudCategoryBreakdown,
  getCloudOverallStats,
} from "@/lib/test-engine/analytics";

export default function DashboardPage() {
  const [breakdown, setBreakdown] = useState<CategoryStats[]>([]);
  const [overall, setOverall] = useState({ totalTests: 0, totalQuestions: 0, overallAccuracy: 0 });
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      const loggedIn = !!meData.user;

      if (loggedIn) {
        const [cloudBreakdown, cloudOverall] = await Promise.all([
          getCloudCategoryBreakdown(),
          getCloudOverallStats(),
        ]);
        setBreakdown(cloudBreakdown);
        setOverall(cloudOverall);
      } else {
        setBreakdown(getCategoryBreakdown());
        setOverall(getOverallStats());
      }

      setLoaded(true);
    }
    load();
  }, []);

  if (!loaded) {
    return <Loading />;
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
    <div className="max-w-screen min-h-screen bg-white dark:bg-slate-900">
      <div className="p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/')}
            aria-label="Back to Home"
            className="inline-flex items-center justify-center p-1.5 rounded-xl border border-white/70 text-white font-bold bg-transparent transition-all duration-300 ease-in-out hover:border-amber-200 hover:text-amber-200 hover:bg-amber-400/5 hover:shadow-[0_0_18px_rgba(251,191,36,0.6)] hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          >
            <ArrowLeft02Icon size={20} />
          </button>
          <h1 className="text-2xl font-bold">Your Analytics</h1>
        </div>

        <div className="border rounded-lg p-5 mb-6 flex justify-between bg-gray-500/20">
          <div className="flex flex-col items-center justify-center">
            <p className="text-2xl font-bold">{overall.totalTests}</p>
            <p className="text-sm text-gray-400 ml-4 md:ml-0">Tests Taken</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-2xl font-bold">{overall.totalQuestions}</p>
            <p className="text-sm text-gray-400 ml-6 md:ml-0">Questions Attempted</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-2xl font-bold">{overall.overallAccuracy}%</p>
            <p className="text-sm text-gray-400 ml-4 md:ml-0">Overall Accuracy</p>
          </div>
        </div>

        <h2 className="font-semibold mb-3">Accuracy by Topic (weakest first)</h2>
        <ul className="space-y-2">
          {breakdown.map((stat) => (
            <li key={stat.category} className="border rounded p-3 bg-gray-500/20">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{stat.category}</span>
                <span
                  className={
                    stat.accuracy < 50
                      ? "text-red-600"
                      : stat.accuracy < 75
                        ? "text-orange-600"
                        : "text-green-500"
                  }
                >
                  {stat.accuracy}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded h-2">
                <div
                  className="h-2 rounded bg-gradient-to-r from-red-500 via-yellow-400 to-green-500"
                  style={{ width: `${stat.accuracy}%` }}
                />
              </div>
              <p className="text-xs text-gray-100 mt-1.5">
                {stat.correct} / {stat.attempted} correct
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}