import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm text-brand-600">
          SalonIQ - AI SaaS for beauty salons
        </span>
        <h1 className="mt-6 text-4xl font-semibold text-gray-900 sm:text-5xl">
          Delight clients, streamline teams, and grow revenue with AI.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-gray-600">
          Bring bookings, client insights, and automated follow-ups into one place. SalonIQ keeps
          every stylist aligned and every appointment running smoothly.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-600"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
