// Due dates and reminders are in the business's time zone (Mental Forge is in Texas),
// not the server's, so "today" is the same locally and when deployed.
export const CRM_TIMEZONE = process.env.NEXT_PUBLIC_CRM_TIMEZONE || "America/Chicago";

function nowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CRM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

/** Today as YYYY-MM-DD in the CRM time zone. */
export function todayISO() {
  const p = nowParts();
  return `${p.year}-${p.month}-${p.day}`;
}

/** Current time as HH:MM in the CRM time zone. */
export function nowHHMM() {
  const p = nowParts();
  return `${p.hour}:${p.minute}`;
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function formatDay(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
}

export function dueLabel(date: string, time: string, today: string) {
  if (!date) return { text: "No due date", tone: "none" as const };
  const at = time ? ` ${formatTime(time)}` : "";
  if (date < today) return { text: `Overdue · ${formatDay(date)}${at}`, tone: "overdue" as const };
  if (date === today) return { text: `Today${at}`, tone: "today" as const };
  if (date === addDays(today, 1)) return { text: `Tomorrow${at}`, tone: "later" as const };
  return { text: `${formatDay(date, { weekday: "short", month: "short", day: "numeric" })}${at}`, tone: "later" as const };
}
