import Link from "next/link";
import { listCompanies } from "@/lib/db";
import { formatMoney } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const companies = listCompanies(q);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Companies</h1>
          <p className="text-sm text-slate-500">{companies.length} {companies.length === 1 ? "company" : "companies"}</p>
        </div>
        <div className="flex gap-2">
          <form className="flex">
            <input name="q" defaultValue={q} placeholder="Search name, website, industry, city…" className="field w-64" />
          </form>
          <Link href="/companies/new" className="btn-primary">+ New company</Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Industry</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 text-right font-medium">Contacts</th>
              <th className="px-4 py-3 text-right font-medium">Deals</th>
              <th className="px-4 py-3 text-right font-medium">Open value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/companies/${c.id}`} className="font-medium text-slate-900 hover:text-brand-600">{c.name}</Link>
                  {c.domain && <div className="text-xs text-slate-500">{c.domain}</div>}
                </td>
                <td className="px-4 py-3 text-slate-600">{c.industry || <span className="text-slate-400">—</span>}</td>
                <td className="px-4 py-3 text-slate-600">{c.city || <span className="text-slate-400">—</span>}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c.contact_count}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c.deal_count}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(c.open_value)}</td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  {q ? "No companies match your search." : "No companies yet. Add one, or create a deal with a company name."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
