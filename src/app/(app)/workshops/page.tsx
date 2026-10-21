import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listWorkshops } from "@/lib/db";
import { WORKSHOP_STATUSES, formatMoney } from "@/lib/constants";
import { todayISO } from "@/lib/dates";
import { SeatMeter, workshopWhen } from "@/components/workshop-bits";

export const dynamic = "force-dynamic";

export default async function WorkshopsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireUser();
  const view = (await searchParams).view === "past" ? "past" : "upcoming";
  const workshops = await listWorkshops(view, todayISO());

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Workshops</h1>
          <p className="text-sm text-slate-500">Fusion Foundations sessions, trainings and their attendees.</p>
        </div>
        <Link href="/workshops/new" className="btn-primary">+ New workshop</Link>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {(["upcoming", "past"] as const).map((v) => (
          <Link
            key={v}
            href={v === "upcoming" ? "/workshops" : "/workshops?view=past"}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize ${
              v === view ? "border-brand-500 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {v}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Workshop</th>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Seats</th>
              <th className="px-4 py-3 text-right font-medium">{view === "past" ? "Attended" : "Waitlist"}</th>
              <th className="px-4 py-3 text-right font-medium">Collected</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {workshops.map((w) => (
              <tr key={w.id} className={`hover:bg-slate-50 ${w.status === "cancelled" ? "text-slate-400" : ""}`}>
                <td className="px-4 py-3">
                  <Link href={`/workshops/${w.id}`} className="font-medium text-slate-900 hover:text-brand-600">{w.title}</Link>
                  <div className="text-xs text-slate-500">{[w.program, w.location].filter(Boolean).join(" · ")}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{workshopWhen(w)}</td>
                <td className="px-4 py-3"><SeatMeter taken={w.seats_taken} capacity={w.capacity} /></td>
                <td className="px-4 py-3 text-right tabular-nums">{view === "past" ? w.attended_count : w.waitlist_count}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(w.revenue)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {WORKSHOP_STATUSES.find((s) => s.id === w.status)?.label ?? w.status}
                  </span>
                </td>
              </tr>
            ))}
            {workshops.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  {view === "upcoming" ? "No upcoming workshops. Schedule the next Fusion Foundations session." : "No past workshops yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
