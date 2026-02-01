"use client";

import { motion } from "framer-motion";
import { Container } from "../Container";
import { FeatureCard } from "../elements/FeatureCard";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface Feature {
  icon: "Zap" | "Smartphone" | "Target" | "Globe" | "BarChart3" | "Sparkles";
  title: string;
  benefit: string;
  description: string;
}

interface FeaturesSectionProps {
  features: Feature[];
}

export function FeaturesSection({ features }: FeaturesSectionProps) {
  const { ref, isInView } = useScrollAnimation();

  return (
    <section id="features" className="bg-white py-16 sm:py-20">
      <Container>
        <div ref={ref} className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center rounded-full bg-purple-50 px-4 py-1.5 text-sm font-medium text-purple-700">
              Features
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything You Need to Save Time
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Built specifically for restaurant operations. Every feature designed to get your team
              answers faster.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              benefit={feature.benefit}
              description={feature.description}
              index={index}
              isInView={isInView}
            />
          ))}
        </div>

        {/* ChatGPT Comparison Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12 rounded-2xl border-2 border-purple-200 bg-purple-50 p-6 sm:p-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">"Why not just use ChatGPT?"</h3>
              <p className="mt-2 text-gray-600">
                Great question. ChatGPT doesn't know your procedures, can hallucinate answers,
                requires internet access, and needs an account. Our system only answers from YOUR
                approved documentation, works via SMS on any phone, and never makes things up.
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">ChatGPT</div>
                  <div className="text-sm text-gray-500">Generic answers</div>
                </div>
                <div className="text-2xl text-gray-300">vs</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">Us</div>
                  <div className="text-sm text-gray-500">YOUR manual only</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
