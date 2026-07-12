"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(email, password);
      setToken(result.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-6">
      <div className="w-full max-w-sm console-card rounded-lg p-8">
        <div className="flex mb-6 rounded-md bg-slate-800 p-1 font-mono text-sm">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-1.5 rounded transition-colors ${
              mode === "login" ? "bg-indigo-500 text-white" : "text-slate-400"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-1.5 rounded transition-colors ${
              mode === "signup" ? "bg-indigo-500 text-white" : "text-slate-400"
            }`}
          >
            Sign up
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1 font-mono">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2.5 text-slate-100 input-focus-glow"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1 font-mono">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2.5 text-slate-100 input-focus-glow"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full font-mono px-6 py-2.5 rounded bg-indigo-500 text-white hover:bg-indigo-400 transition-colors disabled:opacity-50"
          >
            {loading ? "Working..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
