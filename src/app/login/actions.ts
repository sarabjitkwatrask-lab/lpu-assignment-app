"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isEmailAllowed, safeNextPath } from "@/lib/auth";

export type AuthState = { error?: string; message?: string } | null;

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    next: safeNextPath(String(formData.get("next") ?? "")),
  };
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password, next } = readCredentials(formData);
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "Please confirm your email first. Check your inbox for the link we sent when you created the account.",
      };
    }
    return { error: "Incorrect email or password." };
  }
  redirect(next);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password, next } = readCredentials(formData);
  if (!email || !password) return { error: "Enter an email and a password." };
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  if (!isEmailAllowed(email)) {
    return { error: "Sign-up is limited to approved institutional email addresses." };
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const origin = h.get("origin") ?? `${proto}://${host}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}` },
  });

  if (error) {
    if (error.code === "weak_password") {
      return { error: "That password is too weak. Try a longer one with a mix of characters." };
    }
    if (error.code === "over_email_send_rate_limit") {
      return { error: "Too many sign-up emails were sent recently. Please wait a few minutes and try again." };
    }
    return { error: "We could not create that account. Please check the details and try again." };
  }

  // Email confirmation off: a session exists immediately.
  if (data.session) redirect(next);

  return {
    message:
      "Almost there. We sent a confirmation link to your email. Open it to finish creating your account, then sign in.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
