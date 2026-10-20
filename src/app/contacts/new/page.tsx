import Link from "next/link";
import { companyNames, getCompany } from "@/lib/db";
import { createContact } from "../actions";
import { ContactFields } from "../contact-form";

export const dynamic = "force-dynamic";

export default async function NewContactPage({ searchParams }: { searchParams: Promise<{ company?: string }> }) {
  const sp = await searchParams;
  const company = sp.company ? getCompany(Number(sp.company)) : undefined;
  const back = company ? `/companies/${company.id}` : "/contacts";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={back} className="text-sm text-slate-500 hover:text-slate-800">← Back</Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">New contact</h1>
      <form action={createContact} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <ContactFields contact={{ company_name: company?.name ?? "" }} companies={companyNames()} />
        <div className="flex justify-end gap-2">
          <Link href={back} className="btn-ghost">Cancel</Link>
          <button type="submit" className="btn-primary">Create contact</button>
        </div>
      </form>
    </div>
  );
}
