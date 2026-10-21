import Link from "next/link";
import { notFound } from "next/navigation";
import { contactChoices, dealChoices, getTask } from "@/lib/db";
import { formatDateTime } from "@/lib/constants";
import { DeleteButton } from "@/components/delete-button";
import { deleteTask, toggleTask, updateTask } from "../actions";
import { TaskFields } from "../task-form";

export const dynamic = "force-dynamic";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTask(Number(id));
  if (!task) notFound();
  const done = task.status === "done";

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/tasks" className="text-sm text-slate-500 hover:text-slate-800">← All tasks</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-semibold ${done ? "text-slate-400 line-through" : ""}`}>{task.title}</h1>
          {done && <p className="text-sm text-emerald-600">Completed {formatDateTime(task.done_at)}</p>}
        </div>
        <form action={toggleTask.bind(null, task.id)}>
          <button type="submit" className={done ? "btn-ghost" : "btn bg-emerald-600 text-white hover:bg-emerald-700"}>
            {done ? "Reopen task" : "✓ Mark complete"}
          </button>
        </form>
      </div>

      <form action={updateTask.bind(null, task.id)} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <TaskFields task={task} deals={dealChoices()} contacts={contactChoices()} />
        <div className="flex justify-between gap-2">
          <DeleteButton action={deleteTask.bind(null, task.id)} label="Delete task" confirmText="Delete this task?" />
          <button type="submit" className="btn-primary">Save changes</button>
        </div>
      </form>
    </div>
  );
}
