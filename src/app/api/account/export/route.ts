import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { exportMyData } from "@/lib/db";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return new Response("Please sign in first.", { status: 401 });
  }

  const supabase = await createClient();
  let data;
  try {
    data = await exportMyData(supabase);
  } catch (err) {
    console.error("Account export failed", err);
    return new Response("We could not prepare your file. Please try again.", { status: 500 });
  }

  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), account: { email: user.email }, ...data },
    null,
    2,
  );
  const day = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lpu-app-my-data-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
