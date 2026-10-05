import type { SupabaseClient } from "@supabase/supabase-js";

export type UsageKind = "generate" | "stress_test";

function dailyLimit(kind: UsageKind): number {
  const raw =
    kind === "generate"
      ? process.env.DAILY_GENERATION_LIMIT
      : process.env.DAILY_STRESS_TEST_LIMIT;
  const parsed = Number.parseInt(raw ?? "", 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return kind === "generate" ? 15 : 10;
}

// Caps per-account AI spend. Counts the user's own rows (RLS-scoped) over the
// last 24 hours, then logs this request.
export async function reserveUsage(
  supabase: SupabaseClient,
  userId: string,
  kind: UsageKind,
): Promise<{ ok: true } | { ok: false; limit: number }> {
  const limit = dailyLimit(kind);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("lpu_usage")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind)
    .gte("created_at", since);

  if (error) throw new Error(`Usage check failed: ${error.message}`);
  if ((count ?? 0) >= limit) return { ok: false, limit };

  const { error: insertError } = await supabase
    .from("lpu_usage")
    .insert({ user_id: userId, kind });
  if (insertError) throw new Error(`Usage log failed: ${insertError.message}`);

  return { ok: true };
}
