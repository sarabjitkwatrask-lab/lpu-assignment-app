import type { ReactNode } from "react";
import AiCheckButton from "./AiCheckButton";
import type { OrganiserStats } from "@/lib/organiser";

type Limits = {
  perPerson: { generate: number; stress_test: number };
  wholeApp: { generate: number; stress_test: number };
};

function Card({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-raised p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {note && <p className="mt-1 text-sm text-ink-soft">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl bg-paper px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-ink-faint">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
            {head.map((h) => (
              <th key={h} className="border-b border-line px-2 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              {r.map((c, j) => (
                <td key={j} className="px-2 py-2 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Bar({ percent }: { percent: number }) {
  const w = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 rounded-full bg-accent-soft">
        <div className="h-2 rounded-full bg-accent" style={{ width: `${w}%` }} />
      </div>
      <span className="tabular-nums">{Math.round(percent)}%</span>
    </div>
  );
}

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-");
const fmtDateTime = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const HEALTH_LABELS: [keyof OrganiserStats["health"], string][] = [
  ["lane_b_missing_disclosure", "Open-lane tasks above Level 1 without a disclosure requirement"],
  ["lane_a_with_ai_level", "Supervised (Lane A) tasks given an AI level above 1"],
  ["lane_b_with_level_1", "Open-lane (Lane B) tasks given Level 1"],
  ["rubric_weights_not_100", "Rubrics whose weights do not add up to 100"],
  ["no_judgement_criterion", "Rubrics with no evaluative-judgement criterion"],
];

export default function OrganiserDashboard({
  stats,
  limits,
  ai,
}: {
  stats: OrganiserStats;
  limits: Limits;
  ai: { hasKey: boolean; model: string };
}) {
  const t = stats.totals;
  const share = (n: number) => (t.assignments ? (100 * n) / t.assignments : 0);
  const days = stats.by_day.reduce<Record<string, { generate: number; stress_test: number }>>((acc, r) => {
    (acc[r.day] ??= { generate: 0, stress_test: 0 })[r.kind === "stress_test" ? "stress_test" : "generate"] = r.requests;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Assignments created" value={t.assignments} sub={`${fmtDate(t.first_day)} to ${fmtDate(t.last_day)}`} />
        <Stat label="People who created one" value={t.participants} />
        <Stat label="Stress tests run" value={t.stress_tests} sub={t.assignments ? `${Math.round(share(t.stress_tests))}% of assignments` : undefined} />
        <Stat
          label="Last 24 hours"
          value={`${stats.last_24h.generate} / ${stats.last_24h.stress_test}`}
          sub={`generations / stress tests, ${stats.last_24h.people} people. App caps: ${limits.wholeApp.generate} / ${limits.wholeApp.stress_test}`}
        />
      </div>

      <Card title="AI connection" note="Run this after changing the key, adding credit, or if people report errors. It makes one tiny, almost free request.">
        <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-ink-soft">Key set in Vercel: </span>
            <strong className={ai.hasKey ? "text-good" : "text-bad"}>{ai.hasKey ? "Yes" : "No"}</strong>
          </p>
          <p>
            <span className="text-ink-soft">Model used: </span>
            <strong>{ai.model}</strong>
          </p>
          <p className="sm:col-span-2 text-ink-soft">
            Limits per person per day: {limits.perPerson.generate} generations, {limits.perPerson.stress_test} stress tests.
          </p>
        </div>
        <AiCheckButton />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Disciplines">
          <Table head={["Discipline", "Assignments"]} rows={stats.by_discipline.map((r) => [r.discipline, r.assignments])} empty="Nothing created yet." />
        </Card>
        <Card title="Lane and AI Role Level">
          <Table head={["Lane", "AI Role Level", "Assignments"]} rows={stats.lane_level.map((r) => [r.lane, r.level, r.assignments])} empty="Nothing created yet." />
        </Card>
        <Card title="Depth of mastery (Miller tier)">
          <Table head={["Tier", "Assignments"]} rows={stats.miller.map((r) => [r.tier ?? "(not recorded)", r.assignments])} empty="Nothing created yet." />
        </Card>
        <Card title="Oral verification plans">
          <Table head={["Plan", "Assignments"]} rows={stats.oral.map((r) => [r.plan ?? "(not recorded)", r.assignments])} empty="Nothing created yet." />
        </Card>
      </div>

      <Card
        title="Stress-test results"
        note="Lower AI scores are the better outcome: they mean the task depends on the student. Outstanding means the task should be redesigned."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Table
            head={["AI overall band", "Assignments", "Average AI score"]}
            rows={stats.stress_overall.map((r) => [r.band, r.assignments, `${r.average_score}%`])}
            empty="No stress tests yet."
          />
          <Table
            head={["AI Role Level", "Stress tests", "Average AI score"]}
            rows={stats.stress_by_level.map((r) => [r.level, r.stress_tests, `${r.average_score}%`])}
            empty="No stress tests yet."
          />
        </div>
        <h3 className="mb-2 mt-6 text-sm font-semibold">Which kinds of criteria can an AI satisfy most easily?</h3>
        <Table
          head={["Criterion family", "Times scored", "AI reached Proficient or above"]}
          rows={stats.families.map((r) => [r.family, r.scored, <Bar key={r.family} percent={Number(r.percent)} />])}
          empty="No stress tests yet."
        />
        <p className="mt-3 text-sm text-ink-soft">
          High figures for Process, Judgement or Contextual grounding suggest those rubric descriptions need rewriting as decisions a student makes.
        </p>
      </Card>

      <Card title="Does the output follow the guideline?" note="Each figure should normally be 0. A higher number deserves a closer look.">
        <Table
          head={["Check", "Assignments"]}
          rows={[
            ...HEALTH_LABELS.map(([k, label]) => [
              label,
              <span key={k} className={stats.health[k] > 0 ? "font-semibold text-bad" : "text-good"}>
                {stats.health[k]}
              </span>,
            ]),
            [<span key="t" className="text-ink-soft">Total assignments checked</span>, stats.health.total],
          ]}
          empty=""
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Activity by day (last 30 days, India time)">
          <Table
            head={["Day", "Generations", "Stress tests"]}
            rows={Object.entries(days).map(([day, v]) => [fmtDate(day), v.generate, v.stress_test])}
            empty="No activity yet."
          />
        </Card>
        <Card title="Participants (anonymous codes)" note="Shows the 100 most active. Codes cannot be traced to a name or email from this page.">
          <Table
            head={["Code", "Assignments", "Stress tests", "Last active"]}
            rows={stats.participants.map((p) => [<span key={p.code} className="font-mono">{p.code}</span>, p.assignments, p.stress_tests, fmtDateTime(p.last)])}
            empty="No participants yet."
          />
        </Card>
      </div>

      <p className="text-xs text-ink-faint">Updated {fmtDateTime(stats.generated_at)}. Reload the page to refresh.</p>
    </div>
  );
}
