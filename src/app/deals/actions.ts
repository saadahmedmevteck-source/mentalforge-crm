"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, findOrCreateCompany, getDeal, logActivity, upsertContact } from "@/lib/db";
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
function linkParties(d: ReturnType<typeof readDealForm>) {
  const companyId = d.company_name ? findOrCreateCompany(d.company_name) : null;
  const contactId = d.contact_name
    ? upsertContact({ name: d.contact_name, email: d.contact_email, phone: d.contact_phone, companyId })
    : null;
  return { contactId, companyId };
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function createDeal(form: FormData) {
  const d = readDealForm(form);
  if (!d.title) throw new Error("Deal name is required");
  const { contactId, companyId } = linkParties(d);
  const result = db
    .prepare(
      `INSERT INTO deals (title, contact_id, company_id, service, value, stage, source, expected_close, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      d.title, contactId, companyId, d.service,
      d.value, d.stage, d.source, d.expected_close, d.notes,
    );
  const id = Number(result.lastInsertRowid);
  logActivity(id, "created", `Deal created in ${stageLabel(d.stage)}`);
  revalidateAll();
  redirect("/deals");
}

export async function updateDeal(id: number, form: FormData) {
  const before = getDeal(id);
  if (!before) throw new Error("Deal not found");
  const d = readDealForm(form);
  if (!d.title) throw new Error("Deal name is required");
  const { contactId, companyId } = linkParties(d);
  db.prepare(
    `UPDATE deals SET title = ?, contact_id = ?, company_id = ?, service = ?,
       value = ?, stage = ?, source = ?, expected_close = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    d.title, contactId, companyId, d.service,
    d.value, d.stage, d.source, d.expected_close, d.notes, id,
  );
  if (before.stage !== d.stage) {
    logActivity(id, "stage", `${stageLabel(before.stage)} → ${stageLabel(d.stage)}`);
  } else {
    logActivity(id, "updated", "Deal details updated");
  }
  revalidateAll();
}

export async function moveDeal(id: number, stage: StageId) {
  const before = getDeal(id);
  if (!before || before.stage === stage) return;
  if (!STAGES.some((s) => s.id === stage)) throw new Error("Unknown stage");
  db.prepare(
    "UPDATE deals SET stage = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(stage, id);
  logActivity(id, "stage", `${stageLabel(before.stage)} → ${stageLabel(stage)}`);
  revalidateAll();
}

export async function addNote(id: number, form: FormData) {
  const body = String(form.get("body") ?? "").trim();
  if (!body) return;
  logActivity(id, "note", body);
  db.prepare("UPDATE deals SET updated_at = datetime('now') WHERE id = ?").run(id);
  revalidatePath(`/deals/${id}`);
}

export async function deleteDeal(id: number) {
  db.prepare("DELETE FROM deals WHERE id = ?").run(id);
  revalidateAll();
  redirect("/deals");
}
