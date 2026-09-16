"use client";

import { useState } from "react";
import Link from "next/link";
import AssignmentResult from "@/components/AssignmentResult";
import StressTestPanel from "@/components/StressTestPanel";
import type { GeneratedAssignment } from "@/lib/schema";
import {
  AI_ROLE_LEVELS,
  DISCIPLINES,
  LANES,
  MILLER_TIERS,
  ORAL_VERIFICATION_OPTIONS,
  type AiLevelKey,
  type LaneKey,
} from "@/lib/guidelines";

const aiLevelKeys = Object.keys(AI_ROLE_LEVELS) as AiLevelKey[];

export default function GeneratePage() {
  const [lane, setLane] = useState<LaneKey>("B");
  const [aiRoleLevel, setAiRoleLevel] = useState<AiLevelKey>("L3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; data: GeneratedAssignment } | null>(
    null,
  );

  const availableLevels = aiLevelKeys.filter((k) => AI_ROLE_LEVELS[k].lane === lane);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      courseCode: String(form.get("courseCode") ?? ""),
      courseTitle: String(form.get("courseTitle") ?? ""),
      discipline: String(form.get("discipline") ?? ""),
      topic: String(form.get("topic") ?? ""),
      courseOutcome: String(form.get("courseOutcome") ?? ""),
      protectedKSAs: String(form.get("protectedKSAs") ?? ""),
      totalMarks: String(form.get("totalMarks") ?? ""),
      lane,
      aiRoleLevel,
      millerTier: String(form.get("millerTier") ?? ""),
      contextAnchor: String(form.get("contextAnchor") ?? ""),
      oralVerification: String(form.get("oralVerification") ?? ""),
      dueDate: String(form.get("dueDate") ?? ""),
    };

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Something went wrong.");
      }
      setResult({ id: json.id, data: json.result });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Create a new assignment</h1>
      <p className="mt-1 text-sm text-slate-600">
        Answer these questions and the app will apply LPU&apos;s Lane / AI Role Level /
        Miller tier framework to build a compliant brief and rubric.
      </p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Course code</label>
          <input
            name="courseCode"
            placeholder="e.g. CSE301"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Course title <span className="text-rose-600">*</span>
          </label>
          <input
            name="courseTitle"
            required
            placeholder="e.g. Database Management Systems"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Discipline / School <span className="text-rose-600">*</span>
          </label>
          <select
            name="discipline"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Total marks</label>
          <input
            name="totalMarks"
            placeholder="e.g. 20"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Topic / theme for this assignment <span className="text-rose-600">*</span>
          </label>
          <input
            name="topic"
            required
            placeholder="e.g. Designing a normalized schema for a campus service"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Course Outcome this task assesses <span className="text-rose-600">*</span>
          </label>
          <textarea
            name="courseOutcome"
            required
            rows={2}
            placeholder="Paste the CO wording, e.g. 'CO3: Design and normalize relational database schemas for real-world applications.'"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Protected KSAs (skills that must be proven without relying on AI)
          </label>
          <input
            name="protectedKSAs"
            placeholder="Leave blank and the app will infer 2-3, or list your own, comma-separated"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <fieldset className="md:col-span-2">
          <legend className="text-sm font-medium text-slate-700">
            Will students complete this under your supervision, or on their own time?
          </legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {(Object.keys(LANES) as LaneKey[]).map((key) => (
              <label
                key={key}
                className={`cursor-pointer rounded-md border p-3 text-sm ${
                  lane === key ? "border-slate-900 bg-slate-50" : "border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="laneRadio"
                  className="mr-2"
                  checked={lane === key}
                  onChange={() => {
                    setLane(key);
                    const firstValid = aiLevelKeys.find(
                      (k) => AI_ROLE_LEVELS[k].lane === key,
                    );
                    if (firstValid) setAiRoleLevel(firstValid);
                  }}
                />
                <strong>{LANES[key].label}</strong>
                <p className="mt-1 text-xs text-slate-500">{LANES[key].description}</p>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            How much should AI tools be part of this task?
          </label>
          <select
            value={aiRoleLevel}
            onChange={(e) => setAiRoleLevel(e.target.value as AiLevelKey)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {availableLevels.map((k) => (
              <option key={k} value={k}>
                {AI_ROLE_LEVELS[k].label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">{AI_ROLE_LEVELS[aiRoleLevel].plain}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            How deep should mastery go?
          </label>
          <select
            name="millerTier"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {Object.entries(MILLER_TIERS).map(([key, desc]) => (
              <option key={key} value={key}>
                {desc}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Context anchor (the site, dataset, client, or case that makes this submission
            theirs)
          </label>
          <textarea
            name="contextAnchor"
            rows={2}
            placeholder="Leave blank and the app will propose one appropriate to your discipline"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Oral verification
          </label>
          <select
            name="oralVerification"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {ORAL_VERIFICATION_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Due date (optional)
          </label>
          <input
            name="dueDate"
            placeholder="e.g. 3 weeks from issue"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-6 py-3 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate assignment & rubric"}
          </button>
          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        </div>
      </form>

      {result && (
        <div className="mt-12 border-t border-slate-200 pt-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">Saved to your history.</p>
            <div className="flex gap-3">
              <a
                href={`/api/download/${result.id}`}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
              >
                Download as Word (.docx)
              </a>
              <Link
                href="/history"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
              >
                View history
              </Link>
            </div>
          </div>
          <AssignmentResult data={result.data} />

          <div className="mt-6">
            <StressTestPanel assignmentId={result.id} assignment={result.data} />
          </div>
        </div>
      )}
    </div>
  );
}
