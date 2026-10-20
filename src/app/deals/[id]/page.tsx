import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeal, listActivities } from "@/lib/db";
import { STAGES, formatMoney } from "@/lib/constants";
import { addNote, deleteDeal, updateDeal } from "../actions";
import { DealFields } from "../deal-form";

export const dynamic = "force-dynamic";

const KIND_LABEL = { created: "Created", stage: "Stage changed", note: "Note", updated: "Edited" };

// SQLite datetime('now') is UTC without a zone marker.
function when(ts: string) {
  return new Date(ts.replace(" ", "T") + "Z").toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = getDeal(Number(id));
  if (!deal) notFound();
  const activities = listActivities(deal.id);
  const stage = STAGES.find((s) => s.id === deal.stage);

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/deals" className="text-sm text-slate-500 hover:text-slate-800">← Back to pipeline</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{deal.title}</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-slate-200">
          <span className={`h-2 w-2 rounded-full ${stage?.color}`} />
          {stage?.label}
        </span>
        <span className="text-lg font-semibold tabular-nums text-slate-700">{formatMoney(deal.value)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <form action={updateDeal.bind(null, deal.id)} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
          <DealFields deal={deal} />
          <div className="flex justify-between gap-2">
            <button formAction={deleteDeal.bind(null, deal.id)} formNoValidate className="btn text-rose-600 hover:bg-rose-50">
              Delete deal
            </button>
            <button type="submit" className="btn-primary">Save changes</button>
          </div>
        </form>

        <aside className="space-y-4">
          <form action={addNote.bind(null, deal.id)} className="rounded-xl border border-slate-200 bg-white p-4">
            <label className="label" htmlFor="body">Log a note or call</label>
            <textarea id="body" name="body" rows={3} required placeholder="Discovery call went well, sending proposal Friday…" className="field" />
            <div className="mt-2 flex justify-end">
              <button type="submit" className="btn-primary">Add note</button>
            </div>
          </form>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">Activity</h2>
            <ol className="space-y-3">
              {activities.map((a) => (
                <li key={a.id} className="border-l-2 border-slate-200 pl-3">
                  <div className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{KIND_LABEL[a.kind]}</span> · {when(a.created_at)}
                  </div>
                  <div className="mt-0.5 whitespace-pre-wrap text-sm">{a.body}</div>
                </li>
              ))}
              {activities.length === 0 && <li className="text-sm text-slate-400">No activity yet.</li>}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
