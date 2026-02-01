"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils";

interface PricingCardProps {
  name: string;
  price: number;
  priceSuffix: string;
  locationRange: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  index?: number;
  isInView?: boolean;
}

export function PricingCard({
  name,
  price,
  priceSuffix,
  locationRange,
  description,
  features,
  cta,
  popular = false,
  index = 0,
  isInView = true,
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className={cn(
        "relative rounded-2xl border bg-white p-6 sm:p-8 transition-shadow",
        popular
          ? "border-purple-500 shadow-xl ring-2 ring-purple-500"
          : "border-gray-200 shadow-sm hover:shadow-md",
      )}
    >
      {/* Popular Badge */}
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
            Most Popular
          </span>
        </div>
      )}

      {/* Plan Name & Location Range */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
        <p className="mt-1 text-sm text-purple-600 font-medium">{locationRange}</p>
      </div>

      {/* Price */}
      <div className="mt-4 flex items-baseline">
        <span className="text-4xl font-bold text-gray-900">${price}</span>
        <span className="ml-1 text-gray-500">{priceSuffix}</span>
      </div>

      {/* Description */}
      <p className="mt-4 text-sm text-gray-600">{description}</p>

      {/* Features List */}
      <ul className="mt-6 space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
                popular ? "bg-purple-100" : "bg-gray-100",
              )}
            >
              <Check className={cn("h-3 w-3", popular ? "text-purple-600" : "text-gray-600")} />
            </div>
            <span className="text-sm text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Link
        href="/auth/signup"
        className={cn(
          "mt-8 block w-full rounded-xl py-3 text-center font-semibold transition-all",
          popular
            ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg hover:shadow-xl"
            : "bg-gray-900 text-white hover:bg-gray-800",
        )}
        onClick={() => {
          // Track analytics event
          if (typeof window !== "undefined" && (window as any).gtag) {
            (window as any).gtag("event", "pricing_cta_click", {
              event_category: "conversion",
              event_label: name.toLowerCase(),
            });
          }
        }}
      >
        {cta}
      </Link>

      {/* Money Back Guarantee */}
      <p className="mt-4 text-center text-xs text-gray-500">30-day money-back guarantee</p>
    </motion.div>
  );
}
