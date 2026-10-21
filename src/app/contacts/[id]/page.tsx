import Link from "next/link";
import { notFound } from "next/navigation";
import { companyNames, getContact, listDealsFor, listTasksFor } from "@/lib/db";
import { formatMoney } from "@/lib/constants";
import { todayISO } from "@/lib/dates";
import { DealList } from "@/components/deal-list";
import { DeleteButton } from "@/components/delete-button";
import { TaskList } from "@/components/task-list";
import { TaskQuickAdd } from "@/components/task-quick-add";
import { deleteContact, updateContact } from "../actions";
import { ContactFields } from "../contact-form";

export const dynamic = "force-dynamic";

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = getContact(Number(id));
  if (!contact) notFound();
  const deals = listDealsFor("contact_id", contact.id);
  const today = todayISO();

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/contacts" className="text-sm text-slate-500 hover:text-slate-800">← All contacts</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">
          {contact.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-semibold">{contact.name}</h1>
          <p className="text-sm text-slate-500">
            {[contact.job_title, contact.company_name].filter(Boolean).join(" at ") || contact.lifecycle}
          </p>
        </div>
        <span className="ml-auto text-sm text-slate-500">
          Open pipeline <span className="font-semibold tabular-nums text-slate-800">{formatMoney(contact.open_value)}</span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <form action={updateContact.bind(null, contact.id)} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
          <ContactFields contact={contact} companies={companyNames()} />
          <div className="flex justify-between gap-2">
            <DeleteButton
              action={deleteContact.bind(null, contact.id)}
              label="Delete contact"
              confirmText="Delete this contact? Their deals stay but will no longer be linked."
            />
            <button type="submit" className="btn-primary">Save changes</button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">Company</h2>
            {contact.company_id ? (
              <Link href={`/companies/${contact.company_id}`} className="text-sm font-medium text-brand-600 hover:underline">{contact.company_name}</Link>
            ) : (
              <p className="text-sm text-slate-400">Not linked to a company.</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-1 text-sm font-semibold">Tasks</h2>
            <TaskList tasks={listTasksFor("contact_id", contact.id)} today={today} empty="No tasks yet." />
            <TaskQuickAdd today={today} contactId={contact.id} />
          </div>
          <DealList deals={deals} newHref={`/deals/new?contact=${contact.id}`} />
        </aside>
      </div>
    </div>
  );
}
