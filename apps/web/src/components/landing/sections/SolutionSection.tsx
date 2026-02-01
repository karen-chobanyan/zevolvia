"use client";

import { motion } from "framer-motion";
import { Upload, MessageCircle, CheckCircle, ArrowRight } from "lucide-react";
import { Container } from "../Container";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/utils";

const iconMap = {
  Upload,
  MessageCircle,
  CheckCircle,
};

interface Step {
  stepNumber: number;
  icon: keyof typeof iconMap;
  title: string;
  description: string;
  bullets: string[];
}

interface SolutionSectionProps {
  steps: Step[];
}

export function SolutionSection({ steps }: SolutionSectionProps) {
  const { ref, isInView } = useScrollAnimation();

  return (
    <section id="how-it-works" className="bg-gray-50 py-16 sm:py-20">
      <Container>
        <div ref={ref} className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center rounded-full bg-purple-50 px-4 py-1.5 text-sm font-medium text-purple-700">
              How It Works
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Get Started in 3 Simple Steps
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              No complex setup. No lengthy onboarding. Just upload, share the number, and watch your
              team get answers instantly.
            </p>
          </motion.div>
        </div>

        {/* Steps */}
        <div className="relative mt-16">
          {/* Connecting Line (desktop only) */}
          <div className="absolute left-0 right-0 top-24 hidden h-0.5 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200 lg:block" />

          <div className="grid gap-8 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = iconMap[step.icon];
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.2, duration: 0.5 }}
                  className="relative"
                >
                  {/* Step Card */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    {/* Step Number */}
                    <div className="relative z-10 mb-4 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-lg font-bold text-white shadow-lg">
                        {step.stepNumber}
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>

                    {/* Description */}
                    <p className="mt-2 text-gray-600">{step.description}</p>

                    {/* Bullets */}
                    <ul className="mt-4 space-y-2">
                      {step.bullets.map((bullet, bulletIndex) => (
                        <li
                          key={bulletIndex}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Arrow (between steps on desktop) */}
                  {index < steps.length - 1 && (
                    <div className="absolute -right-4 top-1/2 z-20 hidden -translate-y-1/2 lg:block">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
                        <ArrowRight className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="mb-4 text-lg text-gray-600">Ready to save 10+ hours per week?</p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#667eea] to-[#764ba2] px-8 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
          >
            See Pricing <ArrowRight className="h-5 w-5" />
          </a>
        </motion.div>
      </Container>
    </section>
  );
}
