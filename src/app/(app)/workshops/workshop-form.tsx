import { WORKSHOP_FORMATS, WORKSHOP_PROGRAMS, WORKSHOP_STATUSES, type Workshop } from "@/lib/constants";

export function WorkshopFields({ workshop }: { workshop?: Partial<Workshop> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="title">Workshop title *</label>
        <input id="title" name="title" required defaultValue={workshop?.title} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="program">Program</label>
        <select id="program" name="program" defaultValue={workshop?.program ?? WORKSHOP_PROGRAMS[0]} className="field">
          {WORKSHOP_PROGRAMS.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={workshop?.status ?? "scheduled"} className="field">
          {WORKSHOP_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="date">Date *</label>
        <input id="date" name="date" type="date" required defaultValue={workshop?.date} className="field" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label" htmlFor="start_time">Starts</label>
          <input id="start_time" name="start_time" type="time" defaultValue={workshop?.start_time} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="end_time">Ends</label>
          <input id="end_time" name="end_time" type="time" defaultValue={workshop?.end_time} className="field" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="format">Format</label>
        <select id="format" name="format" defaultValue={workshop?.format ?? "in_person"} className="field">
          {WORKSHOP_FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="location">Location / link</label>
        <input id="location" name="location" defaultValue={workshop?.location} placeholder="e.g. Plano, TX or Zoom link" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="capacity">Seats</label>
        <input id="capacity" name="capacity" type="number" min={0} defaultValue={workshop?.capacity || ""} placeholder="0 = no limit" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="price">Price per seat (USD)</label>
        <input id="price" name="price" inputMode="decimal" defaultValue={workshop?.price || ""} placeholder="0" className="field" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={workshop?.notes} placeholder="Agenda, venue details, what to bring…" className="field" />
      </div>
    </div>
  );
}
