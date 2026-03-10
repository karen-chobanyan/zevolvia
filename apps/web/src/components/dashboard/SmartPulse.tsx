import type { ComponentType } from "react";
import { CheckCircle2, Clock3, MessageSquareText, Sparkles, UserRound } from "lucide-react";

type InquiryStatus = "Ready" | "Needs Help";

interface ActiveInquiry {
  id: number;
  name: string;
  topic: string;
  lastActivity: string;
  status: InquiryStatus;
}

const activeInquiries: ActiveInquiry[] = [
  {
    id: 1,
    name: "Elisa Parker",
    topic: "Follow-up for treatment package",
    lastActivity: "2m ago",
    status: "Ready",
  },
  {
    id: 2,
    name: "New Lead",
    topic: "Price question for first visit",
    lastActivity: "7m ago",
    status: "Needs Help",
  },
  {
    id: 3,
    name: "Marcus Lee",
    topic: "Reschedule request",
    lastActivity: "12m ago",
    status: "Ready",
  },
];

const statusClasses: Record<InquiryStatus, string> = {
  Ready: "bg-emerald-100 text-emerald-700",
  "Needs Help": "bg-rose-100 text-rose-700",
};

const statusIcons: Record<InquiryStatus, ComponentType<{ className?: string }>> = {
  Ready: CheckCircle2,
  "Needs Help": Clock3,
};

export default function SmartPulse() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 p-5 shadow-theme-xs">
      <div className="pointer-events-none absolute -top-24 right-0 h-44 w-44 rounded-full bg-brand-100/70 blur-3xl" />

      <div className="relative mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
            Zevolvia AI
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">Smart Pulse</h2>
          <p className="mt-1 text-sm text-gray-500">Active inquiries that need attention now</p>
        </div>

        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <div className="relative mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
        <MessageSquareText className="h-4 w-4 text-gray-500" />
        Active Inquiries
      </div>

      <ul className="relative space-y-3">
        {activeInquiries.map((inquiry) => {
          const StatusIcon = statusIcons[inquiry.status];

          return (
            <li
              key={inquiry.id}
              className="rounded-xl border border-gray-200/90 bg-white/80 p-4 transition-all duration-300 hover:border-brand-200 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-900">{inquiry.name}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{inquiry.topic}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    Last activity: {inquiry.lastActivity}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[inquiry.status]}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {inquiry.status}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-600"
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors duration-300 hover:bg-gray-50"
                >
                  Suggest Time
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
