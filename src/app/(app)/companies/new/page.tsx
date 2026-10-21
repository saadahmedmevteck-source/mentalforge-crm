import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createCompany } from "../actions";
import { CompanyFields } from "../company-form";

export default async function NewCompanyPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/companies" className="text-sm text-slate-500 hover:text-slate-800">← Back</Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">New company</h1>
      <form action={createCompany} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <CompanyFields />
        <div className="flex justify-end gap-2">
          <Link href="/companies" className="btn-ghost">Cancel</Link>
          <button type="submit" className="btn-primary">Create company</button>
        </div>
      </form>
    </div>
  );
}
