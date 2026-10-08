"use client";

import { useActionState } from "react";
import { updatePassword, type NewPasswordState } from "./actions";

export default function ResetForm() {
  const [state, action, pending] = useActionState<NewPasswordState, FormData>(updatePassword, null);

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-raised p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      <p className="mt-1 text-sm text-ink-soft">Use at least 8 characters.</p>

      <form action={action} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-line bg-raised px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-sm font-semibold">
            Type it again
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-line bg-raised px-3 py-2.5 text-sm"
          />
        </div>

        {state?.error && (
          <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60"
        >
          {pending ? "Please wait…" : "Save new password"}
        </button>
      </form>
    </div>
  );
}
