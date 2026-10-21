"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDeal, getTask, logActivity, query } from "@/lib/db";
import { PRIORITIES, TASK_TYPES } from "@/lib/constants";
import { formatDay, formatTime } from "@/lib/dates";

async function readTaskForm(form: FormData) {
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
  if (task.deal_id && !task.contact_id) task.contact_id = (await getDeal(task.deal_id))?.contact_id ?? null;
  if (!task.due_date) task.due_time = "";
  return task;
}

function dueText(date: string, time: string) {
  if (!date) return "";
  return ` · due ${formatDay(date)}${time ? ` ${formatTime(time)}` : ""}`;
}

export async function createTask(form: FormData) {
  const user = await requireUser();
  const t = await readTaskForm(form);
  if (!t.title) throw new Error("Task title is required");
  await query(
    `INSERT INTO tasks (title, type, priority, due_date, due_time, deal_id, contact_id, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [t.title, t.type, t.priority, t.due_date, t.due_time, t.deal_id, t.contact_id, t.notes],
  );
  if (t.deal_id) {
    await logActivity(t.deal_id, "task", `Task scheduled: ${t.title}${dueText(t.due_date, t.due_time)}`, user.id);
  }
  revalidatePath("/", "layout");
  const returnTo = String(form.get("return_to") ?? "");
  if (returnTo.startsWith("/") && !returnTo.startsWith("//")) redirect(returnTo);
}

export async function updateTask(id: number, form: FormData) {
  await requireUser();
  const t = await readTaskForm(form);
  if (!t.title) throw new Error("Task title is required");
  await query(
    `UPDATE tasks SET title = $1, type = $2, priority = $3, due_date = $4, due_time = $5,
       deal_id = $6, contact_id = $7, notes = $8, updated_at = now()
     WHERE id = $9`,
    [t.title, t.type, t.priority, t.due_date, t.due_time, t.deal_id, t.contact_id, t.notes, id],
  );
  revalidatePath("/", "layout");
}

export async function toggleTask(id: number) {
  const user = await requireUser();
  const task = await getTask(id);
  if (!task) return;
  const done = task.status === "open";
  await query(
    done
      ? "UPDATE tasks SET status = 'done', done_at = now(), updated_at = now() WHERE id = $1"
      : "UPDATE tasks SET status = 'open', done_at = NULL, updated_at = now() WHERE id = $1",
    [id],
  );
  if (task.deal_id) {
    await logActivity(task.deal_id, "task", `${done ? "Task completed" : "Task reopened"}: ${task.title}`, user.id);
  }
  revalidatePath("/", "layout");
}

export async function deleteTask(id: number) {
  await requireUser();
  await query("DELETE FROM tasks WHERE id = $1", [id]);
  revalidatePath("/", "layout");
  redirect("/tasks");
}
