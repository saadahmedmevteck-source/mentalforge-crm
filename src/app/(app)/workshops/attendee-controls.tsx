"use client";

import { useEffect, useState, useTransition } from "react";
import { REGISTRATION_STATUSES, type RegistrationStatus } from "@/lib/constants";

/**
 * Status dropdown that saves as soon as it changes. Calls the action directly rather than
 * through a <form action>, which React resets afterwards (showing the old status again).
 */
export function RegistrationStatusSelect({
  action,
  value,
  name,
}: {
  action: (form: FormData) => Promise<void>;
  value: RegistrationStatus;
  name: string;
}) {
  const [status, setStatus] = useState(value);
  const [pending, startTransition] = useTransition();
  useEffect(() => setStatus(value), [value]);

  return (
    <select
      value={status}
      disabled={pending}
      aria-label={`Status for ${name}`}
      onChange={(e) => {
        const next = e.currentTarget.value as RegistrationStatus;
        setStatus(next);
        const data = new FormData();
        data.set("status", next);
        startTransition(() => action(data));
      }}
      className="field w-auto py-1 text-xs"
    >
      {REGISTRATION_STATUSES.map((s) => (
        <option key={s.id} value={s.id}>{s.label}</option>
      ))}
    </select>
  );
}

/** Copies the email addresses of everyone still coming, for a reminder email. */
export function CopyEmails({ emails }: { emails: string[] }) {
  const [copied, setCopied] = useState(false);
  if (!emails.length) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(emails.join(", "));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="cursor-pointer text-sm font-medium text-brand-600 hover:text-brand-700"
    >
      {copied ? "Copied ✓" : `Copy ${emails.length} email${emails.length === 1 ? "" : "s"}`}
    </button>
  );
}
