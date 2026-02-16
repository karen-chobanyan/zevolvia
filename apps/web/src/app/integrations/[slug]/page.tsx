import Link from "next/link";
import { notFound } from "next/navigation";

const integrationDocs: Record<
  string,
  {
    name: string;
    category: string;
    status: "live" | "coming_soon";
    summary: string;
  }
> = {
  vagaro: {
    name: "Vagaro",
    category: "Booking Platforms",
    status: "live",
    summary: "Connect Zevolvia to sync bookings and availability with Vagaro in real time.",
  },
  glossgenius: {
    name: "GlossGenius",
    category: "Booking Platforms",
    status: "live",
    summary: "Use your existing GlossGenius workflow while clients book over text.",
  },
  boulevard: {
    name: "Boulevard",
    category: "Booking Platforms",
    status: "live",
    summary: "Sync appointments and keep your Boulevard calendar as your source of truth.",
  },
  fresha: {
    name: "Fresha",
    category: "Booking Platforms",
    status: "live",
    summary: "Capture text bookings and sync appointment details into Fresha.",
  },
  booksy: {
    name: "Booksy",
    category: "Booking Platforms",
    status: "live",
    summary: "Bring Booksy availability into Zevolvia for SMS-native booking.",
  },
  "square-appointments": {
    name: "Square Appointments",
    category: "Booking Platforms",
    status: "live",
    summary: "Keep Square Appointments and add text-first booking flows.",
  },
  mindbody: {
    name: "Mindbody",
    category: "Booking Platforms",
    status: "live",
    summary: "Sync Zevolvia bookings into Mindbody so teams stay aligned.",
  },
  "google-calendar": {
    name: "Google Calendar",
    category: "Calendars",
    status: "live",
    summary: "Two-way calendar sync between Zevolvia and Google Calendar.",
  },
  "apple-calendar": {
    name: "Apple Calendar / iCal",
    category: "Calendars",
    status: "live",
    summary: "Use iCal feeds and Apple Calendar sync for appointment visibility.",
  },
  "outlook-microsoft-365": {
    name: "Outlook / Microsoft 365",
    category: "Calendars",
    status: "live",
    summary: "Sync Zevolvia events with Outlook and Microsoft 365 calendars.",
  },
  calendly: {
    name: "Calendly",
    category: "Calendars",
    status: "live",
    summary: "Route qualified text-booking requests into Calendly flows when needed.",
  },
  stripe: {
    name: "Stripe",
    category: "Payments",
    status: "live",
    summary: "Collect deposits and payment links through Stripe-enabled booking flows.",
  },
  square: {
    name: "Square",
    category: "Payments",
    status: "live",
    summary: "Use Square payments with booking confirmations and reminders.",
  },
  paypal: {
    name: "PayPal",
    category: "Payments",
    status: "coming_soon",
    summary: "PayPal support is planned for an upcoming release.",
  },
  revolut: {
    name: "Revolut",
    category: "Payments",
    status: "coming_soon",
    summary: "Revolut payment support is on the roadmap.",
  },
  "twilio-sms": {
    name: "Twilio SMS",
    category: "Communication",
    status: "live",
    summary: "Power high-deliverability SMS booking conversations with Twilio.",
  },
  whatsapp: {
    name: "WhatsApp",
    category: "Communication",
    status: "coming_soon",
    summary: "WhatsApp messaging support is in active planning.",
  },
  "email-notifications": {
    name: "Email notifications",
    category: "Communication",
    status: "live",
    summary: "Send booking alerts and updates by email to staff and clients.",
  },
};

type IntegrationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function IntegrationPage({ params }: IntegrationPageProps) {
  const { slug } = await params;
  const integration = integrationDocs[slug];

  if (!integration) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link
          href="/#integrations"
          className="text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          Back to integrations
        </Link>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {integration.category}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">{integration.name}</h1>
          <p className="mt-3 text-gray-600">{integration.summary}</p>
          <p className="mt-6 inline-flex rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
            {integration.status === "live" ? "Available" : "Coming soon"}
          </p>

          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">Setup</h2>
            <p className="mt-2 text-sm text-gray-600">
              Full setup docs are being finalized. For now, start your trial and our onboarding flow
              will guide the connection steps.
            </p>
            <Link
              href="/signup?source=integration_doc"
              className="mt-4 inline-flex items-center rounded-lg bg-success-600 px-4 py-2 text-sm font-semibold text-white hover:bg-success-700"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
