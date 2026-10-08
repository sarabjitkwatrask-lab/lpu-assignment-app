import Anthropic from "@anthropic-ai/sdk";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isOrganiser } from "@/lib/organiser";

export const maxDuration = 60;

type Check = { ok: boolean; title: string; detail: string; model: string; ms?: number };

// A tiny, cheap request that tells an organiser whether the AI connection works and, if not, why.
export async function POST() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Please sign in first." }, { status: 401 });

  const supabase = await createClient();
  if (!(await isOrganiser(supabase))) {
    return Response.json({ error: "This test is for organisers." }, { status: 403 });
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-opus-5";
  const respond = (c: Omit<Check, "model">) => Response.json({ ...c, model } satisfies Check);

  if (!process.env.ANTHROPIC_API_KEY) {
    return respond({
      ok: false,
      title: "No AI key is set",
      detail: "Add ANTHROPIC_API_KEY in Vercel (Settings, Environment Variables), then redeploy.",
    });
  }

  const started = Date.now();
  try {
    const client = new Anthropic();
    await client.messages.create({
      model,
      max_tokens: 64,
      messages: [{ role: "user", content: "Reply with the single word OK." }],
    });
    return respond({
      ok: true,
      title: "The AI connection works",
      detail: "The key, the credit and the model name are all accepted.",
      ms: Date.now() - started,
    });
  } catch (err) {
    console.error("AI connection check failed", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : "";
    if (err instanceof Anthropic.AuthenticationError) {
      return respond({ ok: false, title: "The AI key was rejected", detail: "The key in Vercel is wrong or has been deleted. Create a new key at console.anthropic.com and paste it into ANTHROPIC_API_KEY." });
    }
    if (err instanceof Anthropic.PermissionDeniedError) {
      return respond({ ok: false, title: "The key is not allowed to do this", detail: "The key may belong to a workspace without access to this model. Check the key at console.anthropic.com." });
    }
    if (err instanceof Anthropic.NotFoundError) {
      return respond({ ok: false, title: "The model name is not available", detail: `Vercel is set to use "${model}", which Anthropic does not recognise for your account. Set ANTHROPIC_MODEL to a current model name, or remove it to use the default.` });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return respond({ ok: false, title: "Too many requests right now", detail: "Anthropic is limiting requests. Wait a minute and test again." });
    }
    if (/credit balance|billing|payment/i.test(message)) {
      return respond({ ok: false, title: "The AI account has no credit", detail: "Add credit under Billing at console.anthropic.com, then test again." });
    }
    if (err instanceof Anthropic.APIConnectionError) {
      return respond({ ok: false, title: "Could not reach the AI service", detail: "A network problem. Test again in a minute." });
    }
    return respond({ ok: false, title: "The AI service returned an error", detail: "See the logs in Vercel for details, or try again in a minute." });
  }
}
