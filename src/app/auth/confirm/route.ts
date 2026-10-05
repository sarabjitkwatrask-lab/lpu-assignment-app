import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth";

// Handles the link in Supabase's confirmation email. Supports both the default
// PKCE email template (?code=...) and a token-hash template (?token_hash=...&type=...).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createClient();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  const destination = request.nextUrl.clone();
  destination.search = "";
  if (ok) {
    destination.pathname = next;
  } else {
    destination.pathname = "/login";
    destination.searchParams.set(
      "error",
      "That confirmation link is invalid or has expired. Try signing in, or create the account again.",
    );
  }
  return NextResponse.redirect(destination);
}
