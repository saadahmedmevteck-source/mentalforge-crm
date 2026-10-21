import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { contactOptions, getWorkshop, listRegistrations } from "@/lib/db";
import { WORKSHOP_FORMATS, WORKSHOP_STATUSES, formatMoney } from "@/lib/constants";
import { AuthForm } from "@/components/auth-form";
import { ContactNameInput } from "@/components/contact-name-input";
import { DeleteButton } from "@/components/delete-button";
import { SeatMeter, workshopWhen } from "@/components/workshop-bits";
import {
  addAttendee,
  createFollowUps,
  deleteWorkshop,
  removeRegistration,
  setRegistrationStatus,
  togglePaid,
  updateWorkshop,
} from "../actions";
import { CopyEmails, RegistrationStatusSelect } from "../attendee-controls";
import { WorkshopFields } from "../workshop-form";

export const dynamic = "force-dynamic";

export default async function WorkshopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const workshop = await getWorkshop(Number(id));
  if (!workshop) notFound();
  const [registrations, contacts] = await Promise.all([listRegistrations(workshop.id), contactOptions()]);
  const coming = registrations.filter((r) => r.status === "registered" || r.status === "attended");
  const full = workshop.capacity > 0 && workshop.seats_taken >= workshop.capacity;
  const format = WORKSHOP_FORMATS.find((f) => f.id === workshop.format)?.label;

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/workshops" className="text-sm text-slate-500 hover:text-slate-800">← All workshops</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{workshop.title}</h1>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-slate-200">
              {WORKSHOP_STATUSES.find((s) => s.id === workshop.status)?.label}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {[workshopWhen(workshop), format, workshop.location].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <SeatMeter taken={workshop.seats_taken} capacity={workshop.capacity} />
          <div>
            <div className="text-xs text-slate-500">Collected</div>
            <div className="font-semibold tabular-nums">{formatMoney(workshop.revenue)}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">
                Attendees ({registrations.length}){workshop.waitlist_count > 0 && ` · ${workshop.waitlist_count} on waitlist`}
              </h2>
              <CopyEmails emails={coming.map((r) => r.contact_email).filter(Boolean)} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <tbody className="divide-y divide-slate-100">
                  {registrations.map((r) => (
                    <tr key={r.id} className={r.status === "cancelled" ? "text-slate-400" : ""}>
                      <td className="py-2.5 pr-3">
                        <Link href={`/contacts/${r.contact_id}`} className="font-medium hover:text-brand-600">{r.contact_name}</Link>
                        <div className="text-xs text-slate-500">
                          {[r.company_name, r.contact_email, r.contact_phone].filter(Boolean).join(" · ") || "No contact details"}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <RegistrationStatusSelect action={setRegistrationStatus.bind(null, r.id)} value={r.status} name={r.contact_name} />
                      </td>
                      <td className="py-2.5 pr-3">
                        {workshop.price > 0 && (
                          <form action={togglePaid.bind(null, r.id)}>
                            <button
                              type="submit"
                              className={`cursor-pointer rounded-md px-2 py-1 text-xs font-medium ${
                                r.amount_paid > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {r.amount_paid > 0 ? `Paid ${formatMoney(r.amount_paid)}` : "Mark paid"}
                            </button>
                          </form>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <form action={removeRegistration.bind(null, r.id)}>
                          <button type="submit" aria-label={`Remove ${r.contact_name}`} title="Remove from workshop" className="cursor-pointer rounded px-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                            ×
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {registrations.length === 0 && (
                    <tr><td className="py-6 text-center text-slate-400">No one registered yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold">Add attendee</h2>
              <p className="mb-3 text-xs text-slate-500">
                {full ? "Workshop is full: new people go on the waitlist." : "New names are saved as contacts."}
              </p>
              <AuthForm action={addAttendee.bind(null, workshop.id)} submitLabel={full ? "Add to waitlist" : "Register"} resetOnSuccess>
                <div>
                  <label className="label" htmlFor="name">Name *</label>
                  <ContactNameInput id="name" name="name" required contacts={contacts} fill={{ email: "email", phone: "phone", company: "company_name" }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label" htmlFor="email">Email</label>
                    <input id="email" name="email" type="email" className="field" />
                  </div>
                  <div>
                    <label className="label" htmlFor="phone">Phone</label>
                    <input id="phone" name="phone" type="tel" className="field" />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="company_name">Company</label>
                  <input id="company_name" name="company_name" className="field" />
                </div>
                {workshop.price > 0 && (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="paid" className="h-4 w-4 accent-brand-500" />
                    Already paid {formatMoney(workshop.price)}
                  </label>
                )}
              </AuthForm>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold">After the workshop</h2>
              <ol className="mb-3 mt-1 list-decimal space-y-1 pl-4 text-xs text-slate-500">
                <li>Set each person to <b>Attended</b> or <b>No-show</b>.</li>
                <li>Create a follow-up task for everyone who attended. They show up on the dashboard tomorrow.</li>
              </ol>
              <AuthForm action={createFollowUps.bind(null, workshop.id)} submitLabel={`Create follow-ups (${workshop.attended_count} attended)`}>
                {null}
              </AuthForm>
            </div>
          </section>
        </div>

        <aside>
          <form action={updateWorkshop.bind(null, workshop.id)} className="space-y-6 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold">Workshop details</h2>
            <WorkshopFields workshop={workshop} />
            <div className="flex justify-between gap-2">
              <DeleteButton
                action={deleteWorkshop.bind(null, workshop.id)}
                label="Delete"
                confirmText="Delete this workshop and its attendee list? The contacts themselves are kept."
              />
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
