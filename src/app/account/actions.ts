"use server";

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { eraseMyData } from "@/lib/db";

export async function deleteMyData(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");

  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") {
    redirect("/account?error=confirm");
  }

  const supabase = await createClient();
  const { assignmentsDeleted } = await eraseMyData(supabase, user.id);
  redirect(`/account?deleted=${assignmentsDeleted}`);
}
