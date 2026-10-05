import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listAssignments } from "@/lib/db";

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/history");

  const supabase = await createClient();
  const rows = await listAssignments(supabase);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Your assignments</h1>
        <Link
          href="/generate"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-ink"
        >
          New assignment
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-ink-soft">
          You haven&apos;t generated any assignments yet.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-raised">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/history/${r.id}`} className="block p-5 hover:bg-paper">
                <p className="font-semibold">{r.course_title}</p>
                <p className="mt-0.5 text-sm text-ink-soft">{r.topic}</p>
                <p className="mt-2 text-xs text-ink-faint">
                  {r.discipline} · {r.lane} · {r.ai_role_level} ·{" "}
                  {new Date(r.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
