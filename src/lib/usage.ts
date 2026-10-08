import type { SupabaseClient } from "@supabase/supabase-js";

export type UsageKind = "generate" | "stress_test";

function intFromEnv(name: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(name ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Per person, per rolling 24 hours.
function userLimit(kind: UsageKind): number {
  return kind === "generate"
    ? intFromEnv(process.env.DAILY_GENERATION_LIMIT, 15)
    : intFromEnv(process.env.DAILY_STRESS_TEST_LIMIT, 10);
}

// For the whole app, per rolling 24 hours. Protects the AI budget even if someone
// creates many accounts.
function globalLimit(kind: UsageKind): number {
  return kind === "generate"
    ? intFromEnv(process.env.GLOBAL_DAILY_GENERATION_LIMIT, 300)
    : intFromEnv(process.env.GLOBAL_DAILY_STRESS_TEST_LIMIT, 150);
}

export function getLimits() {
  return {
    perPerson: { generate: userLimit("generate"), stress_test: userLimit("stress_test") },
    wholeApp: { generate: globalLimit("generate"), stress_test: globalLimit("stress_test") },
  };
}

export type Reservation =
  | { ok: true }
  | { ok: false; reason: "user_limit" | "global_limit"; limit: number };

// Checks both limits and records the request in one atomic database step.
export async function reserveUsage(supabase: SupabaseClient, kind: UsageKind): Promise<Reservation> {
  const { data, error } = await supabase.rpc("lpu_reserve_usage", {
    p_kind: kind,
    p_user_limit: userLimit(kind),
    p_global_limit: globalLimit(kind),
  });
  if (error) throw new Error(`Usage check failed: ${error.message}`);

  const result = data as { ok: boolean; reason?: string; limit?: number } | null;
  if (result?.ok) return { ok: true };
  if (result?.reason === "user_limit" || result?.reason === "global_limit") {
    return { ok: false, reason: result.reason, limit: result.limit ?? 0 };
  }
  throw new Error(`Usage check refused: ${result?.reason ?? "unknown"}`);
}

export function limitMessage(r: Extract<Reservation, { ok: false }>, what: "generations" | "stress tests") {
  return r.reason === "user_limit"
    ? `Daily limit reached: ${r.limit} ${what} per 24 hours per account. Please try again tomorrow.`
    : `The app has reached its daily capacity for ${what}. Please try again tomorrow.`;
}
