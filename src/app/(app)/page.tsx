import Link from "next/link";
import { dealsClosingBy, dealsWithoutNextStep, listDeals, listTasks, listWorkshops, taskCounts } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/constants";
import { addDays, formatDay, todayISO } from "@/lib/dates";
import { EnableNotifications } from "@/components/enable-notifications";
import { TaskList } from "@/components/task-list";
import { TaskQuickAdd } from "@/components/task-quick-add";
import { SeatMeter, workshopWhen } from "@/components/workshop-bits";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  await requireUser();
  const today = todayISO();
  const nextWeek = addDays(today, 7);
  const [counts, overdue, dueToday, upcoming, closing, stalled, deals, workshops] = await Promise.all([
    taskCounts(today, nextWeek),
    listTasks("overdue", today),
    listTasks("today", today),
    listTasks("upcoming", today, nextWeek),
    dealsClosingBy(addDays(today, 14)),
    dealsWithoutNextStep(),
    listDeals(),
    listWorkshops("upcoming", today, 3),
  ]);
  const openPipeline = deals
    .filter((d) => d.stage !== "won" && d.stage !== "lost")
    .reduce((s, d) => s + d.value, 0);

  const stats = [
    { label: "Overdue tasks", value: counts.overdue, href: "/tasks?view=overdue", alert: counts.overdue > 0 },
    { label: "Due today", value: counts.today, href: "/tasks?view=today" },
    { label: "Next 7 days", value: counts.upcoming, href: "/tasks?view=upcoming" },
    { label: "Open pipeline", value: formatMoney(openPipeline), href: "/deals" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Today</h1>
          <p className="text-sm text-slate-500">{formatDay(today, { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <EnableNotifications />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`rounded-xl border bg-white p-4 transition hover:border-brand-500 ${s.alert ? "border-rose-300" : "border-slate-200"}`}
          >
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</div>
            <div className={`mt-1 text-2xl font-semibold tabular-nums ${s.alert ? "text-rose-600" : ""}`}>{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {overdue.length > 0 && (
            <section className="rounded-xl border border-rose-200 bg-white p-4">
              <h2 className="mb-1 text-sm font-semibold text-rose-700">Overdue ({overdue.length})</h2>
              <TaskList tasks={overdue} today={today} />
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-1 text-sm font-semibold">Due today ({dueToday.length})</h2>
            <TaskList tasks={dueToday} today={today} empty="Nothing due today." />
            <TaskQuickAdd today={today} />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Next 7 days</h2>
              <Link href="/tasks?view=upcoming" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</Link>
            </div>
            <TaskList tasks={upcoming} today={today} empty="Nothing scheduled this week." />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Upcoming workshops</h2>
              <Link href="/workshops" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all</Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {workshops.map((w) => (
                <li key={w.id}>
                  <Link href={`/workshops/${w.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-slate-50">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{w.title}</div>
                      <div className="text-xs text-slate-500">{workshopWhen(w)}</div>
                    </div>
                    <SeatMeter taken={w.seats_taken} capacity={w.capacity} />
                  </Link>
                </li>
              ))}
              {workshops.length === 0 && (
                <li className="py-2 text-sm text-slate-400">
                  None scheduled. <Link href="/workshops/new" className="text-brand-600 hover:underline">Add one</Link>
                </li>
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold">Deals closing in 14 days</h2>
            <ul className="divide-y divide-slate-100">
              {closing.map((d) => (
                <li key={d.id}>
                  <Link href={`/deals/${d.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-slate-50">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{d.title}</div>
                      <div className={`text-xs ${d.expected_close < today ? "font-medium text-rose-600" : "text-slate-500"}`}>
                        {d.expected_close < today ? "Past close date · " : "Closes "}
                        {formatDay(d.expected_close)}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(d.value)}</span>
                  </Link>
                </li>
              ))}
              {closing.length === 0 && <li className="py-2 text-sm text-slate-400">No open deals closing soon.</li>}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold">Deals with no next step</h2>
            <p className="mb-2 text-xs text-slate-500">Open deals without an open task.</p>
            <ul className="divide-y divide-slate-100">
              {stalled.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/deals/${d.id}`} className="min-w-0 truncate text-sm font-medium hover:text-brand-600">{d.title}</Link>
                  <Link href={`/tasks/new?deal=${d.id}`} className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700">+ Task</Link>
                </li>
              ))}
              {stalled.length === 0 && <li className="py-2 text-sm text-slate-400">Every open deal has a next step.</li>}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
