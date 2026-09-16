import { sql } from "@vercel/postgres";
import type { GeneratedAssignment, StressTestResult } from "./schema";

let schemaReady = false;

export async function ensureSchema() {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      course_title TEXT NOT NULL,
      topic TEXT NOT NULL,
      discipline TEXT NOT NULL,
      lane TEXT NOT NULL,
      ai_role_level TEXT NOT NULL,
      data JSONB NOT NULL,
      stress_test JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  // Additive migration for databases created before the stress-test column existed.
  await sql`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS stress_test JSONB;`;
  schemaReady = true;
}

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

export async function saveAssignment(params: {
  userId: string;
  courseTitle: string;
  topic: string;
  discipline: string;
  lane: string;
  aiRoleLevel: string;
  data: GeneratedAssignment;
}) {
  await ensureSchema();
  const { rows } = await sql`
    INSERT INTO assignments (user_id, course_title, topic, discipline, lane, ai_role_level, data)
    VALUES (${params.userId}, ${params.courseTitle}, ${params.topic}, ${params.discipline}, ${params.lane}, ${params.aiRoleLevel}, ${JSON.stringify(params.data)}::jsonb)
    RETURNING id, created_at;
  `;
  return rows[0] as { id: string; created_at: string };
}

export async function saveStressTest(userId: string, id: string, result: StressTestResult) {
  await ensureSchema();
  await sql`
    UPDATE assignments
    SET stress_test = ${JSON.stringify(result)}::jsonb
    WHERE id = ${id} AND user_id = ${userId};
  `;
}

export async function listAssignments(userId: string) {
  await ensureSchema();
  const { rows } = await sql`
    SELECT id, course_title, topic, discipline, lane, ai_role_level, created_at
    FROM assignments
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 100;
  `;
  return rows as Omit<AssignmentRow, "data" | "user_id" | "stress_test">[];
}

export async function getAssignment(userId: string, id: string) {
  await ensureSchema();
  const { rows } = await sql`
    SELECT id, user_id, course_title, topic, discipline, lane, ai_role_level, data, stress_test, created_at
    FROM assignments
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1;
  `;
  return (rows[0] as AssignmentRow) ?? null;
}
