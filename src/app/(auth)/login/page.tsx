import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { countUsers } from "@/lib/db";
import { login } from "../actions";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  if ((await countUsers()) === 0) redirect("/setup");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="mb-4 text-lg font-semibold">Sign in</h1>
      <AuthForm action={login} submitLabel="Sign in">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" autoFocus className="field" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
        </div>
      </AuthForm>
      <p className="mt-4 text-xs text-slate-500">Forgot your password? Ask your CRM admin to reset it.</p>
    </div>
  );
}
