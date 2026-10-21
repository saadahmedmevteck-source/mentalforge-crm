import { COMPANY_SIZES, type Company } from "@/lib/constants";

const INDUSTRY_SUGGESTIONS = [
  "Healthcare", "Dental", "Legal", "Real Estate", "Construction", "Home Services",
  "Marketing Agency", "Retail", "Restaurant / Hospitality", "Financial Services",
  "Insurance", "Manufacturing", "Education", "Nonprofit", "Technology",
];

export function CompanyFields({ company }: { company?: Partial<Company> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="name">Company name *</label>
        <input id="name" name="name" required defaultValue={company?.name} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="domain">Website</label>
        <input id="domain" name="domain" defaultValue={company?.domain} placeholder="example.com" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="industry">Industry</label>
        <input id="industry" name="industry" list="industry-options" defaultValue={company?.industry} className="field" />
        <datalist id="industry-options">
          {INDUSTRY_SUGGESTIONS.map((i) => <option key={i} value={i} />)}
        </datalist>
      </div>
      <div>
        <label className="label" htmlFor="size">Employees</label>
        <select id="size" name="size" defaultValue={company?.size ?? ""} className="field">
          <option value="">—</option>
          {COMPANY_SIZES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" defaultValue={company?.phone} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="city">City</label>
        <input id="city" name="city" defaultValue={company?.city} placeholder="e.g. Dallas, TX" className="field" />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={company?.notes} className="field" />
      </div>
    </div>
  );
}
