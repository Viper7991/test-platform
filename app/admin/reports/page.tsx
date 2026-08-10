"use client";

import Loading from "@/app/components/Loading";
import { useEffect, useState } from "react";

type Report = {
  _id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
  source: string;
  reason: string;
  reporterEmail: string | null;
  status: string;
  createdAt: string;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/reports");
    const data = await res.json();
    setReports(data.reports || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markResolved(id: string) {
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this report?")) return;
    await fetch(`/api/admin/reports/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = reports.filter((r) => filter === "all" || r.status === filter);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">

        {/* Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reported Questions</h1>
            <p className="text-sm text-slate-500 mt-1">Review and manage student feedback on questions.</p>
          </div>

          <div className="inline-flex p-1 bg-slate-200/60 rounded-xl border border-slate-200 shrink-0 overflow-x-auto">
            {(["open", "resolved", "all"] as const).map((f) => {
              const count = reports.filter((r) => f === "all" || r.status === f).length;
              const isSelected = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isSelected
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }`}
                >
                  {f[0].toUpperCase() + f.slice(1)}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isSelected ? "bg-slate-100 text-slate-700" : "bg-slate-200/50 text-slate-500"
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900">No reports found</h3>
            <p className="mt-1 text-sm text-slate-500">There are no {filter !== "all" ? filter : ""} reports matching your current filter.</p>
          </div>
        ) : (
          <ul className="space-y-6">
            {filtered.map((r) => (
              <li key={r._id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <div className="p-6 sm:p-8">

                  {/* Card Header: Question & Status */}
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <p className="text-lg font-semibold text-slate-900 leading-snug">
                      {r.questionText}
                    </p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shrink-0 ${r.status === "open"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.status === "open" ? "bg-rose-500" : "bg-emerald-500"}`}></span>
                      {r.status}
                    </span>
                  </div>

                  {/* Options Breakdown */}
                  <div className="mb-6 bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Options Overview</h4>
                    <ul className="space-y-2.5">
                      {r.options.map((opt) => {
                        const isCorrect = opt === r.correctAnswer;
                        const isSelected = opt === r.selectedAnswer;

                        return (
                          <li key={opt} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg text-sm border transition-colors gap-2 ${isCorrect
                              ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                              : isSelected && !isCorrect
                                ? "bg-amber-50/50 border-amber-200 text-amber-900"
                                : "bg-white border-slate-200 text-slate-600"
                            }`}>
                            <span className="font-medium">{opt}</span>
                            <div className="flex flex-wrap gap-2 shrink-0">
                              {isCorrect && (
                                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                  Correct Answer
                                </span>
                              )}
                              {isSelected && !isCorrect && (
                                <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                  Student Selected
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Reason / Comment */}
                  {r.reason && (
                    <div className="mb-6 bg-blue-50/50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                      <p className="text-sm text-blue-900">
                        <span className="font-semibold block mb-1 text-blue-800 text-xs uppercase tracking-wider">Student's Comment</span>
                        <span className="italic">"{r.reason}"</span>
                      </p>
                    </div>
                  )}

                  {/* Footer: Metadata & Actions */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-5 border-t border-slate-100">

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        {r.source}
                      </div>
                      <span className="hidden md:inline text-slate-300">•</span>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        {r.reporterEmail || "Guest"}
                      </div>
                      <span className="hidden md:inline text-slate-300">•</span>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      {r.status === "open" && (
                        <button
                          onClick={() => markResolved(r._id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Mark Resolved
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(r._id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>

                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}