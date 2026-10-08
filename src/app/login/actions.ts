"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowed, safeNextPath } from "@/lib/auth";
import { getOrigin } from "@/lib/origin";

export type AuthState = { error?: string; message?: string; email?: string } | null;

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    next: safeNextPath(String(formData.get("next") ?? "")),
  };
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password, next } = readCredentials(formData);
  if (!email || !password) return { error: "Enter your email and password.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "Please confirm your email first. Check your inbox for the link we sent when you created the account.",
        email,
      };
    }
    return { error: "Incorrect email or password.", email };
  }
  redirect(next);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password, next } = readCredentials(formData);
  if (!email || !password) return { error: "Enter an email and a password.", email };
  if (password.length < 8) return { error: "Use a password of at least 8 characters.", email };
  if (formData.get("consent") !== "on") {
    return { error: "Please confirm that you have read the Privacy Notice and the Terms.", email };
  }
  if (!isEmailAllowed(email)) {
    return { error: "Sign-up is limited to approved institutional email addresses.", email };
  }

  const origin = await getOrigin();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { error: "That password is too weak. Try a longer one with a mix of characters.", email };
    }
    if (error.code === "over_email_send_rate_limit") {
      return { error: "Too many sign-up emails were sent recently. Please wait a few minutes and try again.", email };
    }
    return { error: "We could not create that account. Please check the details and try again.", email };
  }

  // Email confirmation off: a session exists immediately.
  if (data.session) redirect(next);

  return {
    message:
      "Almost there. We sent a confirmation link to your email. Open it to finish creating your account, then sign in.",
    email,
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
