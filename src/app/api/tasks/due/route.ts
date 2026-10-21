import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { tasksDueNow, taskCounts } from "@/lib/db";
import { addDays, nowHHMM, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

// Polled by the reminders component: badge count plus tasks whose reminder time has arrived.
export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const today = todayISO();
  const [counts, due] = await Promise.all([taskCounts(today, addDays(today, 7)), tasksDueNow(today, nowHHMM())]);
  const dueNow = due.map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    due_time: t.due_time,
    deal_title: t.deal_title,
    contact_name: t.contact_name,
  }));
  return NextResponse.json({ count: counts.overdue + counts.today, dueNow });
}
