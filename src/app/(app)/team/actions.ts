"use server";

import { revalidatePath } from "next/cache";
import { MIN_PASSWORD, hashPassword, requireAdmin, requireUser, verifyPassword } from "@/lib/auth";
import { getUserForLogin, query, queryOne } from "@/lib/db";
import type { FormState } from "../../(auth)/actions";

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function addUser(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const name = text(form, "name");
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");
  const role = text(form, "role") === "admin" ? "admin" : "member";
  if (!name || !email) return { error: "Name and email are required." };
  if (password.length < MIN_PASSWORD) return { error: `Password must be at least ${MIN_PASSWORD} characters.` };
  if (await getUserForLogin(email)) return { error: "Someone with that email is already on the team." };
  await query("INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)", [
    name,
    email,
    await hashPassword(password),
    role,
  ]);
  revalidatePath("/team");
  return { ok: `${name} added. Share the email and password with them so they can sign in.` };
}

// Refuses changes that would leave the CRM without an active admin.
async function wouldRemoveLastAdmin(userId: number) {
  const row = await queryOne<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin' AND active AND id <> $1",
    [userId],
  );
  return row!.n === 0;
}

export async function setUserActive(userId: number, active: boolean) {
  const admin = await requireAdmin();
  if (userId === admin.id) throw new Error("You can't deactivate your own account.");
  if (!active && (await wouldRemoveLastAdmin(userId))) throw new Error("At least one active admin is required.");
  await query("UPDATE users SET active = $1 WHERE id = $2", [active, userId]);
  // Signed-in sessions end immediately on deactivation.
  if (!active) await query("DELETE FROM sessions WHERE user_id = $1", [userId]);
  revalidatePath("/team");
}

export async function setUserRole(userId: number, role: "admin" | "member") {
  await requireAdmin();
  if (role === "member" && (await wouldRemoveLastAdmin(userId))) throw new Error("At least one active admin is required.");
  await query("UPDATE users SET role = $1 WHERE id = $2", [role, userId]);
  revalidatePath("/team");
}

export async function resetPassword(userId: number, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const password = String(form.get("password") ?? "");
  if (password.length < MIN_PASSWORD) return { error: `Password must be at least ${MIN_PASSWORD} characters.` };
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [await hashPassword(password), userId]);
  await query("DELETE FROM sessions WHERE user_id = $1", [userId]);
  return { ok: "Password reset. They'll need to sign in again." };
}

export async function changeOwnPassword(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("password") ?? "");
  const stored = await getUserForLogin(user.email);
  if (!stored || !(await verifyPassword(current, stored.password_hash))) {
    return { error: "Your current password is wrong." };
  }
  if (next.length < MIN_PASSWORD) return { error: `New password must be at least ${MIN_PASSWORD} characters.` };
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [await hashPassword(next), user.id]);
  return { ok: "Password changed." };
}
