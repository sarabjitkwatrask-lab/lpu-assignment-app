import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Assignments and rubrics, built to LPU&apos;s AI-era guideline
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Answer a few questions about your course. Get back a complete, LPU-compliant
        Assignment Brief and matching grading rubric — grounded in the Lane, AI Role Level,
        and Miller-tier framework from{" "}
        <span className="italic">
          Designing Assignments and Assessment Rubrics in the AI Era
        </span>
        .
      </p>
      <div className="mt-8">
        <Show when="signed-in">
          <Link
            href="/generate"
            className="inline-block rounded-md bg-slate-900 px-6 py-3 text-white hover:bg-slate-700"
          >
            Create a new assignment
          </Link>
        </Show>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="inline-block rounded-md bg-slate-900 px-6 py-3 text-white hover:bg-slate-700">
              Sign in to get started
            </button>
          </SignInButton>
        </Show>
      </div>
    </div>
  );
}
