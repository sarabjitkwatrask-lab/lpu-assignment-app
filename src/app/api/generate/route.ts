import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { GenerateInputSchema, GeneratedAssignmentSchema } from "@/lib/schema";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/guidelines";
import { saveAssignment } from "@/lib/db";
import { AI_ROLE_LEVELS, LANES } from "@/lib/guidelines";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsedInput = GenerateInputSchema.safeParse(body);
  if (!parsedInput.success) {
    return Response.json(
      { error: "Invalid input", details: parsedInput.error.flatten() },
      { status: 400 },
    );
  }
  const input = parsedInput.data;

  // Enforce: Level 1 only pairs with Lane A (per the guideline's Lane table).
  if (input.aiRoleLevel === "L1" && input.lane !== "A") {
    return Response.json(
      { error: "AI Role Level 1 (No AI) is only valid with Lane A (supervised)." },
      { status: 400 },
    );
  }
  if (input.aiRoleLevel !== "L1" && input.lane === "A") {
    return Response.json(
      {
        error:
          "AI Role Levels 2-5 are designed for Lane B (open) tasks. Choose Lane B, or switch to Level 1 for a supervised Lane A task.",
      },
      { status: 400 },
    );
  }

  const client = new Anthropic();

  let parsed;
  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: buildSystemPrompt(),
      messages: [
        {
          role: "user",
          content: buildUserPrompt({
            courseCode: input.courseCode,
            courseTitle: input.courseTitle,
            topic: input.topic,
            discipline: input.discipline,
            courseOutcome: input.courseOutcome,
            protectedKSAs: input.protectedKSAs,
            totalMarks: input.totalMarks,
            lane: input.lane,
            aiRoleLevel: input.aiRoleLevel,
            millerTier: input.millerTier,
            contextAnchor: input.contextAnchor,
            oralVerification: input.oralVerification,
            dueDate: input.dueDate,
          }),
        },
      ],
      output_config: { format: zodOutputFormat(GeneratedAssignmentSchema) },
    });
    parsed = response.parsed_output;
  } catch (err) {
    console.error("Claude generation failed", err);
    return Response.json(
      { error: "The AI model request failed. Please try again in a moment." },
      { status: 502 },
    );
  }

  if (!parsed) {
    return Response.json(
      { error: "The model's output could not be parsed. Please try again." },
      { status: 502 },
    );
  }

  const saved = await saveAssignment({
    userId,
    courseTitle: input.courseTitle,
    topic: input.topic,
    discipline: input.discipline,
    lane: LANES[input.lane].label,
    aiRoleLevel: AI_ROLE_LEVELS[input.aiRoleLevel].label,
    data: parsed,
  });

  return Response.json({ id: saved.id, result: parsed });
}
