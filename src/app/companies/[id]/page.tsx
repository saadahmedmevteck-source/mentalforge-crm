import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany, listContactsForCompany, listDealsFor } from "@/lib/db";
import { formatMoney } from "@/lib/constants";
import { DealList } from "@/components/deal-list";
import { DeleteButton } from "@/components/delete-button";
import { deleteCompany, updateCompany } from "../actions";
import { CompanyFields } from "../company-form";

export const dynamic = "force-dynamic";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = getCompany(Number(id));
  if (!company) notFound();
  const contacts = listContactsForCompany(company.id);
  const deals = listDealsFor("company_id", company.id);

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/companies" className="text-sm text-slate-500 hover:text-slate-800">← All companies</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-slate-800 font-semibold text-white">
          {company.name[0]?.toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-semibold">{company.name}</h1>
          <p className="text-sm text-slate-500">
            {company.domain ? (
              <a href={`https://${company.domain}`} target="_blank" rel="noreferrer" className="hover:text-brand-600">{company.domain}</a>
            ) : (
              [company.industry, company.city].filter(Boolean).join(" · ") || "Company"
            )}
          </p>
        </div>
        <span className="ml-auto text-sm text-slate-500">
          Open pipeline <span className="font-semibold tabular-nums text-slate-800">{formatMoney(company.open_value)}</span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <form action={updateCompany.bind(null, company.id)} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
          <CompanyFields company={company} />
          <div className="flex justify-between gap-2">
            <DeleteButton
              action={deleteCompany.bind(null, company.id)}
              label="Delete company"
              confirmText="Delete this company? Its contacts and deals stay but will no longer be linked."
            />
            <button type="submit" className="btn-primary">Save changes</button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Contacts ({contacts.length})</h2>
              <Link href={`/contacts/new?company=${company.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">+ Add contact</Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {contacts.map((c) => (
                <li key={c.id}>
                  <Link href={`/contacts/${c.id}`} className="-mx-2 block rounded-md px-2 py-2 hover:bg-slate-50">
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="truncate text-xs text-slate-500">{[c.job_title, c.email].filter(Boolean).join(" · ") || c.lifecycle}</div>
                  </Link>
                </li>
              ))}
              {contacts.length === 0 && <li className="py-2 text-sm text-slate-400">No contacts yet.</li>}
            </ul>
          </div>
          <DealList deals={deals} newHref={`/deals/new?company=${company.id}`} />
        </aside>
      </div>
    </div>
  );
}
