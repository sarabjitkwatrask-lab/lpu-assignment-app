"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type ResetRequestState } from "./actions";

export default function ForgotForm({ initialError }: { initialError?: string }) {
  const [state, action, pending] = useActionState<ResetRequestState, FormData>(
    requestPasswordReset,
    initialError ? { error: initialError } : null,
  );

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-raised p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Enter the email you signed up with and we will send you a link to choose a new password.
      </p>

      <form action={action} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-line bg-raised px-3 py-2.5 text-sm"
          />
        </div>

        {state?.error && (
          <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
            {state.error}
          </p>
        )}
        {state?.message && (
          <p role="status" className="rounded-lg bg-good-soft px-3 py-2 text-sm text-good">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60"
        >
          {pending ? "Please wait…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft">
        <Link href="/login" className="font-semibold text-accent underline-offset-2 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
