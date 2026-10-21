import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listDeals } from "@/lib/db";
import { formatMoney } from "@/lib/constants";
import { Board } from "./board";

export const dynamic = "force-dynamic";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  await requireUser();
  const deals = await listDeals(q);
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
        <div className="flex gap-2">
          <form className="flex">
            <input name="q" defaultValue={q} placeholder="Search deals, contacts, companies…" className="field w-64" />
          </form>
          <Link href="/deals/new" className="btn-primary">+ New deal</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      <Board deals={deals} />
    </div>
  );
}
