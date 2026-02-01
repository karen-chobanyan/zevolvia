"use client";

import { motion } from "framer-motion";
import { ArrowRight, Shield, Clock, Check } from "lucide-react";
import Link from "next/link";
import { Container } from "../Container";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface FinalCTASectionProps {
  headline: string;
  subheadline: string;
  ctaText: string;
  riskReversal: string;
}

export function FinalCTASection({
  headline,
  subheadline,
  ctaText,
  riskReversal,
}: FinalCTASectionProps) {
  const { ref, isInView } = useScrollAnimation();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#667eea] py-16 sm:py-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <Container>
        <div ref={ref} className="relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {headline}
            </h2>
            <p className="mt-6 text-lg text-white/80 sm:text-xl">{subheadline}</p>

            {/* CTA Button */}
            <div className="mt-10">
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-purple-700 shadow-xl transition-all hover:bg-gray-50 hover:shadow-2xl"
                onClick={() => {
                  // Track analytics event
                  if (typeof window !== "undefined" && (window as any).gtag) {
                    (window as any).gtag("event", "final_cta_click", {
                      event_category: "conversion",
                      event_label: "final_cta",
                    });
                  }
                }}
              >
                {ctaText} <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            {/* Risk Reversal */}
            <p className="mt-4 text-sm text-white/70">{riskReversal}</p>

            {/* Trust Indicators */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
                <Shield className="h-4 w-4" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
                <Clock className="h-4 w-4" />
                <span>5-Minute Setup</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
                <Check className="h-4 w-4" />
                <span>No Credit Card Required</span>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
