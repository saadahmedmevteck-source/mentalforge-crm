"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

function readCompanyForm(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  return {
    name: text("name"),
    domain: text("domain").replace(/^https?:\/\//i, "").replace(/\/.*$/, ""),
    industry: text("industry"),
    size: text("size"),
    phone: text("phone"),
    city: text("city"),
    notes: text("notes"),
  };
}

function existingId(name: string) {
  return (db.prepare("SELECT id FROM companies WHERE name = ?").get(name) as { id: number } | undefined)?.id;
}

export async function createCompany(form: FormData) {
  const c = readCompanyForm(form);
  if (!c.name) throw new Error("Company name is required");
  // Names are unique (case-insensitive); open the existing record instead of failing.
  const id =
    existingId(c.name) ??
    Number(
      db
        .prepare(
          `INSERT INTO companies (name, domain, industry, size, phone, city, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(c.name, c.domain, c.industry, c.size, c.phone, c.city, c.notes).lastInsertRowid,
    );
  revalidatePath("/", "layout");
  redirect(`/companies/${id}`);
}

export async function updateCompany(id: number, form: FormData) {
  const c = readCompanyForm(form);
  if (!c.name) throw new Error("Company name is required");
  const clash = existingId(c.name);
  if (clash && clash !== id) throw new Error(`Another company is already named "${c.name}"`);
  db.prepare(
    `UPDATE companies SET name = ?, domain = ?, industry = ?, size = ?, phone = ?, city = ?,
       notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(c.name, c.domain, c.industry, c.size, c.phone, c.city, c.notes, id);
  revalidatePath("/", "layout");
}

export async function deleteCompany(id: number) {
  db.prepare("DELETE FROM companies WHERE id = ?").run(id);
  revalidatePath("/", "layout");
  redirect("/companies");
}
