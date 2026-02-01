"use client";

import { motion } from "framer-motion";
import { Zap, Smartphone, Target, Globe, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/utils";

const iconMap = {
  Zap,
  Smartphone,
  Target,
  Globe,
  BarChart3,
  Sparkles,
};

interface FeatureCardProps {
  icon: keyof typeof iconMap;
  title: string;
  benefit: string;
  description: string;
  index?: number;
  isInView?: boolean;
}

export function FeatureCard({
  icon,
  title,
  benefit,
  description,
  index = 0,
  isInView = true,
}: FeatureCardProps) {
  const Icon = iconMap[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group relative rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-purple-200 hover:shadow-lg"
    >
      {/* Icon */}
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 transition-transform group-hover:scale-110">
        <Icon className="h-6 w-6" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      {/* Benefit (highlighted) */}
      <p className="mt-1 text-sm font-medium text-purple-600">{benefit}</p>

      {/* Description */}
      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{description}</p>

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.div>
  );
}
