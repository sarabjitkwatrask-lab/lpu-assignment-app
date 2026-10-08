"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/origin";

export type ResetRequestState = { error?: string; message?: string } | null;

export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Enter the email address you signed up with." };
  }

  const origin = await getOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/recover`,
  });

  if (error) {
    if (error.code === "over_email_send_rate_limit") {
      return {
        error:
          "Too many reset emails were requested recently. Please wait a few minutes and try again.",
      };
    }
    console.error("Password reset request failed", error.code);
    return { error: "We could not send the email. Please check the address and try again." };
  }

  // Same answer whether or not the address has an account, so the page cannot
  // be used to find out who is registered.
  return {
    message:
      "If an account exists for that email, we have sent a link to reset the password. Open the link on this same device and browser. Check your Spam or Junk folder if it does not arrive within a few minutes.",
  };
}
