"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, findOrCreateCompany } from "@/lib/db";
import { LIFECYCLES } from "@/lib/constants";

function readContactForm(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const lifecycle = text("lifecycle");
  const company = text("company_name");
  return {
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    job_title: text("job_title"),
    company_id: company ? findOrCreateCompany(company) : null,
    lifecycle: (LIFECYCLES as readonly string[]).includes(lifecycle) ? lifecycle : "Lead",
    source: text("source"),
    notes: text("notes"),
  };
}

export async function createContact(form: FormData) {
  const c = readContactForm(form);
  if (!c.name) throw new Error("Contact name is required");
  const id = Number(
    db
      .prepare(
        `INSERT INTO contacts (name, email, phone, job_title, company_id, lifecycle, source, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(c.name, c.email, c.phone, c.job_title, c.company_id, c.lifecycle, c.source, c.notes)
      .lastInsertRowid,
  );
  revalidatePath("/", "layout");
  redirect(`/contacts/${id}`);
}

export async function updateContact(id: number, form: FormData) {
  const c = readContactForm(form);
  if (!c.name) throw new Error("Contact name is required");
  db.prepare(
    `UPDATE contacts SET name = ?, email = ?, phone = ?, job_title = ?, company_id = ?,
       lifecycle = ?, source = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(c.name, c.email, c.phone, c.job_title, c.company_id, c.lifecycle, c.source, c.notes, id);
  revalidatePath("/", "layout");
}

export async function deleteContact(id: number) {
  db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
  revalidatePath("/", "layout");
  redirect("/contacts");
}
