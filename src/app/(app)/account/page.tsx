import { AuthForm } from "@/components/auth-form";
import { MIN_PASSWORD, requireUser } from "@/lib/auth";
import { changeOwnPassword } from "../team/actions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-slate-500">
          {user.name} · {user.email} · <span className="capitalize">{user.role}</span>
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold">Change password</h2>
        <AuthForm action={changeOwnPassword} submitLabel="Change password" resetOnSuccess>
          <div>
            <label className="label" htmlFor="current">Current password</label>
            <input id="current" name="current" type="password" required autoComplete="current-password" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="password">New password</label>
            <input id="password" name="password" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className="field" />
          </div>
        </AuthForm>
      </div>
    </div>
  );
}
