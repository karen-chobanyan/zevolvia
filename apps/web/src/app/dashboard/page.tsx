"use client";

import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  CircleCheckBig,
  DollarSign,
  HandCoins,
  MessageSquareText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/ui/Button";
import Loading from "@/components/loading/Loading";
import StatCard from "@/components/dashboard/StatCard";
import SmartPulse from "@/components/dashboard/SmartPulse";
import { DashboardSummary, getDashboardSummary } from "@/lib/dashboard";

type FocusStatus = "Confirmed" | "Checked In" | "Unconfirmed";

const focusStatusStyles: Record<FocusStatus, string> = {
  Confirmed: "bg-blue-100 text-blue-700",
  "Checked In": "bg-green-100 text-green-700",
  Unconfirmed: "bg-amber-100 text-amber-700",
};

const focusStatusIcons = {
  Confirmed: BadgeCheck,
  "Checked In": CircleCheckBig,
  Unconfirmed: AlertCircle,
};

const focusItems = [
  {
    time: "10:00 AM",
    title: "Balayage + gloss",
    note: "Client: Nia Johnson",
    status: "Confirmed" as const,
  },
  {
    time: "1:30 PM",
    title: "Men's cut + beard",
    note: "Client: Andre Lewis",
    status: "Checked In" as const,
  },
  {
    time: "4:00 PM",
    title: "Blowout + treatment",
    note: "Client: Sofia Patel",
    status: "Unconfirmed" as const,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const dashboardSummary = await getDashboardSummary();
        setSummary(dashboardSummary);
      } catch {
        router.replace("/login?next=/dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-theme-xs sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
              Overview
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track performance, appointments, and AI actions at a glance.
            </p>
          </div>

          <Button className="w-full sm:w-auto" variant="outline">
            Open report
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <SmartPulse />

            <section className="grid gap-4 sm:grid-cols-2">
              <StatCard
                title="Revenue"
                value="$1,250"
                subtitle="Projected daily total"
                icon={<DollarSign className="h-6 w-6" />}
              />
              <StatCard
                title="Recovered"
                value="$450"
                subtitle="Saved opportunities"
                icon={<HandCoins className="h-6 w-6" />}
              />
              <StatCard
                title="Follow-ups"
                value={String(summary?.widgets.chatMessages ?? 0)}
                subtitle="AI drafts ready"
                icon={<MessageSquareText className="h-6 w-6" />}
              />
              <StatCard
                title="Bookings"
                value={String(summary?.widgets.chatSessions ?? 0)}
                subtitle="Upcoming this week"
                icon={<CalendarDays className="h-6 w-6" />}
              />
            </section>
          </div>

          <div className="space-y-6 xl:col-span-4">
            <section className="rounded-2xl border border-gray-200/80 bg-white/95 p-5 shadow-theme-xs sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-gray-900">Today Focus</h2>
                <button className="inline-flex items-center gap-1 text-xs font-medium text-brand-500 transition-colors hover:text-brand-600 sm:text-sm">
                  Full calendar
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {focusItems.map((item) => {
                  const StatusIcon = focusStatusIcons[item.status];

                  return (
                    <article
                      key={`${item.time}-${item.title}`}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition-colors duration-300 hover:border-gray-200 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.note}</p>
                        </div>
                        <p className="text-xs font-medium text-gray-500">{item.time}</p>
                      </div>

                      <span
                        className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${focusStatusStyles[item.status]}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {item.status}
                      </span>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200/80 bg-white/95 p-5 shadow-theme-xs sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">AI Quick Wins</h2>
              <p className="mt-1 text-sm text-gray-500">Automated suggestions ready to review.</p>

              <div className="mt-5 space-y-3">
                {[
                  { title: "Follow-up campaign", detail: "Drafted SMS for lapsed clients" },
                  { title: "Team recap", detail: "Daily summary and notes" },
                  { title: "Inventory alert", detail: "Color toner running low" },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="rounded-xl border border-gray-100 p-4 transition-all duration-300 hover:border-brand-100 hover:bg-brand-50/30"
                  >
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.detail}</p>
                  </article>
                ))}
              </div>

              <Button className="mt-6 w-full" variant="outline">
                Review suggestions
              </Button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
