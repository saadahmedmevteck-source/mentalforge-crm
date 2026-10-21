"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatTime } from "@/lib/dates";

type DueTask = {
  id: number;
  title: string;
  due_date: string;
  due_time: string;
  deal_title: string;
  contact_name: string;
};

export const DUE_COUNT_EVENT = "crm:due-count";
const SEEN_KEY = "crm:reminded";
const POLL_MS = 60_000;

// Keyed by id + due time so a rescheduled task reminds again.
const seenKey = (t: DueTask) => `${t.id}@${t.due_date} ${t.due_time}`;

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeSeen(keys: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(keys.slice(-200)));
  } catch {
    // Storage unavailable: reminders may repeat after reload, which is acceptable.
  }
}

/** Polls for due tasks; shows an in-app toast (and a desktop notification if allowed) once per task. */
export function Reminders() {
  const pathname = usePathname();
  const [toasts, setToasts] = useState<DueTask[]>([]);

  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        const res = await fetch("/api/tasks/due", { cache: "no-store" });
        if (!res.ok || !alive) return;
        const data = (await res.json()) as { count: number; dueNow: DueTask[] };
        window.dispatchEvent(new CustomEvent(DUE_COUNT_EVENT, { detail: data.count }));
        const seen = readSeen();
        const fresh = data.dueNow.filter((t) => !seen.includes(seenKey(t)));
        if (!fresh.length) return;
        writeSeen([...seen, ...fresh.map(seenKey)]);
        setToasts((prev) => [...prev, ...fresh]);
        if ("Notification" in window && Notification.permission === "granted") {
          for (const t of fresh) {
            new Notification(`Task due ${formatTime(t.due_time)}: ${t.title}`, {
              body: [t.contact_name, t.deal_title].filter(Boolean).join(" · ") || "Mental Forge CRM",
              tag: seenKey(t),
            });
          }
        }
      } catch {
        // Offline or server restarting; try again on the next tick.
      }
    }
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [pathname]);

  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={seenKey(t)} className="rounded-xl border border-amber-200 bg-white p-3 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-medium text-amber-600">⏰ Task due · {formatTime(t.due_time)}</div>
              <Link
                href={`/tasks/${t.id}`}
                onClick={() => setToasts((prev) => prev.filter((x) => x !== t))}
                className="block truncate text-sm font-semibold hover:text-brand-600"
              >
                {t.title}
              </Link>
              {(t.contact_name || t.deal_title) && (
                <div className="truncate text-xs text-slate-500">
                  {[t.contact_name, t.deal_title].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss reminder"
              onClick={() => setToasts((prev) => prev.filter((x) => x !== t))}
              className="cursor-pointer rounded px-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
