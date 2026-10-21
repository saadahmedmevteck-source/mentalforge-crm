import Link from "next/link";
import { toggleTask } from "@/app/(app)/tasks/actions";
import type { Task } from "@/lib/constants";
import { dueLabel } from "@/lib/dates";

const TONE = {
  overdue: "text-rose-600 font-medium",
  today: "text-amber-600 font-medium",
  later: "text-slate-500",
  none: "text-slate-400",
};

export function TaskList({
  tasks,
  today,
  showLinks = true,
  empty = "No tasks.",
}: {
  tasks: Task[];
  today: string;
  showLinks?: boolean;
  empty?: string;
}) {
  if (tasks.length === 0) return <p className="py-2 text-sm text-slate-400">{empty}</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((t) => {
        const done = t.status === "done";
        const due = dueLabel(t.due_date, t.due_time, today);
        return (
          <li key={t.id} className="flex items-start gap-3 py-2.5">
            <form action={toggleTask.bind(null, t.id)} className="pt-0.5">
              <button
                type="submit"
                aria-label={done ? `Reopen "${t.title}"` : `Complete "${t.title}"`}
                title={done ? "Reopen" : "Mark complete"}
                className={`grid h-5 w-5 cursor-pointer place-items-center rounded-full border-2 text-[11px] leading-none transition ${
                  done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500"
                }`}
              >
                ✓
              </button>
            </form>
            <div className="min-w-0 flex-1">
              <Link
                href={`/tasks/${t.id}`}
                className={`block text-sm font-medium hover:text-brand-600 ${done ? "text-slate-400 line-through" : ""}`}
              >
                {t.title}
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                <span className="rounded bg-slate-100 px-1.5 py-px font-medium text-slate-600">{t.type}</span>
                {t.priority === "high" && !done && (
                  <span className="rounded bg-rose-50 px-1.5 py-px font-medium text-rose-600">High</span>
                )}
                <span className={done ? "text-slate-400" : TONE[due.tone]}>{due.text}</span>
                {showLinks && t.contact_id && (
                  <Link href={`/contacts/${t.contact_id}`} className="text-slate-500 hover:text-brand-600">
                    {t.contact_name}
                  </Link>
                )}
                {showLinks && t.deal_id && (
                  <Link href={`/deals/${t.deal_id}`} className="truncate text-slate-500 hover:text-brand-600">
                    {t.deal_title}
                  </Link>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
