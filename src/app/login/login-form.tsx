"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

export default function LoginForm({
  next,
  initialError,
}: {
  next: string;
  initialError?: string;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signInPending] = useActionState<AuthState, FormData>(
    signIn,
    initialError ? { error: initialError } : null,
  );
  const [signUpState, signUpAction, signUpPending] = useActionState<AuthState, FormData>(
    signUp,
    null,
  );

  const isSignIn = mode === "signin";
  const state = isSignIn ? signInState : signUpState;
  const pending = isSignIn ? signInPending : signUpPending;

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-raised p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">
        {isSignIn ? "Sign in" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        {isSignIn
          ? "Welcome back. Sign in to design and review your assignments."
          : "Use your email and a password of at least 8 characters."}
      </p>

      <form action={isSignIn ? signInAction : signUpAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={state?.email ?? ""}
            autoComplete="email"
            className="w-full rounded-lg border border-line bg-raised px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="password" className="block text-sm font-semibold">
              Password
            </label>
            {isSignIn && (
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-accent underline-offset-2 hover:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={isSignIn ? undefined : 8}
            autoComplete={isSignIn ? "current-password" : "new-password"}
            className="w-full rounded-lg border border-line bg-raised px-3 py-2.5 text-sm"
          />
        </div>

        {!isSignIn && (
          <label className="flex items-start gap-3 text-sm leading-snug text-ink-soft">
            <input
              type="checkbox"
              name="consent"
              required
              className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
            />
            <span>
              I have read the{" "}
              <Link href="/privacy" target="_blank" className="font-semibold text-accent underline-offset-2 hover:underline">
                Privacy Notice
              </Link>{" "}
              and the{" "}
              <Link href="/terms" target="_blank" className="font-semibold text-accent underline-offset-2 hover:underline">
                Terms
              </Link>
              , and I agree that what I type is sent to an AI service to write the draft.
            </span>
          </label>
        )}

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
          {pending ? "Please waitâ€¦" : isSignIn ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-soft">
        {isSignIn ? "New here?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => setMode(isSignIn ? "signup" : "signin")}
          className="font-semibold text-accent underline-offset-2 hover:underline"
        >
          {isSignIn ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
