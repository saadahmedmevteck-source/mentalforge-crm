"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import type { FormState } from "@/app/(auth)/actions";

/** A form whose server action returns { error } / { ok } messages shown above the submit button. */
export function AuthForm({
  action,
  submitLabel,
  children,
  resetOnSuccess = false,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  children: React.ReactNode;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      // Submitting manually keeps what was typed when the action returns an error
      // (a plain form action would clear the fields every time).
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="space-y-4"
    >
      {children}
      {state?.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.ok}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
