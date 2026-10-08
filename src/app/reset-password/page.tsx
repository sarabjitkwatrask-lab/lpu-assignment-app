import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import ResetForm from "./reset-form";

export default async function ResetPasswordPage() {
  // Only reachable with a valid session, which the emailed link creates.
  const user = await getUser();
  if (!user) {
    redirect(
      "/forgot-password?error=" +
        encodeURIComponent("Your reset link has expired. Please request a new one."),
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-16">
      <ResetForm />
    </div>
  );
}
