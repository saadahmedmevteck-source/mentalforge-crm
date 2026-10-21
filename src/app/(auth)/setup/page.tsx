import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { MIN_PASSWORD } from "@/lib/auth";
import { countUsers } from "@/lib/db";
import { setupAdmin } from "../actions";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if ((await countUsers()) > 0) redirect("/login");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-lg font-semibold">Create the admin account</h1>
      <p className="mb-4 text-sm text-slate-500">This is the first account. You can add your team after signing in.</p>
      <AuthForm action={setupAdmin} submitLabel="Create admin & sign in">
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" name="name" required autoComplete="name" autoFocus className="field" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className="field" />
          <p className="mt-1 text-xs text-slate-500">At least {MIN_PASSWORD} characters.</p>
        </div>
      </AuthForm>
    </div>
  );
}
