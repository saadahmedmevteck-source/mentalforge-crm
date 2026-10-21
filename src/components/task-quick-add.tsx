import { createTask } from "@/app/tasks/actions";
import { TASK_TYPES } from "@/lib/constants";

export function TaskQuickAdd({
  today,
  dealId,
  contactId,
}: {
  today: string;
  dealId?: number | null;
  contactId?: number | null;
}) {
  return (
    <form action={createTask} className="mt-3 space-y-2 border-t border-slate-100 pt-3">
      {dealId && <input type="hidden" name="deal_id" value={dealId} />}
      {contactId && <input type="hidden" name="contact_id" value={contactId} />}
      <input name="title" required placeholder="Add a task, e.g. Follow up on proposal" aria-label="Task title" className="field" />
      <div className="flex flex-wrap gap-2">
        <select name="type" defaultValue="Follow-up" aria-label="Task type" className="field w-auto flex-1">
          {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input name="due_date" type="date" defaultValue={today} aria-label="Due date" className="field w-auto flex-1" />
        <input name="due_time" type="time" aria-label="Due time" className="field w-auto" />
        <button type="submit" className="btn-primary">Add</button>
      </div>
    </form>
  );
}
