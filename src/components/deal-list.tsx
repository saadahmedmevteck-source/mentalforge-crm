import Link from "next/link";
import { STAGES, formatMoney, type Deal } from "@/lib/constants";

export function DealList({ deals, newHref }: { deals: Deal[]; newHref: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Deals ({deals.length})</h2>
        <Link href={newHref} className="text-sm font-medium text-brand-600 hover:text-brand-700">+ Add deal</Link>
      </div>
      <ul className="divide-y divide-slate-100">
        {deals.map((d) => {
          const stage = STAGES.find((s) => s.id === d.stage);
          return (
            <li key={d.id}>
              <Link href={`/deals/${d.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{d.title}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={`h-2 w-2 rounded-full ${stage?.color}`} />
                    {stage?.label}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(d.value)}</span>
              </Link>
            </li>
          );
        })}
        {deals.length === 0 && <li className="py-2 text-sm text-slate-400">No deals yet.</li>}
      </ul>
    </div>
  );
}
