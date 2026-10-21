import Link from "next/link";
import { listTasks, taskCounts, type TaskView } from "@/lib/db";
import { addDays, todayISO } from "@/lib/dates";
import { TaskList } from "@/components/task-list";

export const dynamic = "force-dynamic";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view: requested } = await searchParams;
  const today = todayISO();
  const counts = taskCounts(today, addDays(today, 7));
  const views: { id: TaskView; label: string; count?: number }[] = [
    { id: "open", label: "All open", count: counts.open },
    { id: "overdue", label: "Overdue", count: counts.overdue },
    { id: "today", label: "Due today", count: counts.today },
    { id: "upcoming", label: "Upcoming" },
    { id: "done", label: "Completed" },
  ];
  const view = views.find((v) => v.id === requested)?.id ?? "open";
  const tasks = listTasks(view, today);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <Link href="/tasks/new" className="btn-primary">+ New task</Link>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {views.map((v) => (
          <Link
            key={v.id}
            href={v.id === "open" ? "/tasks" : `/tasks?view=${v.id}`}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              v.id === view ? "border-brand-500 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {v.label}
            {v.count ? (
              <span className={`ml-1.5 rounded-full px-1.5 text-xs ${v.id === "overdue" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                {v.count}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-2">
        <TaskList tasks={tasks} today={today} empty={view === "done" ? "No completed tasks yet." : "Nothing here. 🎉"} />
      </div>
    </div>
  );
}
