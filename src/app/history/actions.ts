"use server";

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteAssignment } from "@/lib/db";

export async function deleteAssignmentAction(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  // Row-level security restricts this to the signed-in user's own rows.
  await deleteAssignment(supabase, id);
  redirect("/history");
}
