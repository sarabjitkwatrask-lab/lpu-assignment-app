import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { StressTestMarkingSchema, type StressTestResult } from "@/lib/schema";
import {
  buildStressTestAttemptSystemPrompt,
  buildStressTestAttemptUserPrompt,
  buildStressTestMarkingSystemPrompt,
  buildStressTestMarkingUserPrompt,
  computeOverallStressTestScore,
  STRESS_TEST_INTERPRETATION,
} from "@/lib/guidelines";
import { getAssignment, saveStressTest } from "@/lib/db";
import { getUser, isEmailAllowed } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { reserveUsage } from "@/lib/usage";

// Two sequential model calls (attempt, then marking); Fluid compute allows up to 300s.
export const maxDuration = 300;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Please sign in first." }, { status: 401 });
  }
  if (!isEmailAllowed(user.email)) {
    return Response.json(
      { error: "Your email domain is not enabled for this app." },
      { status: 403 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "The AI service is not configured yet (missing ANTHROPIC_API_KEY)." },
      { status: 503 },
    );
  }

  const { id } = await params;
  const supabase = await createClient();
  const row = await getAssignment(supabase, id);
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const usage = await reserveUsage(supabase, user.id, "stress_test");
  if (!usage.ok) {
    return Response.json(
      {
        error: `Daily limit reached: ${usage.limit} stress tests per 24 hours per account. Please try again tomorrow.`,
      },
      { status: 429 },
    );
  }

  const client = new Anthropic();
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-5";
  const data = row.data;

  // Steps 1-2 of D.1: hand the brief to a capable model with no further
  // guidance and let it produce the best submission it can.
  let submission: string;
  try {
    const attempt = await client.messages.create({
      model,
      max_tokens: 8000,
      system: buildStressTestAttemptSystemPrompt(),
      messages: [{ role: "user", content: buildStressTestAttemptUserPrompt(data) }],
    });
    submission = attempt.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  } catch (err) {
    console.error("Stress test attempt call failed", err);
    return Response.json(
      { error: "The AI model request failed while attempting the assignment. Please try again." },
      { status: 502 },
    );
  }

  if (!submission.trim()) {
    return Response.json(
      { error: "The model returned an empty attempt. Please try again." },
      { status: 502 },
    );
  }

  // Steps 3-5 of D.1: mark that output honestly against the rubric, criterion by criterion.
  let marking;
  try {
    const markingResponse = await client.messages.parse({
      model,
      max_tokens: 8000,
      system: buildStressTestMarkingSystemPrompt(),
      messages: [{ role: "user", content: buildStressTestMarkingUserPrompt(data, submission) }],
      output_config: { format: zodOutputFormat(StressTestMarkingSchema) },
    });
    marking = markingResponse.parsed_output;
  } catch (err) {
    console.error("Stress test marking call failed", err);
    return Response.json(
      { error: "The AI model request failed while marking the attempt. Please try again." },
      { status: 502 },
    );
  }

  if (!marking) {
    return Response.json(
      { error: "The marking output could not be parsed. Please try again." },
      { status: 502 },
    );
  }

  const { overallScorePercent, overallLevel } = computeOverallStressTestScore(
    data.rubric,
    marking.criterionScores,
  );

  const substitutableCriteria = marking.criterionScores
    .filter((c) => c.level === "Outstanding" || c.level === "Proficient")
    .map((c) => c.criterionName);

  const result: StressTestResult = {
    fullSubmission: submission,
    criterionScores: marking.criterionScores,
    recommendations: marking.recommendations,
    overallLevel,
    overallScorePercent,
    interpretation: STRESS_TEST_INTERPRETATION[overallLevel],
    substitutableCriteria,
    generatedAt: new Date().toISOString(),
  };

  try {
    await saveStressTest(supabase, id, result);
  } catch (err) {
    console.error("Saving stress test failed", err);
    // Still return the result so the user is not left empty-handed.
  }

  return Response.json({ result });
}
