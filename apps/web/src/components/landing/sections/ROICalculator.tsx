"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, TrendingUp } from "lucide-react";
import { useROICalculator } from "@/hooks/useROICalculator";

function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`;
}

export function ROICalculator() {
  const router = useRouter();
  const { inputs, outputs, updateInput } = useROICalculator();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams({ source: "roi-calculator" });

    if (email.trim()) {
      params.set("email", email.trim());
    }

    router.push(`/signup?${params.toString()}`);
  };

  return (
    <section id="roi-calculator" className="scroll-mt-24 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            <Calculator className="h-4 w-4" />
            ROI Calculator
          </span>
          <h2 className="mt-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            See what Zevolvia saves you
          </h2>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900">Your Inputs</h3>
            <div className="mt-8 space-y-8">
              <div>
                <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                  <label htmlFor="staff-count">Number of staff</label>
                  <span className="rounded-md bg-brand-100 px-2.5 py-1 text-brand-800">
                    {inputs.staffCount}
                  </span>
                </div>
                <input
                  id="staff-count"
                  type="range"
                  min={1}
                  max={20}
                  value={inputs.staffCount}
                  onChange={(e) => updateInput("staffCount", Number(e.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-brand-600"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>1</span>
                  <span>20+</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                  <label htmlFor="missed-texts">Missed texts per day (estimate)</label>
                  <span className="rounded-md bg-brand-100 px-2.5 py-1 text-brand-800">
                    {inputs.missedTextsPerDay}
                  </span>
                </div>
                <input
                  id="missed-texts"
                  type="range"
                  min={2}
                  max={15}
                  value={inputs.missedTextsPerDay}
                  onChange={(e) => updateInput("missedTextsPerDay", Number(e.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-brand-600"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>2</span>
                  <span>15</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                  <label htmlFor="avg-value">Average appointment value</label>
                  <span className="rounded-md bg-brand-100 px-2.5 py-1 text-brand-800">
                    ${inputs.averageAppointmentValue}
                  </span>
                </div>
                <input
                  id="avg-value"
                  type="range"
                  min={40}
                  max={200}
                  step={5}
                  value={inputs.averageAppointmentValue}
                  onChange={(e) => updateInput("averageAppointmentValue", Number(e.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-brand-600"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>$40</span>
                  <span>$200</span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-medium text-gray-600">
                  Monthly plan cost (auto-calculated)
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatCurrency(outputs.monthlyPlanCost)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-green-50 p-6 sm:p-8">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <TrendingUp className="h-5 w-5 text-brand-700" />
              Your Results
            </h3>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-600">Recovered bookings/month</p>
                <p className="text-xl font-semibold text-gray-900">
                  {outputs.recoveredBookingsPerMonth}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-600">Additional monthly revenue</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(outputs.additionalMonthlyRevenue)}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-600">Monthly plan cost</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(outputs.monthlyPlanCost)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-5">
              <p className="text-sm font-medium text-green-800">Net monthly gain</p>
              <p className="mt-1 text-4xl font-extrabold text-green-700">
                {formatCurrency(outputs.netMonthlyGain)}
              </p>
              <p className="mt-2 text-sm font-medium text-green-900">
                ROI: {outputs.roiMultiple}x return
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional for ROI follow-up)"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-700"
              >
                Start capturing those bookings — Free Trial
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
