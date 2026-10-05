import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { GenerateInputSchema, GeneratedAssignmentSchema } from "@/lib/schema";
import {
  AI_ROLE_LEVELS,
  LANES,
  buildSystemPrompt,
  buildUserPrompt,
} from "@/lib/guidelines";
import { saveAssignment } from "@/lib/db";
import { getUser, isEmailAllowed } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { reserveUsage } from "@/lib/usage";

// Opus-class generations can take a minute or two; Vercel Fluid compute allows up to 300s.
export const maxDuration = 300;

export async function POST(req: Request) {
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

  const body = await req.json().catch(() => null);
  const parsedInput = GenerateInputSchema.safeParse(body);
  if (!parsedInput.success) {
    return Response.json(
      { error: "Please check the form: some required fields are missing or too long." },
      { status: 400 },
    );
  }
  const input = parsedInput.data;

  // Level 1 only pairs with Lane A (guideline A.3 / A.4).
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

  const supabase = await createClient();

  const usage = await reserveUsage(supabase, user.id, "generate");
  if (!usage.ok) {
    return Response.json(
      {
        error: `Daily limit reached: ${usage.limit} generations per 24 hours per account. Please try again tomorrow.`,
      },
      { status: 429 },
    );
  }

  const client = new Anthropic();

  let parsed;
  try {
    const response = await client.messages.parse({
      model: process.env.ANTHROPIC_MODEL || "claude-opus-5",
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

  try {
    const saved = await saveAssignment(supabase, {
      userId: user.id,
      courseTitle: input.courseTitle,
      topic: input.topic,
      discipline: input.discipline,
      lane: LANES[input.lane].label,
      aiRoleLevel: AI_ROLE_LEVELS[input.aiRoleLevel].label,
      data: parsed,
    });
    return Response.json({ id: saved.id, result: parsed });
  } catch (err) {
    console.error("Saving assignment failed", err);
    return Response.json(
      { error: "The assignment was generated but could not be saved. Please try again." },
      { status: 500 },
    );
  }
}
