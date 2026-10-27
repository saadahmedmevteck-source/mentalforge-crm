"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { SERVICE_GROUPS, STAGES } from "@/lib/constants";

type Option = { value: string; label: string; dot?: string };
type Group = { label?: string; options: Option[] };

const SERVICE_OPTIONS: Group[] = [
  ...SERVICE_GROUPS.map((g) => ({ label: g.label, options: g.services.map((s) => ({ value: s, label: s })) })),
  { options: [{ value: "Other", label: "Other" }] },
];

const STAGE_OPTIONS: Group[] = [
  { options: STAGES.map((s) => ({ value: s.id, label: s.label, dot: s.color })) },
];

// Filters live in the URL (?service=…&service=…&stage=…) so the server filters deals and stats.
function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function replace(next: URLSearchParams) {
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function update(key: "service" | "stage", values: string[]) {
    const next = new URLSearchParams(params);
    next.delete(key);
    values.forEach((v) => next.append(key, v));
    replace(next);
  }

  function clearAll() {
    const next = new URLSearchParams(params);
    next.delete("service");
    next.delete("stage");
    replace(next);
  }

  return { services: params.getAll("service"), stages: params.getAll("stage"), pending, update, clearAll };
}

export function DealFilters({
  serviceCounts,
  stageCounts,
}: {
  serviceCounts: Record<string, number>;
  stageCounts: Record<string, number>;
}) {
  const { services, stages, pending, update } = useFilters();

  return (
    <div className={`flex items-center gap-2 ${pending ? "opacity-60" : ""}`}>
      <MultiSelect
        label="Service"
        groups={SERVICE_OPTIONS}
        counts={serviceCounts}
        selected={services}
        onChange={(v) => update("service", v)}
      />
      <MultiSelect
        label="Stage"
        groups={STAGE_OPTIONS}
        counts={stageCounts}
        selected={stages}
        onChange={(v) => update("stage", v)}
      />
    </div>
  );
}

export function ActiveFilters() {
  const { services, stages, update, clearAll } = useFilters();
  if (!services.length && !stages.length) return null;
  const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label ?? id;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-slate-500">Filtered by:</span>
      {services.map((s) => (
        <Chip key={`service-${s}`} text={s} onRemove={() => update("service", services.filter((x) => x !== s))} />
      ))}
      {stages.map((s) => (
        <Chip key={`stage-${s}`} text={stageLabel(s)} onRemove={() => update("stage", stages.filter((x) => x !== s))} />
      ))}
      <button type="button" onClick={clearAll} className="text-xs font-medium text-slate-500 hover:text-brand-600">
        Clear all
      </button>
    </div>
  );
}

function Chip({ text, onRemove }: { text: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-1.5 text-xs font-medium text-brand-700">
      {text}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${text} filter`}
        className="grid h-4 w-4 place-items-center rounded-full hover:bg-brand-100"
      >
        ×
      </button>
    </span>
  );
}

function MultiSelect({
  label,
  groups,
  counts,
  selected,
  onChange,
}: {
  label: string;
  groups: Group[];
  counts: Record<string, number>;
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`btn-ghost py-2 ${selected.length ? "border-brand-500 text-brand-700" : ""}`}
      >
        {label}
        {selected.length > 0 && (
          <span className="rounded-full bg-brand-500 px-1.5 text-[11px] font-semibold text-white">{selected.length}</span>
        )}
        <span aria-hidden className="text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 max-h-96 w-72 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full px-3 py-1.5 text-left text-xs font-medium text-brand-600 hover:bg-slate-50"
            >
              Clear {label.toLowerCase()} filter
            </button>
          )}
          {groups.map((g, i) => (
            <div key={g.label ?? i}>
              {g.label && (
                <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {g.label}
                </div>
              )}
              {g.options.map((o) => (
                <label key={o.value} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selected.includes(o.value)}
                    onChange={() => toggle(o.value)}
                    className="h-4 w-4 accent-brand-500"
                  />
                  {o.dot && <span className={`h-2 w-2 rounded-full ${o.dot}`} />}
                  <span className="flex-1">{o.label}</span>
                  <span className="text-xs tabular-nums text-slate-400">{counts[o.value] ?? 0}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
