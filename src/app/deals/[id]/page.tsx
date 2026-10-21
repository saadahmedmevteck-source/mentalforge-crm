import Link from "next/link";
import { notFound } from "next/navigation";
import { companyNames, contactOptions, getDeal, listActivities, listTasksFor } from "@/lib/db";
import { STAGES, formatDateTime, formatMoney } from "@/lib/constants";
import { todayISO } from "@/lib/dates";
import { DeleteButton } from "@/components/delete-button";
import { TaskList } from "@/components/task-list";
import { TaskQuickAdd } from "@/components/task-quick-add";
import { addNote, deleteDeal, updateDeal } from "../actions";
import { DealFields } from "../deal-form";

export const dynamic = "force-dynamic";

const KIND_LABEL = { created: "Created", stage: "Stage changed", note: "Note", updated: "Edited", task: "Task" };

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = getDeal(Number(id));
  if (!deal) notFound();
  const activities = listActivities(deal.id);
  const stage = STAGES.find((s) => s.id === deal.stage);
  const today = todayISO();

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
          <DealFields deal={deal} contacts={contactOptions()} companies={companyNames()} />
          <div className="flex justify-between gap-2">
            <DeleteButton action={deleteDeal.bind(null, deal.id)} label="Delete deal" confirmText="Delete this deal and its activity?" />
            <button type="submit" className="btn-primary">Save changes</button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">Associated with</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Contact</dt>
                <dd>
                  {deal.contact_id ? (
                    <>
                      <Link href={`/contacts/${deal.contact_id}`} className="font-medium text-brand-600 hover:underline">{deal.contact_name}</Link>
                      {deal.contact_email && <div className="text-slate-600">{deal.contact_email}</div>}
                      {deal.contact_phone && <div className="text-slate-600">{deal.contact_phone}</div>}
                    </>
                  ) : (
                    <span className="text-slate-400">None</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Company</dt>
                <dd>
                  {deal.company_id ? (
                    <Link href={`/companies/${deal.company_id}`} className="font-medium text-brand-600 hover:underline">{deal.company_name}</Link>
                  ) : (
                    <span className="text-slate-400">None</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-1 text-sm font-semibold">Tasks</h2>
            <TaskList tasks={listTasksFor("deal_id", deal.id)} today={today} showLinks={false} empty="No tasks yet. What's the next step?" />
            <TaskQuickAdd today={today} dealId={deal.id} contactId={deal.contact_id} />
          </div>

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
                    <span className="font-medium text-slate-700">{KIND_LABEL[a.kind]}</span> · {formatDateTime(a.created_at)}
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
