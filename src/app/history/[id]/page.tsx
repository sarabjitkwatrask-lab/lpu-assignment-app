import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAssignment } from "@/lib/db";
import AssignmentResult from "@/components/AssignmentResult";
import StressTestPanel from "@/components/StressTestPanel";
import { deleteAssignmentAction } from "../actions";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect(`/login?next=/history/${id}`);

  const supabase = await createClient();
  const row = await getAssignment(supabase, id);
  if (!row) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-faint">
          Generated {new Date(row.created_at).toLocaleString("en-IN")}
        </p>
        <div className="flex gap-3">
          <a
            href={`/api/download/${row.id}`}
            className="rounded-lg border border-line bg-raised px-4 py-2 text-sm font-semibold hover:border-ink-faint"
          >
            Download as Word (.docx)
          </a>
          <form action={deleteAssignmentAction}>
            <input type="hidden" name="id" value={row.id} />
            <button
              type="submit"
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold text-bad hover:border-bad-line hover:bg-bad-soft"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
      <AssignmentResult data={row.data} />

      <div className="mt-6">
        <StressTestPanel
          assignmentId={row.id}
          assignment={row.data}
          initialResult={row.stress_test}
        />
      </div>
    </div>
  );
}
