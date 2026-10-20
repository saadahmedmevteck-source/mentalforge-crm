"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { STAGES, formatMoney, type Deal, type StageId } from "@/lib/constants";
import { moveDeal } from "./actions";

export function Board({ deals }: { deals: Deal[] }) {
  const [items, setItems] = useState(deals);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overStage, setOverStage] = useState<StageId | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => setItems(deals), [deals]);

  function drop(stage: StageId) {
    const id = dragId;
    setDragId(null);
    setOverStage(null);
    if (id == null) return;
    const deal = items.find((d) => d.id === id);
    if (!deal || deal.stage === stage) return;
    setItems((prev) => prev.map((d) => (d.id === id ? { ...d, stage } : d)));
    startTransition(() => moveDeal(id, stage));
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const cards = items.filter((d) => d.stage === stage.id);
        const total = cards.reduce((s, d) => s + d.value, 0);
        return (
          <section
            key={stage.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage.id);
            }}
            onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
            onDrop={() => drop(stage.id)}
            className={`flex w-72 shrink-0 flex-col rounded-xl border bg-slate-100/70 transition ${
              overStage === stage.id ? "border-brand-500 bg-brand-50" : "border-slate-200"
            }`}
          >
            <header className="flex items-center justify-between px-3 pb-2 pt-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                <h2 className="text-sm font-semibold">{stage.label}</h2>
                <span className="rounded-full bg-white px-2 text-xs text-slate-500">{cards.length}</span>
              </div>
              <span className="text-xs font-medium tabular-nums text-slate-500">{formatMoney(total)}</span>
            </header>
            <div className="flex min-h-40 flex-col gap-2 px-2 pb-3">
              {cards.map((d) => (
                <Link
                  key={d.id}
                  href={`/deals/${d.id}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    setDragId(d.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverStage(null);
                  }}
                  className={`block cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-brand-500 active:cursor-grabbing ${
                    dragId === d.id ? "opacity-40" : ""
                  }`}
                >
                  <div className="text-sm font-medium leading-snug">{d.title}</div>
                  {(d.contact_name || d.company_name) && (
                    <div className="mt-1 truncate text-xs text-slate-500">
                      {[d.contact_name, d.company_name].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {d.service ? (
                      <span className="truncate rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                        {d.service}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="text-sm font-semibold tabular-nums">{formatMoney(d.value)}</span>
                  </div>
                </Link>
              ))}
              {cards.length === 0 && (
                <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-slate-300 py-6 text-xs text-slate-400">
                  Drop deals here
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
