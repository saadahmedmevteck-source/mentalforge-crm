"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, getDeal, getTask, logActivity } from "@/lib/db";
import { PRIORITIES, TASK_TYPES } from "@/lib/constants";
import { formatDay, formatTime } from "@/lib/dates";

function readTaskForm(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const id = (key: string) => Number(text(key)) || null;
  const type = text("type");
  const priority = text("priority");
  const due_date = text("due_date");
  const due_time = text("due_time");
  const task = {
    title: text("title"),
    type: (TASK_TYPES as readonly string[]).includes(type) ? type : "To-do",
    priority: PRIORITIES.some((p) => p.id === priority) ? priority : "normal",
    due_date: /^\d{4}-\d{2}-\d{2}$/.test(due_date) ? due_date : "",
    due_time: /^\d{2}:\d{2}$/.test(due_time) ? due_time : "",
    deal_id: id("deal_id"),
    contact_id: id("contact_id"),
    notes: text("notes"),
  };
  // A task on a deal is about the deal's contact unless another one was picked.
  if (task.deal_id && !task.contact_id) task.contact_id = getDeal(task.deal_id)?.contact_id ?? null;
  if (!task.due_date) task.due_time = "";
  return task;
}

function dueText(date: string, time: string) {
  if (!date) return "";
  return ` · due ${formatDay(date)}${time ? ` ${formatTime(time)}` : ""}`;
}

export async function createTask(form: FormData) {
  const t = readTaskForm(form);
  if (!t.title) throw new Error("Task title is required");
  db.prepare(
    `INSERT INTO tasks (title, type, priority, due_date, due_time, deal_id, contact_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(t.title, t.type, t.priority, t.due_date, t.due_time, t.deal_id, t.contact_id, t.notes);
  if (t.deal_id) logActivity(t.deal_id, "task", `Task scheduled: ${t.title}${dueText(t.due_date, t.due_time)}`);
  revalidatePath("/", "layout");
  const returnTo = String(form.get("return_to") ?? "");
  if (returnTo.startsWith("/")) redirect(returnTo);
}

export async function updateTask(id: number, form: FormData) {
  const t = readTaskForm(form);
  if (!t.title) throw new Error("Task title is required");
  db.prepare(
    `UPDATE tasks SET title = ?, type = ?, priority = ?, due_date = ?, due_time = ?,
       deal_id = ?, contact_id = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(t.title, t.type, t.priority, t.due_date, t.due_time, t.deal_id, t.contact_id, t.notes, id);
  revalidatePath("/", "layout");
}

export async function toggleTask(id: number) {
  const task = getTask(id);
  if (!task) return;
  const done = task.status === "open";
  db.prepare(
    `UPDATE tasks SET status = ?, done_at = CASE WHEN ? THEN datetime('now') ELSE '' END,
       updated_at = datetime('now')
     WHERE id = ?`,
  ).run(done ? "done" : "open", done ? 1 : 0, id);
  if (task.deal_id) {
    logActivity(task.deal_id, "task", `${done ? "Task completed" : "Task reopened"}: ${task.title}`);
  }
  revalidatePath("/", "layout");
}

export async function deleteTask(id: number) {
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  revalidatePath("/", "layout");
  redirect("/tasks");
}
