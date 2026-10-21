"use client";

import { SERVICES, SOURCES, STAGES, type ContactOption, type Deal } from "@/lib/constants";

export function DealFields({
  deal,
  contacts,
  companies,
}: {
  deal?: Partial<Deal>;
  contacts: ContactOption[];
  companies: string[];
}) {
  // Picking a known contact fills in their details where the form is still blank.
  function onContactChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.currentTarget.value.trim().toLowerCase();
    const match = contacts.find((c) => c.name.toLowerCase() === name);
    const form = e.currentTarget.form;
    if (!match || !form) return;
    const fill = (field: string, value: string) => {
      const input = form.elements.namedItem(field) as HTMLInputElement | null;
      if (input && !input.value && value) input.value = value;
    };
    fill("contact_email", match.email);
    fill("contact_phone", match.phone);
    fill("company_name", match.company_name);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="title">Deal name *</label>
        <input id="title" name="title" required defaultValue={deal?.title} placeholder="e.g. Acme Corp – AI Automation rollout" className="field" />
      </div>

      <fieldset className="grid gap-4 rounded-lg border border-slate-200 p-4 sm:col-span-2 sm:grid-cols-2">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact &amp; company</legend>
        <div>
          <label className="label" htmlFor="contact_name">Contact</label>
          <input id="contact_name" name="contact_name" list="contact-options" autoComplete="off" defaultValue={deal?.contact_name} onChange={onContactChange} placeholder="Pick or type a new name" className="field" />
          <datalist id="contact-options">
            {contacts.map((c, i) => (
              <option key={i} value={c.name}>{c.company_name}</option>
            ))}
          </datalist>
        </div>
        <div>
          <label className="label" htmlFor="company_name">Company</label>
          <input id="company_name" name="company_name" list="company-options" autoComplete="off" defaultValue={deal?.company_name} placeholder="Pick or type a new company" className="field" />
          <datalist id="company-options">
            {companies.map((name) => <option key={name} value={name} />)}
          </datalist>
        </div>
        <div>
          <label className="label" htmlFor="contact_email">Contact email</label>
          <input id="contact_email" name="contact_email" type="email" defaultValue={deal?.contact_email} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="contact_phone">Contact phone</label>
          <input id="contact_phone" name="contact_phone" type="tel" defaultValue={deal?.contact_phone} className="field" />
        </div>
        <p className="text-xs text-slate-500 sm:col-span-2">
          New names are saved as new contacts / companies. Email and phone are saved on the contact.
        </p>
      </fieldset>

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
