"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DUE_COUNT_EVENT } from "./reminders";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/deals", label: "Deals" },
  { href: "/contacts", label: "Contacts" },
  { href: "/companies", label: "Companies" },
  { href: "/tasks", label: "Tasks" },
];

export function NavLinks({ dueCount }: { dueCount: number }) {
  const pathname = usePathname();
  const [due, setDue] = useState(dueCount);

  useEffect(() => setDue(dueCount), [dueCount]);
  useEffect(() => {
    const onCount = (e: Event) => setDue((e as CustomEvent<number>).detail);
    window.addEventListener(DUE_COUNT_EVENT, onCount);
    return () => window.removeEventListener(DUE_COUNT_EVENT, onCount);
  }, []);

  return (
    <nav className="flex gap-1 overflow-x-auto text-sm">
      {LINKS.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 font-medium ${
              active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {l.label}
            {l.href === "/tasks" && due > 0 && (
              <span
                className="rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold leading-4 text-white"
                title={`${due} overdue or due today`}
              >
                {due}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
