"use client";

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
            autoComplete="email"
            className="w-full rounded-lg border border-line bg-raised px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
            Password
          </label>
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
          {pending ? "Please wait…" : isSignIn ? "Sign in" : "Create account"}
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
