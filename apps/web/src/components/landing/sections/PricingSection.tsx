"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, HelpCircle } from "lucide-react";
import { Container } from "../Container";
import { PricingCard } from "../elements/PricingCard";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface PricingTier {
  name: string;
  price: number;
  yearlyPrice: number;
  priceSuffix: string;
  locationRange: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

interface PricingSectionProps {
  tiers: PricingTier[];
}

export function PricingSection({ tiers }: PricingSectionProps) {
  const { ref, isInView } = useScrollAnimation();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");

  return (
    <section id="pricing" className="bg-gray-50 py-16 sm:py-20">
      <Container>
        <div ref={ref} className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center rounded-full bg-purple-50 px-4 py-1.5 text-sm font-medium text-purple-700">
              Simple Pricing
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Choose Your Plan
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              All plans include a 14-day free trial. No credit card required. Cancel anytime.
            </p>
          </motion.div>
        </div>

        {/* Billing Toggle */}
        <div className="mt-10 flex justify-center">
          <div className="flex items-center gap-3 rounded-full bg-gray-100 p-1">
            <button
              onClick={() => setBillingInterval("month")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                billingInterval === "month"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("year")}
              className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-all ${
                billingInterval === "year"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                Save 16%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <PricingCard
              key={tier.name}
              name={tier.name}
              price={billingInterval === "month" ? tier.price : tier.yearlyPrice}
              priceSuffix={billingInterval === "month" ? tier.priceSuffix : "per location/year"}
              locationRange={tier.locationRange}
              description={tier.description}
              features={tier.features}
              cta={tier.cta}
              popular={tier.popular}
              index={index}
              isInView={isInView}
            />
          ))}
        </div>

        {/* All Plans Include */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-16"
        >
          <h3 className="text-center text-lg font-semibold text-gray-900">All Plans Include</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "14-day free trial",
              "Unlimited questions",
              "Setup assistance",
              "99.9% uptime SLA",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center justify-center gap-2 rounded-lg bg-white p-4 shadow-sm"
              >
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Enterprise Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 text-center sm:p-8"
        >
          <div className="flex items-center justify-center gap-2">
            <HelpCircle className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Need more than 50 locations?</h3>
          </div>
          <p className="mt-2 text-gray-600">
            We offer custom enterprise plans with dedicated support, custom integrations, and volume
            discounts.
          </p>
          <a
            href="mailto:enterprise@example.com"
            className="mt-4 inline-flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700"
          >
            Contact our enterprise team →
          </a>
        </motion.div>
      </Container>
    </section>
  );
}
