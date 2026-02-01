"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Notification from "@/ui/notification/Notification";
import api from "@/lib/axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type SubscriptionStatus = {
  status: string;
  priceId?: string | null;
  quantity: number;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  trialStart?: string | null;
  trialEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  plan?: string | null;
};

type BillingStatus = {
  orgId: string;
  seatCount: number;
  subscription: SubscriptionStatus | null;
};

type PlanKey = "monthly" | "yearly";

const PLAN_LABELS: Record<PlanKey, { price: string; badge?: string }> = {
  monthly: { price: "$79 per location / month" },
  yearly: { price: "$799 per location / year", badge: "Save 16%" },
};

const STATUS_LABELS: Record<string, string> = {
  TRIALING: "Trialing",
  ACTIVE: "Active",
  TRIAL_EXPIRED: "Trial expired",
  CANCELED: "Canceled",
  INCOMPLETE: "Incomplete",
  PAST_DUE: "Past due",
};

function formatDate(value?: string | null, fallback = "N/A") {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTrialDaysRemaining(trialEnd?: string | null): number | null {
  if (!trialEnd) return null;
  const end = new Date(trialEnd);
  if (Number.isNaN(end.getTime())) return null;
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days > 0 ? days : null;
}

function formatPlanLabel(plan?: string | null) {
  if (!plan) return "Custom plan";
  const key = plan as PlanKey;
  if (!PLAN_LABELS[key]) return "Custom plan";
  const label = key === "monthly" ? "Monthly" : "Yearly";
  return `${label} · ${PLAN_LABELS[key].price}`;
}

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
  );
}

export default function BillingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanKey | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const checkoutSyncRef = useRef(false);
  const [paymentNotification, setPaymentNotification] = useState<{
    type: "success" | "info";
    message: string;
  } | null>(null);

  // Handle success/canceled URL params from Stripe redirect
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "1") {
      setPaymentNotification({
        type: "success",
        message: "Payment successful! Your subscription is now active.",
      });
      // Clean URL without refreshing page
      router.replace("/dashboard/billing", { scroll: false });
    } else if (canceled === "1") {
      setPaymentNotification({
        type: "info",
        message: "Checkout was canceled. You can try again anytime.",
      });
      router.replace("/dashboard/billing", { scroll: false });
    }
  }, [searchParams, router]);

  const subscriptionActive = useMemo(() => {
    if (!status?.subscription) return false;
    return ["ACTIVE", "PAST_DUE"].includes(status.subscription.status);
  }, [status]);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/billing/status");
      setStatus(response.data);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load billing status."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || checkoutSyncRef.current) {
      return;
    }
    checkoutSyncRef.current = true;
    (async () => {
      try {
        await api.post("/billing/checkout/complete", { sessionId });
      } catch (err: any) {
        setError(getErrorMessage(err, "Failed to confirm checkout."));
      } finally {
        loadStatus();
      }
    })();

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const startCheckout = async (plan: PlanKey) => {
    setCheckoutPlan(plan);
    setError(null);
    try {
      const response = await api.post("/billing/checkout", { plan });
      const url = response.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Stripe checkout URL was not returned.");
      }
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to start checkout."));
    } finally {
      setCheckoutPlan(null);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const response = await api.post("/billing/portal");
      const url = response.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Stripe portal URL was not returned.");
      }
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to open billing portal."));
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Billing" />

      {/* Payment notification from Stripe redirect */}
      {paymentNotification && (
        <div className="flex justify-center">
          <Notification
            variant={paymentNotification.type}
            title={paymentNotification.type === "success" ? "🎉 Success!" : "Checkout Canceled"}
            description={paymentNotification.message}
            hideDuration={8000}
          />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-2 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Subscription status
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You're billed per active location. Trial includes unlimited users.
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Loading billing details...
            </p>
          ) : status?.subscription ? (
            <div className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <span className="font-medium">Plan:</span>{" "}
                {formatPlanLabel(status.subscription.plan)}
              </div>
              <div>
                <span className="font-medium">Status:</span>{" "}
                {STATUS_LABELS[status.subscription.status] ?? status.subscription.status}
                {status.subscription.status === "TRIALING" &&
                  (() => {
                    const days = getTrialDaysRemaining(status.subscription.trialEnd);
                    return days ? (
                      <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                        {days} day{days !== 1 ? "s" : ""} left
                      </span>
                    ) : null;
                  })()}
              </div>
              <div>
                <span className="font-medium">Billed seats:</span> {status.subscription.quantity}
              </div>
              {status.subscription.status === "TRIALING" ? (
                <div>
                  <span className="font-medium">Trial ends:</span>{" "}
                  {formatDate(status.subscription.trialEnd)}
                </div>
              ) : (
                <div>
                  <span className="font-medium">Next billing date:</span>{" "}
                  {formatDate(status.subscription.currentPeriodEnd, "—")}
                </div>
              )}
              {status.subscription.cancelAtPeriodEnd && (
                <div className="text-warning-600 dark:text-warning-400">Cancels at period end</div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No active subscription yet.
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
              Active locations: <span className="font-semibold">{status?.seatCount ?? "-"}</span>
            </div>
            {subscriptionActive && (
              <button
                type="button"
                onClick={openPortal}
                disabled={portalLoading}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-theme-xs transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:text-gray-200"
              >
                {portalLoading ? "Opening..." : "Manage subscription"}
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Start a plan</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select a billing cycle that works for your business.
          </p>

          <div className="mt-4 space-y-3">
            {(Object.keys(PLAN_LABELS) as PlanKey[]).map((plan) => (
              <div
                key={plan}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {plan === "monthly" ? "Monthly" : "Yearly"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {PLAN_LABELS[plan].price}
                    </div>
                  </div>
                  {PLAN_LABELS[plan].badge && (
                    <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-semibold text-success-700 dark:bg-success-500/20 dark:text-success-300">
                      {PLAN_LABELS[plan].badge}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => startCheckout(plan)}
                  disabled={checkoutPlan === plan || subscriptionActive}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {subscriptionActive
                    ? "Current Plan"
                    : checkoutPlan === plan
                      ? "Starting..."
                      : "Subscribe"}
                </button>
              </div>
            ))}
          </div>
          {subscriptionActive && (
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              To change plans, use “Manage subscription”.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
