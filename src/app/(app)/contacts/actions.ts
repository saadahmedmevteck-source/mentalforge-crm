"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { findOrCreateCompany, query, queryOne } from "@/lib/db";
import { LIFECYCLES } from "@/lib/constants";

async function readContactForm(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const lifecycle = text("lifecycle");
  const company = text("company_name");
  return {
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    job_title: text("job_title"),
    company_id: company ? await findOrCreateCompany(company) : null,
    lifecycle: (LIFECYCLES as readonly string[]).includes(lifecycle) ? lifecycle : "Lead",
    source: text("source"),
    notes: text("notes"),
  };
}

export async function createContact(form: FormData) {
  await requireUser();
  const c = await readContactForm(form);
  if (!c.name) throw new Error("Contact name is required");
  const row = await queryOne<{ id: number }>(
    `INSERT INTO contacts (name, email, phone, job_title, company_id, lifecycle, source, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [c.name, c.email, c.phone, c.job_title, c.company_id, c.lifecycle, c.source, c.notes],
  );
  revalidatePath("/", "layout");
  redirect(`/contacts/${row!.id}`);
}

export async function updateContact(id: number, form: FormData) {
  await requireUser();
  const c = await readContactForm(form);
  if (!c.name) throw new Error("Contact name is required");
  await query(
    `UPDATE contacts SET name = $1, email = $2, phone = $3, job_title = $4, company_id = $5,
       lifecycle = $6, source = $7, notes = $8, updated_at = now()
     WHERE id = $9`,
    [c.name, c.email, c.phone, c.job_title, c.company_id, c.lifecycle, c.source, c.notes, id],
  );
  revalidatePath("/", "layout");
}

export async function deleteContact(id: number) {
  await requireUser();
  await query("DELETE FROM contacts WHERE id = $1", [id]);
  revalidatePath("/", "layout");
  redirect("/contacts");
}
