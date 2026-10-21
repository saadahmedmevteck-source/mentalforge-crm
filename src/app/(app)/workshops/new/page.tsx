import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createWorkshop } from "../actions";
import { WorkshopFields } from "../workshop-form";

export default async function NewWorkshopPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/workshops" className="text-sm text-slate-500 hover:text-slate-800">← Back</Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">New workshop</h1>
      <form action={createWorkshop} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <WorkshopFields workshop={{ title: "Fusion Foundations", program: "Fusion Foundations", capacity: 20 }} />
        <div className="flex justify-end gap-2">
          <Link href="/workshops" className="btn-ghost">Cancel</Link>
          <button type="submit" className="btn-primary">Create workshop</button>
        </div>
      </form>
    </div>
  );
}
