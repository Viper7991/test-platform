"use client";

import React, { useState, useEffect } from "react";

type Props = {
  message?: string;
};

const examTips = [
  "Sharpening your virtual pencils...",
  "Tip: Eliminate obviously wrong answers first.",
  "Warming up the grading engine...",
  "Tip: Don't spend too much time on a single question.",
  "Gathering your practice questions...",
  "Tip: Take a deep breath. You've prepared for this!",
];

export default function Loading({ message = "Preparing your Page..." }: Props) {
  const [tipIndex, setTipIndex] = useState(0);

  // Cycle through the exam tips every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % examTips.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full p-8 overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
      
      {/* Background Glowing Orbs for depth */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-400/20 rounded-full blur-[80px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] animate-pulse delay-700" />

      {/* Central Animated Graphic */}
      <div className="relative flex items-center justify-center w-40 h-40 mb-8">
        
        {/* Outer Dashed Orbit */}
        <div className="absolute inset-0 border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-full animate-[spin_8s_linear_infinite]" />
        
        {/* Middle Golden Ring */}
        <div className="absolute inset-4 border-t-4 border-r-4 border-amber-400 rounded-full animate-[spin_3s_linear_infinite]" />
        
        {/* Inner Blue Ring */}
        <div className="absolute inset-8 border-b-4 border-l-4 p-5 border-blue-600 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
        
        {/* Pulsing Academic Book Icon */}
        <div className="absolute flex items-center justify-center mt-6 w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.3)] z-10 animate-bounce">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8 text-amber-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
      </div>

      {/* Main Loading Message with Gradient Text */}
      <h2 className="z-10 text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-blue-600 animate-pulse mb-4 text-center">
        {message}
      </h2>

      {/* Rotating Exam Tips Container */}
      <div className="z-10 h-10 flex items-center justify-center text-center">
        <p
          key={tipIndex} // The key forces React to replay the fade-in animation on change
          className="text-sm md:text-base font-medium text-slate-500 dark:text-slate-400 animate-[fadeIn_0.5s_ease-in-out]"
        >
          {examTips[tipIndex]}
        </p>
      </div>

      {/* Inline Styles for the custom fade animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `,
      }} />
    </div>
  );
}