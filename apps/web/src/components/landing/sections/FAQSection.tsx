"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Container } from "../Container";
import { FAQAccordion } from "../elements/FAQAccordion";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
}

export function FAQSection({ faqs }: FAQSectionProps) {
  const { ref, isInView } = useScrollAnimation();

  return (
    <section id="faq" className="bg-white py-16 sm:py-20">
      <Container>
        <div ref={ref} className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center rounded-full bg-purple-50 px-4 py-1.5 text-sm font-medium text-purple-700">
              FAQ
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Everything you need to know about our restaurant SMS assistant. Can't find what you're
              looking for? Reach out to our team.
            </p>
          </motion.div>
        </div>

        {/* FAQ Accordion List */}
        <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-gray-200 bg-white px-6 shadow-sm sm:px-8">
          {faqs.map((faq, index) => (
            <FAQAccordion
              key={index}
              question={faq.question}
              answer={faq.answer}
              index={index}
              defaultOpen={index === 0}
            />
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-4 rounded-2xl bg-gray-50 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <MessageCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Still have questions?</p>
              <p className="text-sm text-gray-600">
                We're here to help.{" "}
                <a
                  href="mailto:support@example.com"
                  className="text-purple-600 hover:text-purple-700"
                >
                  Contact support →
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
