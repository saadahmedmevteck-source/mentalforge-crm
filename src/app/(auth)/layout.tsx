export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-sm font-bold text-white">MF</span>
          Mental Forge <span className="font-normal text-slate-500">CRM</span>
        </div>
        {children}
      </div>
    </main>
  );
}
