"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/ui/Button";
import Loading from "@/components/loading/Loading";
import StatCard from "@/components/dashboard/StatCard";
import { ChatIcon, DocsIcon, GroupIcon } from "@/icons";
import { getMe, logout } from "@/lib/auth";
import { DashboardSummary, getDashboardSummary } from "@/lib/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [me, dashboardSummary] = await Promise.all([getMe(), getDashboardSummary()]);
        setUserEmail(me.email);
        setSummary(dashboardSummary);
      } catch {
        router.replace("/login?next=/dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Welcome back</p>
            <h1 className="text-3xl font-semibold text-gray-900">Zevolvia Dashboard</h1>
            {userEmail && <p className="mt-1 text-sm text-gray-500">{userEmail}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleLogout}>
              Log out
            </Button>
            <Button>New booking</Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard
            title="Active team members"
            value={String(summary?.widgets.members ?? 0)}
            subtitle="Currently active"
            icon={<GroupIcon className="h-6 w-6" />}
          />
          <StatCard
            title="Knowledge files"
            value={String(summary?.widgets.files ?? 0)}
            subtitle="Uploaded this month"
            icon={<DocsIcon className="h-6 w-6" />}
          />
          <StatCard
            title="Client follow-ups"
            value={String(summary?.widgets.chatMessages ?? 0)}
            subtitle="AI drafts ready"
            icon={<ChatIcon className="h-6 w-6" />}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Today's focus</h2>
              <button className="text-sm text-brand-500">View full calendar</button>
            </div>
            <div className="mt-4 space-y-4">
              {[
                {
                  time: "10:00 AM",
                  title: "Balayage + gloss",
                  note: "Client: Nia Johnson",
                },
                {
                  time: "1:30 PM",
                  title: "Men's cut + beard",
                  note: "Client: Andre Lewis",
                },
                {
                  time: "4:00 PM",
                  title: "Blowout + treatment",
                  note: "Client: Sofia Patel",
                },
              ].map((item) => (
                <div
                  key={item.time}
                  className="flex items-start justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.note}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-500">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs">
            <h2 className="text-lg font-semibold text-gray-900">AI quick wins</h2>
            <p className="mt-1 text-sm text-gray-500">Automated suggestions ready to review.</p>
            <div className="mt-5 space-y-4">
              {[
                {
                  title: "Follow-up campaign",
                  detail: "Drafted SMS for lapsed clients",
                },
                {
                  title: "Team recap",
                  detail: "Daily summary and notes",
                },
                {
                  title: "Inventory alert",
                  detail: "Color toner running low",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.detail}</p>
                </div>
              ))}
            </div>
            <Button className="mt-6 w-full" variant="outline">
              Review suggestions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
