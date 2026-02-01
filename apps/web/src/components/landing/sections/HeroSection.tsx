"use client";

import { motion } from "framer-motion";
import { ArrowRight, Star, Shield, Check } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Container } from "../Container";
import { PhoneMockup } from "../elements/PhoneMockup";
import { cn } from "@/utils";

interface HeroSectionProps {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaSubtext?: string;
  socialProofText: string;
  demoMessages: Array<{
    type: "user" | "assistant";
    text: string;
    timestamp?: string;
  }>;
}

export function HeroSection({
  headline,
  subheadline,
  ctaText,
  ctaSubtext,
  socialProofText,
  demoMessages,
}: HeroSectionProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Track analytics event
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "hero_cta_click", {
        event_category: "conversion",
        event_label: "hero_signup",
      });
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#667eea]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <Container className="relative py-16 sm:py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            {/* Social Proof Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm"
            >
              <div className="flex -space-x-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-6 w-6 rounded-full border-2 border-white/20 bg-gradient-to-br from-purple-300 to-purple-500"
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-white">{socialProofText}</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {headline}
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg text-white/80 sm:text-xl">{subheadline}</p>

            {/* CTA Form */}
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="mt-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your work email"
                      className="h-14 w-full rounded-xl border-0 bg-white px-5 text-gray-900 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "inline-flex h-14 items-center justify-center gap-2 rounded-xl px-6 font-semibold shadow-lg transition-all",
                      "bg-gray-900 text-white hover:bg-gray-800",
                      "disabled:cursor-not-allowed disabled:opacity-70",
                    )}
                  >
                    {isSubmitting ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        {ctaText} <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
                {ctaSubtext && <p className="mt-3 text-sm text-white/70">{ctaSubtext}</p>}
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 rounded-xl bg-white/10 p-6 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">You're in!</p>
                    <p className="text-sm text-white/70">Check your email to get started.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Trust Indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 lg:justify-start">
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Shield className="h-4 w-4" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Star className="h-4 w-4" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Check className="h-4 w-4" />
                <span>No Credit Card</span>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative hidden lg:block"
          >
            <PhoneMockup messages={demoMessages} />

            {/* Floating Elements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="absolute -left-8 top-20 rounded-xl bg-white p-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Response Time</p>
                  <p className="text-xs text-gray-500">&lt;10 seconds avg</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="absolute -right-4 bottom-32 rounded-xl bg-white p-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Accuracy</p>
                  <p className="text-xs text-gray-500">95% from your docs</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </Container>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
