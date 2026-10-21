"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { findCompanyId, query, queryOne } from "@/lib/db";

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

export async function createCompany(form: FormData) {
  await requireUser();
  const c = readCompanyForm(form);
  if (!c.name) throw new Error("Company name is required");
  // Names are unique (case-insensitive); open the existing record instead of failing.
  const id =
    (await findCompanyId(c.name)) ??
    (await queryOne<{ id: number }>(
      `INSERT INTO companies (name, domain, industry, size, phone, city, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [c.name, c.domain, c.industry, c.size, c.phone, c.city, c.notes],
    ))!.id;
  revalidatePath("/", "layout");
  redirect(`/companies/${id}`);
}

export async function updateCompany(id: number, form: FormData) {
  await requireUser();
  const c = readCompanyForm(form);
  if (!c.name) throw new Error("Company name is required");
  const clash = await findCompanyId(c.name);
  if (clash && clash !== id) throw new Error(`Another company is already named "${c.name}"`);
  await query(
    `UPDATE companies SET name = $1, domain = $2, industry = $3, size = $4, phone = $5, city = $6,
       notes = $7, updated_at = now()
     WHERE id = $8`,
    [c.name, c.domain, c.industry, c.size, c.phone, c.city, c.notes, id],
  );
  revalidatePath("/", "layout");
}

export async function deleteCompany(id: number) {
  await requireUser();
  await query("DELETE FROM companies WHERE id = $1", [id]);
  revalidatePath("/", "layout");
  redirect("/companies");
}
