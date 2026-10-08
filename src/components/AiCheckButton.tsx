"use client";

import { useState } from "react";

type Result = { ok: boolean; title: string; detail: string; model: string; ms?: number };

export default function AiCheckButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/organiser/ai-check", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "The test could not run.");
      setResult(json as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The test could not run.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60"
      >
        {loading ? "Testing…" : "Test the AI connection"}
      </button>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      {result && (
        <div
          role="status"
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${result.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}
        >
          <p className="font-semibold">{result.title}</p>
          <p className="mt-0.5">{result.detail}</p>
          <p className="mt-1 text-xs opacity-80">
            Model: {result.model}
            {result.ms ? ` · ${(result.ms / 1000).toFixed(1)} s` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
