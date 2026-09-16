"use client";

import { useState } from "react";
import type { GeneratedAssignment, QualityLevel, StressTestResult } from "@/lib/schema";

const LEVEL_STYLES: Record<QualityLevel, string> = {
  "Not yet demonstrated": "bg-emerald-100 text-emerald-800 border-emerald-300",
  Developing: "bg-lime-100 text-lime-800 border-lime-300",
  Proficient: "bg-amber-100 text-amber-800 border-amber-300",
  Outstanding: "bg-rose-100 text-rose-800 border-rose-300",
};

function LevelBadge({ level }: { level: QualityLevel }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${LEVEL_STYLES[level]}`}
    >
      {level}
    </span>
  );
}

export default function StressTestPanel({
  assignmentId,
  assignment,
  initialResult,
}: {
  assignmentId: string;
  assignment: GeneratedAssignment;
  initialResult?: StressTestResult | null;
}) {
  const [result, setResult] = useState<StressTestResult | null>(initialResult ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runStressTest() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stress-test/${assignmentId}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      setResult(json.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const weightByCriterion = new Map(assignment.rubric.map((c) => [c.name, c.weightPercent]));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            AI Stress Test (guideline section D.1)
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            Mandatory before release. Pastes this brief into a capable AI with no further
            guidance, has it produce the best submission it can, then marks that submission
            honestly against your own rubric — so you can see up front how much of this task
            an AI alone could already satisfy.
          </p>
        </div>
        <button
          onClick={runStressTest}
          disabled={loading}
          className="shrink-0 rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Running stress test…" : result ? "Re-run stress test" : "Run AI stress test"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {result && (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3 rounded-md bg-slate-50 p-4">
            <LevelBadge level={result.overallLevel} />
            <span className="text-sm text-slate-700">
              Overall weighted score: <strong>{result.overallScorePercent}%</strong>
            </span>
          </div>

          <p className="text-sm leading-relaxed text-slate-800">{result.interpretation}</p>

          {result.substitutableCriteria.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700">
                Substitutable criteria (the AI attempt already reached Proficient or above —
                candidates for rewriting under C.4 or reweighting under C.3):
              </p>
              <ul className="mt-1 list-disc pl-5 text-sm text-rose-700">
                {result.substitutableCriteria.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="p-2">Criterion</th>
                  <th className="p-2">Level</th>
                  <th className="p-2">Why</th>
                </tr>
              </thead>
              <tbody>
                {result.criterionScores.map((c, i) => (
                  <tr key={i} className="border-t border-slate-200 align-top">
                    <td className="p-2 font-medium">
                      {c.criterionName}
                      {weightByCriterion.has(c.criterionName) && (
                        <span className="ml-1 text-xs text-slate-400">
                          ({weightByCriterion.get(c.criterionName)}%)
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <LevelBadge level={c.level} />
                    </td>
                    <td className="p-2 text-slate-700">{c.justification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700">Recommendations</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {result.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <details className="rounded-md border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              View the AI&apos;s full attempted submission
            </summary>
            <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap text-xs text-slate-600">
              {result.fullSubmission}
            </pre>
          </details>

          <p className="text-xs text-slate-400">
            Last run {new Date(result.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </section>
  );
}
