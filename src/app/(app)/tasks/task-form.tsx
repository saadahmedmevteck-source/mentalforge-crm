import { PRIORITIES, TASK_TYPES, type Task } from "@/lib/constants";

export function TaskFields({
  task,
  deals,
  contacts,
}: {
  task?: Partial<Task>;
  deals: { id: number; title: string }[];
  contacts: { id: number; name: string; company_name: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="title">Task *</label>
        <input id="title" name="title" required defaultValue={task?.title} placeholder="e.g. Send workshop proposal" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="type">Type</label>
        <select id="type" name="type" defaultValue={task?.type ?? "Follow-up"} className="field">
          {TASK_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="priority">Priority</label>
        <select id="priority" name="priority" defaultValue={task?.priority ?? "normal"} className="field">
          {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="due_date">Due date</label>
        <input id="due_date" name="due_date" type="date" defaultValue={task?.due_date} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="due_time">Reminder time</label>
        <input id="due_time" name="due_time" type="time" defaultValue={task?.due_time} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="deal_id">Deal</label>
        <select id="deal_id" name="deal_id" defaultValue={task?.deal_id ?? ""} className="field">
          <option value="">— None —</option>
          {deals.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="contact_id">Contact</label>
        <select id="contact_id" name="contact_id" defaultValue={task?.contact_id ?? ""} className="field">
          <option value="">— Deal&apos;s contact / none —</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>{c.company_name ? `${c.name} (${c.company_name})` : c.name}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={task?.notes} className="field" />
      </div>
    </div>
  );
}
