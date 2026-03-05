"use client";

import { Calculator, CalendarX2, Scissors, Users } from "lucide-react";
import { useROICalculator } from "@/hooks/useROICalculator";

function formatCurrency(value: number): string {
  return `$${value.toLocaleString()}`;
}

export function ROICalculator() {
  const { inputs, outputs, updateInput } = useROICalculator();

  return (
    <section id="roi-calculator" className="scroll-mt-24 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            <Calculator className="h-4 w-4" />
            Business Impact Model
          </span>
          <h2 className="mt-4 font-serif text-3xl font-bold text-gray-900 sm:text-4xl">
            See what no-shows are costing your salon
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
            Adjust the numbers below to estimate your annual revenue lost to no-shows.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900">Your Inputs</h3>
            <div className="mt-8 space-y-7">
              <div>
                <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                  <label htmlFor="average-price" className="inline-flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-brand-700" />
                    Average service price
                  </label>
                  <span className="rounded-md bg-brand-100 px-2.5 py-1 text-brand-800">
                    ${inputs.averageServicePrice}
                  </span>
                </div>
                <input
                  id="average-price"
                  type="range"
                  min={20}
                  max={300}
                  step={5}
                  value={inputs.averageServicePrice}
                  onChange={(e) => updateInput("averageServicePrice", Number(e.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-brand-600"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>$20</span>
                  <span>$300</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                  <label htmlFor="weekly-no-shows" className="inline-flex items-center gap-2">
                    <CalendarX2 className="h-4 w-4 text-brand-700" />
                    Weekly no-shows (per stylist)
                  </label>
                  <span className="rounded-md bg-brand-100 px-2.5 py-1 text-brand-800">
                    {inputs.weeklyNoShows}
                  </span>
                </div>
                <input
                  id="weekly-no-shows"
                  type="range"
                  min={0}
                  max={20}
                  value={inputs.weeklyNoShows}
                  onChange={(e) => updateInput("weeklyNoShows", Number(e.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-brand-600"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>20</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                  <label htmlFor="stylists" className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-brand-700" />
                    Number of stylists
                  </label>
                  <span className="rounded-md bg-brand-100 px-2.5 py-1 text-brand-800">
                    {inputs.stylists}
                  </span>
                </div>
                <input
                  id="stylists"
                  type="range"
                  min={1}
                  max={30}
                  value={inputs.stylists}
                  onChange={(e) => updateInput("stylists", Number(e.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-brand-600"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>1</span>
                  <span>30</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 via-white to-orange-50 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900">Estimated Business Impact</h3>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-600">Monthly lost revenue</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatCurrency(outputs.monthlyLostRevenue)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-medium text-red-800">Annual lost revenue</p>
              <p className="mt-1 text-4xl font-extrabold text-red-700">
                {formatCurrency(outputs.annualLostRevenue)}
              </p>
              <p className="mt-2 text-sm text-red-900">
                Formula: average service price × weekly no-shows × stylists × 52 weeks
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
