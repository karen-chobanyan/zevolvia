"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

interface PricingCardProps {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  seatPrice: number;
  features: string[];
  cta: string;
  isAnnual: boolean;
  isInView: boolean;
}

export function PricingCard({
  name,
  description,
  price,
  originalPrice,
  seatPrice,
  features,
  cta,
  isAnnual,
  isInView,
}: PricingCardProps) {
  const trackClick = () => {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "pricing_cta_click", {
        event_category: "conversion",
        event_label: isAnnual ? "annual" : "monthly",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-lg shadow-brand-100/40"
    >
      <div className="h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" />

      <div className="p-8 sm:p-10">
        <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
        <p className="mt-1.5 text-sm text-gray-600">{description}</p>

        <div className="mt-8 flex flex-wrap items-baseline gap-x-1 gap-y-2">
          <span className="text-sm font-medium text-gray-500">$</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={price}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2 }}
              className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl"
            >
              {price}
            </motion.span>
          </AnimatePresence>
          <div className="ml-1 flex flex-col">
            <span className="text-sm text-gray-500">/month</span>
            {isAnnual && originalPrice != null && (
              <span className="text-xs text-gray-400 line-through">${originalPrice}/mo</span>
            )}
          </div>
          {isAnnual && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-3 self-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
            >
              Billed annually
            </motion.span>
          )}
        </div>

        <div className="mt-4 inline-flex items-center rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5">
          <span className="text-sm text-gray-600">
            + <span className="font-semibold text-gray-900">${seatPrice}</span>/mo per additional
            staff member
          </span>
        </div>

        <div className="my-8 h-px bg-gray-100" />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-50">
                <Check className="h-3 w-3 text-brand-600" />
              </div>
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        <Link
          href="/signup"
          onClick={trackClick}
          className="mt-8 block w-full rounded-xl bg-brand-600 py-3.5 text-center text-base font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
        >
          {cta}
        </Link>

        <p className="mt-4 text-center text-sm text-gray-500">
          Free for 30 days. No credit card required.
        </p>
      </div>
    </motion.div>
  );
}
