import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { listAssignments } from "@/lib/db";

export default async function HistoryPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const rows = await listAssignments(userId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Your assignments</h1>
        <Link
          href="/generate"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          New assignment
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          You haven&apos;t generated any assignments yet.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {rows.map((r) => (
            <li key={r.id} className="p-4 hover:bg-slate-50">
              <Link href={`/history/${r.id}`} className="block">
                <p className="font-medium text-slate-900">{r.course_title}</p>
                <p className="text-sm text-slate-500">{r.topic}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {r.discipline} · {r.lane} · {r.ai_role_level} ·{" "}
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
