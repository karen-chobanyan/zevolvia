"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/utils";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  company: string;
  image?: string;
  index?: number;
  isInView?: boolean;
}

export function TestimonialCard({
  quote,
  author,
  role,
  company,
  image,
  index = 0,
  isInView = true,
}: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      {/* Stars */}
      <div className="mb-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-gray-700 leading-relaxed">"{quote}"</blockquote>

      {/* Author */}
      <div className="mt-6 flex items-center gap-4">
        <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-purple-400 to-purple-600">
          {image ? (
            <img src={image} alt={author} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
              {author
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
          )}
        </div>
        <div>
          <div className="font-semibold text-gray-900">{author}</div>
          <div className="text-sm text-gray-500">
            {role}, {company}
          </div>
        </div>
      </div>

      {/* Decorative Quote Mark */}
      <div className="absolute -right-2 -top-2 text-6xl font-serif text-purple-100">"</div>
    </motion.div>
  );
}
