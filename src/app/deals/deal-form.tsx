import { SERVICES, SOURCES, STAGES, type Deal } from "@/lib/constants";

export function DealFields({ deal }: { deal?: Deal }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="title">Deal name *</label>
        <input id="title" name="title" required defaultValue={deal?.title} placeholder="e.g. Acme Corp – AI Automation rollout" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="contact_name">Contact name</label>
        <input id="contact_name" name="contact_name" defaultValue={deal?.contact_name} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="company">Company</label>
        <input id="company" name="company" defaultValue={deal?.company} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" defaultValue={deal?.email} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" defaultValue={deal?.phone} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="service">Service</label>
        <select id="service" name="service" defaultValue={deal?.service ?? SERVICES[0]} className="field">
          {SERVICES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="value">Deal value (USD)</label>
        <input id="value" name="value" inputMode="decimal" defaultValue={deal?.value || ""} placeholder="0" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="stage">Stage</label>
        <select id="stage" name="stage" defaultValue={deal?.stage ?? "lead"} className="field">
          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="source">Lead source</label>
        <select id="source" name="source" defaultValue={deal?.source ?? ""} className="field">
          <option value="">—</option>
          {SOURCES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="expected_close">Expected close date</label>
        <input id="expected_close" name="expected_close" type="date" defaultValue={deal?.expected_close} className="field" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="notes">Description</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={deal?.notes} className="field" />
      </div>
    </div>
  );
}
