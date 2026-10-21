import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { NavLinks } from "@/components/nav-links";
import { Reminders } from "@/components/reminders";
import { taskCounts } from "@/lib/db";
import { addDays, todayISO } from "@/lib/dates";
import "./globals.css";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mental Forge CRM",
  description: "Deals pipeline for Mental Forge AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const today = todayISO();
  const counts = taskCounts(today, addDays(today, 7));
  const dueCount = counts.overdue + counts.today;
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="flex h-14 items-center gap-8 px-4 sm:px-6">
            <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-sm font-bold text-white">
                MF
              </span>
              <span>Mental Forge <span className="font-normal text-slate-500">CRM</span></span>
            </Link>
            <NavLinks dueCount={dueCount} />
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">{children}</main>
        <Reminders />
      </body>
    </html>
  );
}
