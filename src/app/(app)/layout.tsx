import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/mf-logo.jpg";
import { NavLinks } from "@/components/nav-links";
import { Reminders } from "@/components/reminders";
import { requireUser } from "@/lib/auth";
import { taskCounts } from "@/lib/db";
import { addDays, todayISO } from "@/lib/dates";
import { logout } from "../(auth)/actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const today = todayISO();
  const counts = await taskCounts(today, addDays(today, 7));

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
            <Image src={logo} alt="" width={36} height={36} priority className="h-9 w-9 rounded-full bg-white object-contain" />
            <span className="hidden sm:inline">Mental Forge <span className="font-normal text-slate-500">CRM</span></span>
          </Link>
          <NavLinks dueCount={counts.overdue + counts.today} isAdmin={user.role === "admin"} />
          <div className="ml-auto flex shrink-0 items-center gap-1 text-sm">
            <Link href="/account" className="rounded-md px-2 py-1.5 text-slate-600 hover:bg-slate-100" title={user.email}>
              {user.name}
            </Link>
            <form action={logout}>
              <button type="submit" className="cursor-pointer rounded-md px-2 py-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="px-4 py-6 sm:px-6">{children}</main>
      <Reminders />
    </>
  );
}
