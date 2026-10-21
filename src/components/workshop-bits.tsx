import type { Workshop } from "@/lib/constants";
import { formatDay, formatTime } from "@/lib/dates";

export function workshopWhen(w: Pick<Workshop, "date" | "start_time" | "end_time">) {
  const day = formatDay(w.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  if (!w.start_time) return day;
  return `${day} · ${formatTime(w.start_time)}${w.end_time ? `–${formatTime(w.end_time)}` : ""}`;
}

/** "12 / 20 seats" with a fill bar; no bar when the workshop has no seat limit. */
export function SeatMeter({ taken, capacity }: { taken: number; capacity: number }) {
  if (!capacity) return <span className="text-sm tabular-nums">{taken} registered</span>;
  const pct = Math.min(100, Math.round((taken / capacity) * 100));
  const full = taken >= capacity;
  return (
    <div className="min-w-28">
      <div className="text-sm tabular-nums">
        {taken} / {capacity} {full && <span className="font-medium text-rose-600">· Full</span>}
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-slate-200">
        <div className={`h-1.5 rounded-full ${full ? "bg-rose-500" : "bg-brand-500"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
