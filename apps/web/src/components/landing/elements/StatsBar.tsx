"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils";

interface Stat {
  value: string;
  label: string;
}

interface StatsBarProps {
  stats: Stat[];
  className?: string;
}

export function StatsBar({ stats, className }: StatsBarProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-8", className)}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          className="text-center"
        >
          <div className="text-3xl font-bold text-purple-600 sm:text-4xl">{stat.value}</div>
          <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
