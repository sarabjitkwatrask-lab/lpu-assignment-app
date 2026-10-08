import type { SupabaseClient } from "@supabase/supabase-js";

// Decided inside the database: true only for a confirmed email listed in lpu_organisers.
export async function isOrganiser(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("lpu_is_organiser");
  return !error && data === true;
}

export type OrganiserStats = {
  generated_at: string;
  totals: { assignments: number; participants: number; stress_tests: number; first_day: string | null; last_day: string | null };
  last_24h: { generate: number; stress_test: number; people: number };
  by_day: { day: string; kind: string; requests: number; people: number }[];
  by_discipline: { discipline: string; assignments: number }[];
  lane_level: { lane: string; level: string; assignments: number }[];
  miller: { tier: string | null; assignments: number }[];
  oral: { plan: string | null; assignments: number }[];
  stress_overall: { band: string; assignments: number; average_score: number }[];
  stress_by_level: { level: string; stress_tests: number; average_score: number }[];
  families: { family: string; scored: number; substitutable: number; percent: number }[];
  health: {
    total: number;
    lane_b_missing_disclosure: number;
    lane_a_with_ai_level: number;
    lane_b_with_level_1: number;
    rubric_weights_not_100: number;
    no_judgement_criterion: number;
  };
  participants: { code: string; assignments: number; stress_tests: number; first: string; last: string }[];
};

export async function getOrganiserStats(supabase: SupabaseClient): Promise<OrganiserStats> {
  const { data, error } = await supabase.rpc("lpu_organiser_stats");
  if (error) throw new Error(`Loading the summary failed: ${error.message}`);
  return data as OrganiserStats;
}
