import { LIFECYCLES, SOURCES, type Contact } from "@/lib/constants";

export function ContactFields({ contact, companies }: { contact?: Partial<Contact>; companies: string[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="name">Full name *</label>
        <input id="name" name="name" required defaultValue={contact?.name} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="job_title">Job title</label>
        <input id="job_title" name="job_title" defaultValue={contact?.job_title} placeholder="e.g. Owner, Marketing Director" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" defaultValue={contact?.email} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" defaultValue={contact?.phone} className="field" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="company_name">Company</label>
        <input id="company_name" name="company_name" list="company-options" autoComplete="off" defaultValue={contact?.company_name} placeholder="Pick or type a new company" className="field" />
        <datalist id="company-options">
          {companies.map((name) => <option key={name} value={name} />)}
        </datalist>
      </div>
      <div>
        <label className="label" htmlFor="lifecycle">Lifecycle stage</label>
        <select id="lifecycle" name="lifecycle" defaultValue={contact?.lifecycle ?? "Lead"} className="field">
          {LIFECYCLES.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="source">Lead source</label>
        <select id="source" name="source" defaultValue={contact?.source ?? ""} className="field">
          <option value="">—</option>
          {SOURCES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={contact?.notes} className="field" />
      </div>
    </div>
  );
}
