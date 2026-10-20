import Link from "next/link";
import { companyNames, contactOptions, getCompany, getContact } from "@/lib/db";
import { createDeal } from "../actions";
import { DealFields } from "../deal-form";

export const dynamic = "force-dynamic";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ contact?: string; company?: string }>;
}) {
  const sp = await searchParams;
  // Opened from a contact or company page: start with them filled in.
  const contact = sp.contact ? getContact(Number(sp.contact)) : undefined;
  const company = sp.company ? getCompany(Number(sp.company)) : undefined;
  const defaults = {
    contact_name: contact?.name ?? "",
    contact_email: contact?.email ?? "",
    contact_phone: contact?.phone ?? "",
    company_name: company?.name ?? contact?.company_name ?? "",
  };
  const back = contact ? `/contacts/${contact.id}` : company ? `/companies/${company.id}` : "/deals";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={back} className="text-sm text-slate-500 hover:text-slate-800">← Back</Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">New deal</h1>
      <form action={createDeal} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <DealFields deal={defaults} contacts={contactOptions()} companies={companyNames()} />
        <div className="flex justify-end gap-2">
          <Link href={back} className="btn-ghost">Cancel</Link>
          <button type="submit" className="btn-primary">Create deal</button>
        </div>
      </form>
    </div>
  );
}
