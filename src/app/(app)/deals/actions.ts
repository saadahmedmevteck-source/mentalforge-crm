"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { findOrCreateCompany, getDeal, logActivity, query, queryOne, upsertContact } from "@/lib/db";
import { STAGES, stageLabel, type StageId } from "@/lib/constants";

function readDealForm(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const stage = text("stage");
  return {
    title: text("title"),
    contact_name: text("contact_name"),
    contact_email: text("contact_email"),
    contact_phone: text("contact_phone"),
    company_name: text("company_name"),
    service: text("service"),
    value: Number(text("value").replace(/[^0-9.]/g, "")) || 0,
    stage: (STAGES.some((s) => s.id === stage) ? stage : "lead") as StageId,
    source: text("source"),
    expected_close: text("expected_close"),
    notes: text("notes"),
  };
}

// Typing a new contact or company name on a deal creates it.
async function linkParties(d: ReturnType<typeof readDealForm>) {
  const companyId = d.company_name ? await findOrCreateCompany(d.company_name) : null;
  const contactId = d.contact_name
    ? await upsertContact({ name: d.contact_name, email: d.contact_email, phone: d.contact_phone, companyId })
    : null;
  return { contactId, companyId };
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function createDeal(form: FormData) {
  const user = await requireUser();
  const d = readDealForm(form);
  if (!d.title) throw new Error("Deal name is required");
  const { contactId, companyId } = await linkParties(d);
  const row = await queryOne<{ id: number }>(
    `INSERT INTO deals (title, contact_id, company_id, service, value, stage, source, expected_close, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [d.title, contactId, companyId, d.service, d.value, d.stage, d.source, d.expected_close, d.notes],
  );
  await logActivity(row!.id, "created", `Deal created in ${stageLabel(d.stage)}`, user.id);
  revalidateAll();
  redirect("/deals");
}

export async function updateDeal(id: number, form: FormData) {
  const user = await requireUser();
  const before = await getDeal(id);
  if (!before) throw new Error("Deal not found");
  const d = readDealForm(form);
  if (!d.title) throw new Error("Deal name is required");
  const { contactId, companyId } = await linkParties(d);
  await query(
    `UPDATE deals SET title = $1, contact_id = $2, company_id = $3, service = $4,
       value = $5, stage = $6, source = $7, expected_close = $8, notes = $9, updated_at = now()
     WHERE id = $10`,
    [d.title, contactId, companyId, d.service, d.value, d.stage, d.source, d.expected_close, d.notes, id],
  );
  if (before.stage !== d.stage) {
    await logActivity(id, "stage", `${stageLabel(before.stage)} → ${stageLabel(d.stage)}`, user.id);
  } else {
    await logActivity(id, "updated", "Deal details updated", user.id);
  }
  revalidateAll();
}

export async function moveDeal(id: number, stage: StageId) {
  const user = await requireUser();
  const before = await getDeal(id);
  if (!before || before.stage === stage) return;
  if (!STAGES.some((s) => s.id === stage)) throw new Error("Unknown stage");
  await query("UPDATE deals SET stage = $1, updated_at = now() WHERE id = $2", [stage, id]);
  await logActivity(id, "stage", `${stageLabel(before.stage)} → ${stageLabel(stage)}`, user.id);
  revalidateAll();
}

export async function addNote(id: number, form: FormData) {
  const user = await requireUser();
  const body = String(form.get("body") ?? "").trim();
  if (!body) return;
  await logActivity(id, "note", body, user.id);
  await query("UPDATE deals SET updated_at = now() WHERE id = $1", [id]);
  revalidatePath(`/deals/${id}`);
}

export async function deleteDeal(id: number) {
  await requireUser();
  await query("DELETE FROM deals WHERE id = $1", [id]);
  revalidateAll();
  redirect("/deals");
}
