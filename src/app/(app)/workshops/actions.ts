"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { findOrCreateCompany, getWorkshop, query, queryOne, upsertContact } from "@/lib/db";
import {
  REGISTRATION_STATUSES,
  WORKSHOP_FORMATS,
  WORKSHOP_STATUSES,
  type RegistrationStatus,
} from "@/lib/constants";
import { addDays, formatDay, todayISO } from "@/lib/dates";
import type { FormState } from "../../(auth)/actions";

function readWorkshopForm(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const time = (key: string) => (/^\d{2}:\d{2}$/.test(text(key)) ? text(key) : "");
  const format = text("format");
  const status = text("status");
  return {
    title: text("title"),
    program: text("program"),
    date: /^\d{4}-\d{2}-\d{2}$/.test(text("date")) ? text("date") : "",
    start_time: time("start_time"),
    end_time: time("end_time"),
    format: WORKSHOP_FORMATS.some((f) => f.id === format) ? format : "in_person",
    location: text("location"),
    capacity: Math.max(0, Math.floor(Number(text("capacity")) || 0)),
    price: Number(text("price").replace(/[^0-9.]/g, "")) || 0,
    status: WORKSHOP_STATUSES.some((s) => s.id === status) ? status : "scheduled",
    notes: text("notes"),
  };
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function createWorkshop(form: FormData) {
  await requireUser();
  const w = readWorkshopForm(form);
  if (!w.title || !w.date) throw new Error("Title and date are required");
  const row = await queryOne<{ id: number }>(
    `INSERT INTO workshops (title, program, date, start_time, end_time, format, location, capacity, price, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
    [w.title, w.program, w.date, w.start_time, w.end_time, w.format, w.location, w.capacity, w.price, w.status, w.notes],
  );
  revalidateAll();
  redirect(`/workshops/${row!.id}`);
}

export async function updateWorkshop(id: number, form: FormData) {
  await requireUser();
  const w = readWorkshopForm(form);
  if (!w.title || !w.date) throw new Error("Title and date are required");
  await query(
    `UPDATE workshops SET title = $1, program = $2, date = $3, start_time = $4, end_time = $5, format = $6,
       location = $7, capacity = $8, price = $9, status = $10, notes = $11, updated_at = now()
     WHERE id = $12`,
    [w.title, w.program, w.date, w.start_time, w.end_time, w.format, w.location, w.capacity, w.price, w.status, w.notes, id],
  );
  revalidateAll();
}

export async function deleteWorkshop(id: number) {
  await requireUser();
  await query("DELETE FROM workshops WHERE id = $1", [id]);
  revalidateAll();
  redirect("/workshops");
}

/** Registers a contact (created from the name if new). Goes to the waitlist when the workshop is full. */
export async function addAttendee(workshopId: number, _: FormState, form: FormData): Promise<FormState> {
  await requireUser();
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const name = text("name");
  if (!name) return { error: "Name is required." };
  const workshop = await getWorkshop(workshopId);
  if (!workshop) return { error: "Workshop not found." };

  const companyId = text("company_name") ? await findOrCreateCompany(text("company_name")) : null;
  const contactId = await upsertContact({ name, email: text("email"), phone: text("phone"), companyId });
  // Leads that came in through a workshop are tagged as such, unless they already have a source.
  await query("UPDATE contacts SET source = 'Workshop attendee' WHERE id = $1 AND source = ''", [contactId]);

  const full = workshop.capacity > 0 && workshop.seats_taken >= workshop.capacity;
  const status: RegistrationStatus = full ? "waitlist" : "registered";
  const paid = form.get("paid") === "on" ? workshop.price : 0;
  const inserted = await query(
    `INSERT INTO workshop_registrations (workshop_id, contact_id, status, amount_paid)
     VALUES ($1, $2, $3, $4) ON CONFLICT (workshop_id, contact_id) DO NOTHING RETURNING id`,
    [workshopId, contactId, status, paid],
  );
  revalidateAll();
  if (!inserted.length) return { error: `${name} is already on this workshop's list.` };
  return { ok: full ? `${name} added to the waitlist (workshop is full).` : `${name} registered.` };
}

export async function setRegistrationStatus(registrationId: number, form: FormData) {
  await requireUser();
  const status = String(form.get("status") ?? "");
  if (!REGISTRATION_STATUSES.some((s) => s.id === status)) throw new Error("Unknown status");
  await query("UPDATE workshop_registrations SET status = $1 WHERE id = $2", [status, registrationId]);
  revalidateAll();
}

export async function togglePaid(registrationId: number) {
  await requireUser();
  await query(
    `UPDATE workshop_registrations r
     SET amount_paid = CASE WHEN r.amount_paid > 0 THEN 0 ELSE w.price END
     FROM workshops w
     WHERE w.id = r.workshop_id AND r.id = $1`,
    [registrationId],
  );
  revalidateAll();
}

export async function removeRegistration(registrationId: number) {
  await requireUser();
  await query("DELETE FROM workshop_registrations WHERE id = $1", [registrationId]);
  revalidateAll();
}

/** One follow-up task per attendee, due the next day. Skips people who already have that task. */
export async function createFollowUps(workshopId: number): Promise<FormState> {
  await requireUser();
  const workshop = await getWorkshop(workshopId);
  if (!workshop) return { error: "Workshop not found." };
  const title = `Follow up after ${workshop.title} (${formatDay(workshop.date)})`;
  const due = addDays(workshop.date < todayISO() ? todayISO() : workshop.date, 1);
  const created = await query(
    `INSERT INTO tasks (title, type, priority, due_date, contact_id, notes)
     SELECT $1, 'Follow-up', 'normal', $2, r.contact_id, 'Ask how they are applying what they learned and whether they want help implementing it.'
     FROM workshop_registrations r
     WHERE r.workshop_id = $3 AND r.status = 'attended'
       AND NOT EXISTS (SELECT 1 FROM tasks t WHERE t.contact_id = r.contact_id AND t.title = $1)
     RETURNING id`,
    [title, due, workshopId],
  );
  revalidateAll();
  if (!workshop.attended_count) return { error: "Mark who attended first; follow-ups are created for attendees." };
  return {
    ok: created.length
      ? `Created ${created.length} follow-up task${created.length === 1 ? "" : "s"}, due ${formatDay(due)}.`
      : "Every attendee already has a follow-up task.",
  };
}
