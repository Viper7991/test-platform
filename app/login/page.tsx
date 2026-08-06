"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Invalid email or password");
      return;
    }
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8 bg-gray-50 font-sans">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 bg-white border border-gray-100 rounded-2xl p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold tracking-tight text-center text-gray-900 mb-2">
          Log In
        </h1>

        {error && (
          <p className="text-red-700 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />

        <button
          type="submit"
          className="w-full bg-gray-900 text-white font-medium rounded-lg p-3 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors mt-2"
        >
          Log In
        </button>

        <p className="text-sm text-gray-500 text-center pt-2">
          Don't have an account?{' '}
          <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>

  );
}