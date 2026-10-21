import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listContacts } from "@/lib/db";
import { formatMoney } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  await requireUser();
  const contacts = await listContacts(q);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-slate-500">{contacts.length} {contacts.length === 1 ? "contact" : "contacts"}</p>
        </div>
        <div className="flex gap-2">
          <form className="flex">
            <input name="q" defaultValue={q} placeholder="Search name, email, phone, company…" className="field w-64" />
          </form>
          <Link href="/contacts/new" className="btn-primary">+ New contact</Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Lifecycle</th>
              <th className="px-4 py-3 text-right font-medium">Deals</th>
              <th className="px-4 py-3 text-right font-medium">Open value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/contacts/${c.id}`} className="font-medium text-slate-900 hover:text-brand-600">{c.name}</Link>
                  {c.job_title && <div className="text-xs text-slate-500">{c.job_title}</div>}
                </td>
                <td className="px-4 py-3 text-slate-600">{c.email}</td>
                <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                <td className="px-4 py-3">
                  {c.company_id ? (
                    <Link href={`/companies/${c.company_id}`} className="text-slate-700 hover:text-brand-600">{c.company_name}</Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{c.lifecycle}</span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{c.deal_count}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(c.open_value)}</td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  {q ? "No contacts match your search." : "No contacts yet. Add one, or create a deal with a contact name."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
