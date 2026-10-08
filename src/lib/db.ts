import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeneratedAssignment, StressTestResult } from "./schema";

// Every query runs as the signed-in user; Postgres row-level security on
// lpu_assignments guarantees users only ever see or change their own rows.

export type AssignmentRow = {
  id: string;
  user_id: string;
  course_title: string;
  topic: string;
  discipline: string;
  lane: string;
  ai_role_level: string;
  data: GeneratedAssignment;
  stress_test: StressTestResult | null;
  created_at: string;
};

export type AssignmentSummary = Pick<
  AssignmentRow,
  "id" | "course_title" | "topic" | "discipline" | "lane" | "ai_role_level" | "created_at"
>;

export async function saveAssignment(
  supabase: SupabaseClient,
  params: {
    userId: string;
    courseTitle: string;
    topic: string;
    discipline: string;
    lane: string;
    aiRoleLevel: string;
    data: GeneratedAssignment;
  },
) {
  const { data, error } = await supabase
    .from("lpu_assignments")
    .insert({
      user_id: params.userId,
      course_title: params.courseTitle,
      topic: params.topic,
      discipline: params.discipline,
      lane: params.lane,
      ai_role_level: params.aiRoleLevel,
      data: params.data,
    })
    .select("id, created_at")
    .single();
  if (error) throw new Error(`Saving the assignment failed: ${error.message}`);
  return data as { id: string; created_at: string };
}

export async function saveStressTest(
  supabase: SupabaseClient,
  id: string,
  result: StressTestResult,
) {
  const { error } = await supabase
    .from("lpu_assignments")
    .update({ stress_test: result })
    .eq("id", id);
  if (error) throw new Error(`Saving the stress test failed: ${error.message}`);
}

export async function listAssignments(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("lpu_assignments")
    .select("id, course_title, topic, discipline, lane, ai_role_level, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Loading history failed: ${error.message}`);
  return (data ?? []) as AssignmentSummary[];
}

export async function getAssignment(supabase: SupabaseClient, id: string) {
  // Reject non-UUIDs up front so a bad URL is a 404, not a database error.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }
  const { data, error } = await supabase
    .from("lpu_assignments")
    .select("id, user_id, course_title, topic, discipline, lane, ai_role_level, data, stress_test, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Loading the assignment failed: ${error.message}`);
  return (data as AssignmentRow | null) ?? null;
}

// Everything the app stores about this user's assignments and usage (RLS limits it to the caller).
export async function exportMyData(supabase: SupabaseClient) {
  const [assignments, usage] = await Promise.all([
    supabase.from("lpu_assignments").select("*").order("created_at", { ascending: true }),
    supabase.from("lpu_usage").select("kind, created_at").order("created_at", { ascending: true }),
  ]);
  if (assignments.error) throw new Error(`Export failed: ${assignments.error.message}`);
  if (usage.error) throw new Error(`Export failed: ${usage.error.message}`);
  return { assignments: assignments.data ?? [], usage: usage.data ?? [] };
}

// Deletes all of the caller's saved assignments. Usage records newer than 24 hours are
// deliberately kept (they back the daily limits); older ones are removed when the
// database policy for that exists, otherwise they are left and handled by the operators.
export async function eraseMyData(supabase: SupabaseClient, userId: string) {
  const { count, error } = await supabase
    .from("lpu_assignments")
    .delete({ count: "exact" })
    .eq("user_id", userId);
  if (error) throw new Error(`Deleting your assignments failed: ${error.message}`);

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("lpu_usage").delete().eq("user_id", userId).lt("created_at", cutoff);

  return { assignmentsDeleted: count ?? 0 };
}

export async function deleteAssignment(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("lpu_assignments").delete().eq("id", id);
  if (error) throw new Error(`Deleting the assignment failed: ${error.message}`);
}
