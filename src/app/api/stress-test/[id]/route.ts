import { auth } from "@clerk/nextjs/server";
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

export const maxDuration = 120;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const row = await getAssignment(userId, id);
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const client = new Anthropic();
  const data = row.data;

  // Step 1-2 of D.1: hand the brief to a capable model with no further
  // guidance and let it produce the best submission it can.
  let submission: string;
  try {
    const attempt = await client.messages.create({
      model: "claude-opus-5",
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

  // Step 3-5 of D.1: mark that output honestly against the rubric, criterion by criterion.
  let marking;
  try {
    const markingResponse = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 8000,
      system: buildStressTestMarkingSystemPrompt(),
      messages: [
        { role: "user", content: buildStressTestMarkingUserPrompt(data, submission) },
      ],
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

  await saveStressTest(userId, id, result);

  return Response.json({ result });
}
