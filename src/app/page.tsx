import Link from "next/link";
import { getUser } from "@/lib/auth";

const STEPS = [
  {
    title: "Answer a few questions",
    body: "Which Lane, which AI Role Level, which Miller tier — explained in plain language, not jargon.",
  },
  {
    title: "Claude drafts both documents",
    body: "A complete LPU Assignment Brief and a matching rubric, weighted to the guideline’s own C.3 bands.",
  },
  {
    title: "Stress-test before you release it",
    body: "See up front, criterion by criterion, how much of the task an AI alone could already satisfy.",
  },
];

export default async function Home() {
  const user = await getUser();

  return (
    <div className="mx-auto max-w-5xl px-6 pb-24 pt-20">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <span className="rounded-full bg-accent-soft px-4 py-1.5 text-[13px] font-semibold text-accent-ink">
          Grounded in LPU&rsquo;s AI-era assessment guideline
        </span>
        <h1 className="text-5xl font-semibold leading-[1.12] tracking-tight">
          Assignments and rubrics, built to LPU&rsquo;s AI-era guideline
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-ink-soft">
          Answer a few questions about your course. Get back a complete, LPU-compliant Assignment
          Brief and matching grading rubric — grounded in the Lane, AI Role Level, and Miller-tier
          framework from &ldquo;Designing Assignments and Assessment Rubrics in the AI Era.&rdquo;
        </p>
        <Link
          href={user ? "/generate" : "/login"}
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-accent-ink"
        >
          {user ? "Create a new assignment" : "Sign in to get started"}
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="mt-20 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="rounded-2xl border border-line bg-raised p-7">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft font-serif text-lg font-semibold text-accent-ink">
              {i + 1}
            </div>
            <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
            <p className="text-sm leading-relaxed text-ink-soft">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
