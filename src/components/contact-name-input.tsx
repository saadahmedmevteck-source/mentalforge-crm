"use client";

import type { ContactOption } from "@/lib/constants";

/**
 * Contact name field with suggestions. Picking a known contact fills in their email, phone
 * and company in the same form, where those fields are still blank.
 */
export function ContactNameInput({
  id,
  name,
  contacts,
  fill,
  defaultValue,
  required,
}: {
  id: string;
  name: string;
  contacts: ContactOption[];
  fill: { email: string; phone: string; company: string };
  defaultValue?: string;
  required?: boolean;
}) {
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const typed = e.currentTarget.value.trim().toLowerCase();
    const match = contacts.find((c) => c.name.toLowerCase() === typed);
    const form = e.currentTarget.form;
    if (!match || !form) return;
    const set = (field: string, value: string) => {
      const input = form.elements.namedItem(field) as HTMLInputElement | null;
      if (input && !input.value && value) input.value = value;
    };
    set(fill.email, match.email);
    set(fill.phone, match.phone);
    set(fill.company, match.company_name);
  }

  return (
    <>
      <input
        id={id}
        name={name}
        list={`${id}-options`}
        autoComplete="off"
        required={required}
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder="Pick or type a new name"
        className="field"
      />
      <datalist id={`${id}-options`}>
        {contacts.map((c, i) => (
          <option key={i} value={c.name}>{c.company_name}</option>
        ))}
      </datalist>
    </>
  );
}
