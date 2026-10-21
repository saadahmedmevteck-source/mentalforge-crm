import { NextResponse } from "next/server";
import { tasksDueNow, taskCounts } from "@/lib/db";
import { addDays, nowHHMM, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Polled by the reminders component: badge count plus tasks whose reminder time has arrived.
export function GET() {
  const today = todayISO();
  const counts = taskCounts(today, addDays(today, 7));
  const dueNow = tasksDueNow(today, nowHHMM()).map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    due_time: t.due_time,
    deal_title: t.deal_title,
    contact_name: t.contact_name,
  }));
  return NextResponse.json({ count: counts.overdue + counts.today, dueNow });
}
