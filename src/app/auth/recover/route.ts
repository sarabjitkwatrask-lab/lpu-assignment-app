import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for the link in the "reset your password" email. It turns the
// one-time code into a short-lived session, then sends the user to choose a new password.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") as EmailOtpType | null) ?? "recovery";

  const supabase = await createClient();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  const destination = request.nextUrl.clone();
  destination.search = "";
  if (ok) {
    destination.pathname = "/reset-password";
  } else {
    destination.pathname = "/forgot-password";
    destination.searchParams.set(
      "error",
      "That reset link is invalid or has expired. Open the link on the same device and browser where you asked for it, or request a new one below.",
    );
  }
  return NextResponse.redirect(destination);
}
