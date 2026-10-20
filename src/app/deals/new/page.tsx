import Link from "next/link";
import { createDeal } from "../actions";
import { DealFields } from "../deal-form";

export default function NewDealPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/deals" className="text-sm text-slate-500 hover:text-slate-800">← Back to pipeline</Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">New deal</h1>
      <form action={createDeal} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <DealFields />
        <div className="flex justify-end gap-2">
          <Link href="/deals" className="btn-ghost">Cancel</Link>
          <button type="submit" className="btn-primary">Create deal</button>
        </div>
      </form>
    </div>
  );
}
