"use client";

import { motion } from "framer-motion";
import { Container } from "../Container";
import { TestimonialCard } from "../elements/TestimonialCard";
import { StatsBar } from "../elements/StatsBar";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  image?: string;
}

interface Stat {
  value: string;
  label: string;
}

interface SocialProofSectionProps {
  testimonials: Testimonial[];
  stats: Stat[];
}

export function SocialProofSection({ testimonials, stats }: SocialProofSectionProps) {
  const { ref, isInView } = useScrollAnimation();

  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <Container>
        <div ref={ref}>
          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-white p-8 shadow-sm"
          >
            <StatsBar stats={stats} />
          </motion.div>

          {/* Section Header */}
          <div className="mt-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <span className="inline-flex items-center rounded-full bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700">
                Success Stories
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Trusted by Restaurant Teams
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
                Don't just take our word for it. Here's what real restaurant managers say about the
                difference we've made.
              </p>
            </motion.div>
          </div>

          {/* Testimonials Grid */}
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.author}
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                company={testimonial.company}
                image={testimonial.image}
                index={index}
                isInView={isInView}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
