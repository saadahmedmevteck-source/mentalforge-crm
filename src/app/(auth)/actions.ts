"use server";

import { redirect } from "next/navigation";
import { countUsers, getUserForLogin, query } from "@/lib/db";
import { MIN_PASSWORD, createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");
  const user = email ? await getUserForLogin(email) : undefined;
  // Same message and similar timing whether the email exists or not.
  const ok = user
    ? await verifyPassword(password, user.password_hash)
    : (await hashPassword(password), false);
  if (!user || !ok || !user.active) {
    await new Promise((r) => setTimeout(r, 400));
    return { error: user && ok && !user.active ? "This account has been deactivated." : "Wrong email or password." };
  }
  await createSession(user.id);
  redirect("/");
}

/** Creates the first admin. Only works while there are no users at all. */
export async function setupAdmin(_: FormState, form: FormData): Promise<FormState> {
  if ((await countUsers()) > 0) redirect("/login");
  const name = text(form, "name");
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");
  if (!name || !email) return { error: "Name and email are required." };
  if (password.length < MIN_PASSWORD) return { error: `Password must be at least ${MIN_PASSWORD} characters.` };
  const created = await query<{ id: number }>(
    `INSERT INTO users (name, email, password_hash, role)
     SELECT $1, $2, $3, 'admin' WHERE NOT EXISTS (SELECT 1 FROM users)
     RETURNING id`,
    [name, email, await hashPassword(password)],
  );
  if (!created[0]) redirect("/login");
  await createSession(created[0].id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
