"use client";

import { motion } from "framer-motion";
import { Calculator, TrendingUp, DollarSign, Clock } from "lucide-react";
import { Container } from "../Container";
import { useROICalculator } from "@/hooks/useROICalculator";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/utils";

export function ROICalculator() {
  const { ref, isInView } = useScrollAnimation();
  const { inputs, outputs, updateInput, planName } = useROICalculator();

  return (
    <section className="bg-white py-16 sm:py-20">
      <Container>
        <div ref={ref} className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700">
              <Calculator className="h-4 w-4" />
              ROI Calculator
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              See Your Savings in Real Time
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Adjust the sliders to match your operation and see how much time and money you could
              save.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-12 grid gap-8 lg:grid-cols-2"
        >
          {/* Inputs Panel */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900">Your Operation</h3>
            <p className="mt-1 text-sm text-gray-500">Adjust these values to match your business</p>

            <div className="mt-8 space-y-8">
              {/* Number of Locations */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Number of Locations</label>
                  <span className="rounded-lg bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                    {inputs.numberOfLocations}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={inputs.numberOfLocations}
                  onChange={(e) => updateInput("numberOfLocations", parseInt(e.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-purple-600"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>5</span>
                  <span>50</span>
                </div>
              </div>

              {/* Questions per Day */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Questions per Day (per location)
                  </label>
                  <span className="rounded-lg bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                    {inputs.questionsPerDayPerLocation}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={inputs.questionsPerDayPerLocation}
                  onChange={(e) =>
                    updateInput("questionsPerDayPerLocation", parseInt(e.target.value))
                  }
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-purple-600"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>5</span>
                  <span>50</span>
                </div>
              </div>

              {/* Minutes per Question */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Minutes per Question</label>
                  <span className="rounded-lg bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                    {inputs.minutesPerQuestion} min
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={inputs.minutesPerQuestion}
                  onChange={(e) => updateInput("minutesPerQuestion", parseInt(e.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-purple-600"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>2 min</span>
                  <span>10 min</span>
                </div>
              </div>

              {/* Manager Hourly Rate */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Manager Hourly Rate</label>
                  <span className="rounded-lg bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                    ${inputs.managerHourlyRate}/hr
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="50"
                  value={inputs.managerHourlyRate}
                  onChange={(e) => updateInput("managerHourlyRate", parseInt(e.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-purple-600"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>$15/hr</span>
                  <span>$50/hr</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900">Your Savings</h3>
            <p className="mt-1 text-sm text-gray-500">Based on your inputs above</p>

            <div className="mt-8 space-y-6">
              {/* Time Saved */}
              <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time Saved Per Week</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {outputs.hoursPerWeekSaved} hours
                  </p>
                </div>
              </div>

              {/* Monthly Savings */}
              <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Savings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${outputs.monthlySavings.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Yearly Savings */}
              <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Yearly Savings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${outputs.yearlySavings.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Plan Cost & Net Savings */}
              <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">{planName} Plan Cost</p>
                    <p className="text-lg font-semibold text-purple-900">
                      ${outputs.monthlyPlanCost}/month
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-purple-700">Net Monthly Savings</p>
                    <p className="text-2xl font-bold text-green-600">
                      +${outputs.netMonthlySavings.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3 border-t border-purple-200 pt-3">
                  <p className="text-center text-sm font-medium text-purple-800">
                    {outputs.roi}% ROI — pays for itself{" "}
                    {outputs.roi > 1000
                      ? "many times over"
                      : `${Math.ceil(100 / outputs.roi)}x over`}{" "}
                    each month
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6">
              <a
                href="#pricing"
                className="block w-full rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] py-4 text-center font-semibold text-white shadow-lg transition-all hover:shadow-xl"
              >
                Start Saving Now — Free 14-Day Trial
              </a>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
