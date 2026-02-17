"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/utils";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { pricingContent } from "@/content/landing";
import { PricingCard } from "../elements/PricingCard";

export function PricingSection() {
  const { ref, isInView } = useScrollAnimation();
  const [isAnnual, setIsAnnual] = useState(false);

  const { plan, included } = pricingContent;

  const currentPrice = isAnnual
    ? Math.round(plan.monthlyPrice * (1 - plan.annualDiscount))
    : plan.monthlyPrice;

  const currentSeatPrice = isAnnual
    ? Math.round(plan.seatPrice * (1 - plan.annualDiscount))
    : plan.seatPrice;

  return (
    <section id="pricing" className="scroll-mt-24 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div ref={ref} className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
              Pricing
            </span>
            <h2 className="mt-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
              {pricingContent.heading}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              {pricingContent.subheading}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-10 flex justify-center"
        >
          <div className="inline-flex items-center rounded-full bg-gray-100 p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={cn(
                "rounded-full px-6 py-2.5 text-sm font-medium transition-all",
                !isAnnual
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={cn(
                "flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all",
                isAnnual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
              )}
            >
              Annual
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="mx-auto mt-12 max-w-xl">
          <PricingCard
            name={plan.name}
            description={plan.description}
            price={currentPrice}
            originalPrice={isAnnual ? plan.monthlyPrice : undefined}
            seatPrice={currentSeatPrice}
            features={plan.features}
            cta={plan.cta}
            isAnnual={isAnnual}
            isInView={isInView}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16"
        >
          <h3 className="text-center text-base font-semibold text-gray-900">Every plan includes</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {included.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5"
              >
                <Check className="h-4 w-4 flex-shrink-0 text-brand-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
