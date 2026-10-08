"use client";

import { useState } from "react";
import type { GeneratedAssignment, QualityLevel, StressTestResult } from "@/lib/schema";

const LEVEL_STYLES: Record<QualityLevel, string> = {
  // Inverted on purpose: for a stress test, an AI scoring low is the good outcome.
  "Not yet demonstrated": "bg-good-soft text-good border-good-line",
  Developing: "bg-ok-soft text-ok border-ok-line",
  Proficient: "bg-bad-soft text-bad border-bad-line",
  Outstanding: "bg-bad-soft text-bad border-bad-line",
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
    <section className="rounded-lg border border-line bg-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            AI Stress Test (guideline section D.1)
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-ink-soft">
            Mandatory before release. Pastes this brief into a capable AI with no further
            guidance, has it produce the best submission it can, then marks that submission
            honestly against your own rubric â€” so you can see up front how much of this task
            an AI alone could already satisfy.
          </p>
        </div>
        <button
          onClick={runStressTest}
          disabled={loading}
          className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent-ink disabled:opacity-50"
        >
          {loading ? "Running stress testâ€¦" : result ? "Re-run stress test" : "Run AI stress test"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-bad">{error}</p>}

      {result && (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3 rounded-md bg-paper p-4">
            <LevelBadge level={result.overallLevel} />
            <span className="text-sm text-ink">
              Overall weighted score: <strong>{result.overallScorePercent}%</strong>
            </span>
          </div>

          <p className="text-sm leading-relaxed text-ink">{result.interpretation}</p>

          {result.substitutableCriteria.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink">
                Substitutable criteria (the AI attempt already reached Proficient or above â€”
                candidates for rewriting under C.4 or reweighting under C.3):
              </p>
              <ul className="mt-1 list-disc pl-5 text-sm text-bad">
                {result.substitutableCriteria.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr className="bg-paper text-left">
                  <th className="p-2">Criterion</th>
                  <th className="p-2">Level</th>
                  <th className="p-2">Why</th>
                </tr>
              </thead>
              <tbody>
                {result.criterionScores.map((c, i) => (
                  <tr key={i} className="border-t border-line align-top">
                    <td className="p-2 font-medium">
                      {c.criterionName}
                      {weightByCriterion.has(c.criterionName) && (
                        <span className="ml-1 text-xs text-ink-faint">
                          ({weightByCriterion.get(c.criterionName)}%)
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <LevelBadge level={c.level} />
                    </td>
                    <td className="p-2 text-ink">{c.justification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink">Recommendations</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink">
                {result.recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <details className="rounded-md border border-line p-3">
            <summary className="cursor-pointer text-sm font-medium text-ink">
              View the AI&apos;s full attempted submission
            </summary>
            <pre className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap text-xs text-ink-soft">
              {result.fullSubmission}
            </pre>
          </details>

          <p className="text-xs text-ink-faint">
            Last run {new Date(result.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </section>
  );
}
