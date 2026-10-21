import Link from "next/link";
import { contactChoices, dealChoices } from "@/lib/db";
import { todayISO } from "@/lib/dates";
import { createTask } from "../actions";
import { TaskFields } from "../task-form";

export const dynamic = "force-dynamic";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string; contact?: string }>;
}) {
  const sp = await searchParams;
  const dealId = Number(sp.deal) || null;
  const contactId = Number(sp.contact) || null;
  const back = dealId ? `/deals/${dealId}` : contactId ? `/contacts/${contactId}` : "/tasks";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={back} className="text-sm text-slate-500 hover:text-slate-800">← Back</Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">New task</h1>
      <form action={createTask} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <input type="hidden" name="return_to" value={back} />
        <TaskFields
          task={{ due_date: todayISO(), deal_id: dealId, contact_id: contactId }}
          deals={dealChoices()}
          contacts={contactChoices()}
        />
        <div className="flex justify-end gap-2">
          <Link href={back} className="btn-ghost">Cancel</Link>
          <button type="submit" className="btn-primary">Create task</button>
        </div>
      </form>
    </div>
  );
}
