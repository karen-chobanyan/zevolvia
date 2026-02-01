"use client";

import api from "@/lib/axios";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const DISMISS_STORAGE_KEY = "trial-banner-dismissed";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

type TrialInfo = {
  trialEnd: string | null;
  status: string;
};

function getTrialDaysRemaining(trialEnd: string | null): number | null {
  if (!trialEnd) return null;
  const end = new Date(trialEnd);
  if (Number.isNaN(end.getTime())) return null;
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days > 0 ? days : null;
}

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const dismissed = localStorage.getItem(DISMISS_STORAGE_KEY);
  if (!dismissed) return false;
  const dismissedAt = parseInt(dismissed, 10);
  if (Number.isNaN(dismissedAt)) return false;
  return Date.now() - dismissedAt < DISMISS_DURATION_MS;
}

function setDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
}

export default function TrialBanner() {
  const pathname = usePathname();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Don't show on billing page (redundant)
  const isBillingPage = pathname === "/dashboard/billing";

  useEffect(() => {
    // Check if already dismissed
    if (isDismissed() || isBillingPage) {
      setLoading(false);
      return;
    }

    const fetchTrialStatus = async () => {
      try {
        const response = await api.get("/billing/status");
        const subscription = response.data?.subscription;
        if (subscription) {
          setTrialInfo({
            trialEnd: subscription.trialEnd,
            status: subscription.status,
          });
          // Only show if trial is active
          if (subscription.trialEnd && subscription.status === "TRIALING") {
            setVisible(true);
          }
        }
      } catch {
        // Silently fail - banner is not critical
      } finally {
        setLoading(false);
      }
    };

    fetchTrialStatus();
  }, [isBillingPage]);

  const handleDismiss = () => {
    setDismissed();
    setVisible(false);
  };

  const daysRemaining = getTrialDaysRemaining(trialInfo?.trialEnd ?? null);

  // Don't render if loading, dismissed, on billing page, or no trial info
  if (loading || !visible || isBillingPage || !daysRemaining) {
    return null;
  }

  // Determine urgency styling
  const isUrgent = daysRemaining <= 3;
  const bannerBg = isUrgent
    ? "bg-gradient-to-r from-warning-500 to-error-500"
    : "bg-gradient-to-r from-brand-500 to-brand-600";

  return (
    <div
      className={`relative flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium text-white ${bannerBg}`}
    >
      <span>
        {isUrgent ? "⚠️ " : "🎉 "}
        Your trial ends in{" "}
        <strong>
          {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
        </strong>
        {isUrgent ? " — don't lose access!" : ""}
      </span>
      <Link
        href="/dashboard/billing"
        className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${
          isUrgent
            ? "bg-white text-error-600 hover:bg-gray-100"
            : "bg-white/20 text-white hover:bg-white/30"
        }`}
      >
        Upgrade Now
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
        aria-label="Dismiss trial banner"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
