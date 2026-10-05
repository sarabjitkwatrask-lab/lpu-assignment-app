import { createClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string };

// getClaims() verifies the JWT signature, so it is safe to trust on the server
// (unlike getSession(), which only reads the cookie).
export async function getUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
}

// Optional allow-list, e.g. ALLOWED_EMAIL_DOMAINS="lpu.co.in,lpu.in".
// Unset means anyone with a verified account may use the app.
export function isEmailAllowed(email: string): boolean {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS?.trim();
  if (!raw) return true;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
    .includes(domain);
}

// Only allow same-site relative redirects (blocks open-redirect via ?next=).
export function safeNextPath(next: string | null | undefined, fallback = "/generate") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next;
}
