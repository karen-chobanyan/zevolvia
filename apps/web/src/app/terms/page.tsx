import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          Back to home
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mt-4 text-gray-600">
          Zevolvia provides booking automation and communication tools for salons on a subscription
          basis. Service availability and features may vary by plan.
        </p>
        <p className="mt-4 text-gray-600">
          You are responsible for maintaining accurate salon information, staffing details, and
          client communication settings.
        </p>
        <p className="mt-4 text-gray-600">For contract questions, contact hello@zevolvia.com.</p>
      </div>
    </main>
  );
}
