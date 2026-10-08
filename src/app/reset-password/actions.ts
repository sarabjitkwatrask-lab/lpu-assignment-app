"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

export type NewPasswordState = { error?: string } | null;

export async function updatePassword(
  _prev: NewPasswordState,
  formData: FormData,
): Promise<NewPasswordState> {
  const user = await getUser();
  if (!user) {
    redirect(
      "/forgot-password?error=" +
        encodeURIComponent("Your reset link has expired. Please request a new one."),
    );
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords do not match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") {
      return { error: "Choose a password different from your old one." };
    }
    if (error.code === "weak_password") {
      return { error: "That password is too weak. Try a longer one with a mix of characters." };
    }
    console.error("Password update failed", error.code);
    return { error: "We could not change the password. Please request a new reset link." };
  }

  redirect("/generate");
}
