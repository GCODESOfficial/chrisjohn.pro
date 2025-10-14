/* eslint-disable @typescript-eslint/no-explicit-any */
// app/login/LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || "Invalid credentials");
      }
      router.replace(nextPath || "/admin");
    } catch (e: any) {
      setErr(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[#0B0B0B] text-white">
      <form onSubmit={onSubmit} className="w-[360px] rounded-xl bg-[#121212] ring-1 ring-white/10 p-6">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-[#B9B9B9]">Enter your admin credentials.</p>

        <div className="mt-5 space-y-3">
          <div>
            <label className="text-xs text-[#AEB4BB]">Username</label>
            <input
              className="mt-1 w-full rounded-md bg-[#141414] ring-1 ring-white/10 px-3 py-2 text-sm outline-none focus:ring-white/20"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-xs text-[#AEB4BB]">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-md bg-[#141414] ring-1 ring-white/10 px-3 py-2 text-sm outline-none focus:ring-white/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {err && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-md p-2">
              {err}
            </div>
          )}

          <button disabled={loading} className="w-full rounded-md bg-white text-black py-2 text-sm font-medium disabled:opacity-60">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
}
