import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          Back to home
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-4 text-gray-600">
          Zevolvia processes booking and contact data to provide scheduling, messaging, reminders,
          and analytics for salon operations.
        </p>
        <p className="mt-4 text-gray-600">
          We only process data required to deliver the service, and we apply tenant-level isolation
          for customer organizations.
        </p>
        <p className="mt-4 text-gray-600">For privacy requests, contact hello@zevolvia.com.</p>
      </div>
    </main>
  );
}
