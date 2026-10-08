import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrganiserStats, isOrganiser } from "@/lib/organiser";
import { getLimits } from "@/lib/usage";
import OrganiserDashboard from "@/components/OrganiserDashboard";

export const metadata: Metadata = { title: "Organiser | LPU Assignment & Rubric Designer" };

export default async function OrganiserPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/organiser");

  const supabase = await createClient();
  if (!(await isOrganiser(supabase))) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold">This page is for organisers</h1>
        <p className="mt-3 text-ink-soft">
          If you should have access, ask the person who runs the app to add your email address to the
          organiser list.
        </p>
      </div>
    );
  }

  let stats;
  try {
    stats = await getOrganiserStats(supabase);
  } catch (err) {
    console.error("Organiser stats failed", err);
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold">The summary could not load</h1>
        <p className="mt-3 text-ink-soft">Please reload the page. If it keeps happening, check the logs in Vercel.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Organiser overview</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Summaries across everyone who uses the app. No names, emails or assignment text are shown.
      </p>
      <div className="mt-8">
        <OrganiserDashboard
          stats={stats}
          limits={getLimits()}
          ai={{ hasKey: Boolean(process.env.ANTHROPIC_API_KEY), model: process.env.ANTHROPIC_MODEL || "claude-opus-5" }}
        />
      </div>
    </div>
  );
}
