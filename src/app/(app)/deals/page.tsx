import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listDeals } from "@/lib/db";
import { SERVICES, STAGES, formatMoney, type Deal } from "@/lib/constants";
import { Board } from "./board";
import { ActiveFilters, DealFilters } from "./filters";

export const dynamic = "force-dynamic";

const toList = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

// Services outside the current list (old or blank) are filtered and counted as "Other".
const serviceKey = (d: Deal) => (SERVICES.includes(d.service) ? d.service : "Other");

function countBy(deals: Deal[], key: (d: Deal) => string) {
  const counts: Record<string, number> = {};
  for (const d of deals) counts[key(d)] = (counts[key(d)] ?? 0) + 1;
  return counts;
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; service?: string | string[]; stage?: string | string[] }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const services = toList(sp.service);
  const stages = toList(sp.stage).filter((s) => STAGES.some((st) => st.id === s));
  await requireUser();
  const all = await listDeals(q);

  const serviceMatch = (d: Deal) => !services.length || services.includes(serviceKey(d));
  const stageMatch = (d: Deal) => !stages.length || stages.includes(d.stage);
  const deals = all.filter((d) => serviceMatch(d) && stageMatch(d));

  const open = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const won = deals.filter((d) => d.stage === "won");
  const closed = deals.filter((d) => d.stage === "won" || d.stage === "lost");

  const stats = [
    { label: "Open deals", value: String(open.length) },
    { label: "Open pipeline", value: formatMoney(open.reduce((s, d) => s + d.value, 0)) },
    { label: "Won revenue", value: formatMoney(won.reduce((s, d) => s + d.value, 0)) },
    {
      label: "Win rate",
      value: closed.length ? `${Math.round((won.length / closed.length) * 100)}%` : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Deals</h1>
          <p className="text-sm text-slate-500">Drag a card to move it to another stage.</p>
        </div>
        <DealFilters
          serviceCounts={countBy(all.filter(stageMatch), serviceKey)}
          stageCounts={countBy(all.filter(serviceMatch), (d) => d.stage)}
        />
        <div className="flex gap-2">
          <form className="flex">
            <input name="q" defaultValue={q} placeholder="Search deals, contacts, companies…" className="field w-64" />
            {services.map((s) => <input key={s} type="hidden" name="service" value={s} />)}
            {stages.map((s) => <input key={s} type="hidden" name="stage" value={s} />)}
          </form>
          <Link href="/deals/new" className="btn-primary">+ New deal</Link>
        </div>
      </div>

      <ActiveFilters />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      <Board deals={deals} stages={stages} />
    </div>
  );
}
