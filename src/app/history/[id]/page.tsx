import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getAssignment } from "@/lib/db";
import AssignmentResult from "@/components/AssignmentResult";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { id } = await params;
  const row = await getAssignment(userId, id);
  if (!row) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Generated {new Date(row.created_at).toLocaleString()}
        </p>
        <a
          href={`/api/download/${row.id}`}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
        >
          Download as Word (.docx)
        </a>
      </div>
      <AssignmentResult data={row.data} />
    </div>
  );
}
