"use client";

import { motion } from "framer-motion";
import { MessageSquare, Users, FileQuestion } from "lucide-react";
import { Container } from "../Container";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/utils";

const iconMap = {
  MessageSquare,
  Users,
  FileQuestion,
};

interface PainPoint {
  icon: keyof typeof iconMap;
  title: string;
  description: string;
  stat: string;
}

interface ProblemSectionProps {
  painPoints: PainPoint[];
}

export function ProblemSection({ painPoints }: ProblemSectionProps) {
  const { ref, isInView } = useScrollAnimation();

  return (
    <section className="bg-white py-16 sm:py-20">
      <Container>
        <div ref={ref} className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center rounded-full bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700">
              The Problem
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Sound Familiar?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Restaurant managers across the country are drowning in repetitive questions. Here's
              what we hear every day:
            </p>
          </motion.div>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {painPoints.map((point, index) => {
            const Icon = iconMap[point.icon];
            return (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="group relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-red-200 hover:shadow-md"
              >
                {/* Icon */}
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-colors group-hover:bg-red-100">
                  <Icon className="h-6 w-6" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900">{point.title}</h3>

                {/* Description */}
                <p className="mt-2 text-gray-600">{point.description}</p>

                {/* Stat Badge */}
                <div className="mt-4 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                  {point.stat}
                </div>

                {/* Decorative Corner */}
                <div className="absolute -right-1 -top-1 h-16 w-16 rounded-tr-2xl bg-gradient-to-br from-red-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-lg italic text-gray-500">
            "I answer the same 10 questions at least 5 times a day. It's exhausting."
          </p>
          <p className="mt-2 text-sm font-medium text-gray-700">
            — Every restaurant manager, everywhere
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
