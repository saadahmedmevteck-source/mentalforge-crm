import { AuthForm } from "@/components/auth-form";
import { MIN_PASSWORD, requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/constants";
import { listUsers } from "@/lib/db";
import { addUser, resetPassword, setUserActive, setUserRole } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const me = await requireAdmin();
  const users = await listUsers();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="text-sm text-slate-500">Everyone here can sign in and work in the CRM. Admins can also manage the team.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reset password</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const self = u.id === me.id;
                return (
                  <tr key={u.id} className={u.active ? "" : "bg-slate-50 text-slate-400"}>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{u.name}{self && <span className="ml-1 text-xs font-normal text-slate-400">(you)</span>}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                      <div className="text-xs text-slate-400">Added {formatDateTime(u.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <form action={setUserRole.bind(null, u.id, u.role === "admin" ? "member" : "admin")}>
                        <span className="mr-2 font-medium capitalize">{u.role}</span>
                        {!self && (
                          <button type="submit" className="cursor-pointer text-xs text-brand-600 hover:underline">
                            {u.role === "admin" ? "Make member" : "Make admin"}
                          </button>
                        )}
                      </form>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <form action={setUserActive.bind(null, u.id, !u.active)}>
                        <span className={`mr-2 ${u.active ? "text-emerald-600" : ""}`}>{u.active ? "Active" : "Deactivated"}</span>
                        {!self && (
                          <button type="submit" className="cursor-pointer text-xs text-brand-600 hover:underline">
                            {u.active ? "Deactivate" : "Reactivate"}
                          </button>
                        )}
                      </form>
                    </td>
                    <td className="w-56 px-4 py-3 align-top">
                      {u.active && !self ? (
                        <AuthForm action={resetPassword.bind(null, u.id)} submitLabel="Reset" resetOnSuccess>
                          <input name="password" type="password" required minLength={MIN_PASSWORD} placeholder="New password" aria-label={`New password for ${u.name}`} autoComplete="new-password" className="field" />
                        </AuthForm>
                      ) : (
                        <span className="text-xs text-slate-400">{self ? "Use Account to change yours" : "—"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Add a team member</h2>
          <AuthForm action={addUser} submitLabel="Add member" resetOnSuccess>
            <div>
              <label className="label" htmlFor="name">Name</label>
              <input id="name" name="name" required className="field" />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoComplete="off" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="password">Temporary password</label>
              <input id="password" name="password" type="password" required minLength={MIN_PASSWORD} autoComplete="new-password" className="field" />
              <p className="mt-1 text-xs text-slate-500">They can change it from Account after signing in.</p>
            </div>
            <div>
              <label className="label" htmlFor="role">Role</label>
              <select id="role" name="role" defaultValue="member" className="field">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </AuthForm>
        </div>
      </div>
    </div>
  );
}
