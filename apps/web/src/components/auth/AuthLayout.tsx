import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <Link href="/" className="inline-flex items-center gap-3 text-gray-900">
              <Image
                src="/images/logo/logo-bold.svg"
                alt="SalonIQ logo"
                width={120}
                height={28}
                priority
              />
            </Link>
            <div className="mt-8">{children}</div>
          </div>
        </div>
        <div className="relative hidden overflow-hidden bg-gray-950 text-white lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-gray-950 to-orange-900/40" />
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-orange-500/20 blur-[140px]" />
          <div className="relative z-10 m-auto max-w-md px-10 text-center">
            <h2 className="text-3xl font-semibold">Run a smarter salon</h2>
            <p className="mt-4 text-gray-300">
              Automate bookings, keep staff aligned, and turn every client into a regular with
              AI-powered workflows.
            </p>
            <div className="mt-8 grid gap-4 text-left text-sm text-gray-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">Unified operations</p>
                <p className="mt-1">Calendar, team tasks, and client profiles in one place.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-medium text-white">AI assistant</p>
                <p className="mt-1">Generate follow-ups, promos, and staff notes instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
