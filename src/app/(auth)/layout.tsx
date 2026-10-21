import Image from "next/image";
import banner from "@/assets/mf-banner.webp";
import logo from "@/assets/mf-logo.jpg";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen items-center px-4 py-8 sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12">
        <Image
          src={banner}
          alt="Mental Forge Media · www.mentalforge.ai"
          priority
          sizes="(min-width: 1024px) 680px, 100vw"
          className="h-auto w-full rounded-2xl border border-slate-200 shadow-sm"
        />
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-5 flex items-center justify-center gap-3 text-lg font-semibold">
            <Image src={logo} alt="" width={48} height={48} priority className="h-12 w-12 rounded-full bg-white object-contain" />
            <span>
              Mental Forge <span className="font-normal text-slate-500">CRM</span>
            </span>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
