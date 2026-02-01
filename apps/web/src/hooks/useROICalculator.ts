"use client";

import { useState, useMemo } from "react";

interface ROIInputs {
  numberOfLocations: number;
  questionsPerDayPerLocation: number;
  minutesPerQuestion: number;
  managerHourlyRate: number;
}

interface ROIOutputs {
  hoursPerWeekSaved: number;
  monthlySavings: number;
  yearlySavings: number;
  monthlyPlanCost: number;
  netMonthlySavings: number;
  roi: number;
}

const defaultInputs: ROIInputs = {
  numberOfLocations: 10,
  questionsPerDayPerLocation: 20,
  minutesPerQuestion: 5,
  managerHourlyRate: 25,
};

function getPlanCost(locations: number): number {
  if (locations <= 10) return 99;
  if (locations <= 25) return 79;
  return 59;
}

function getPlanName(locations: number): string {
  if (locations <= 10) return "Starter";
  if (locations <= 25) return "Professional";
  return "Enterprise";
}

export function useROICalculator(initialInputs?: Partial<ROIInputs>) {
  const [inputs, setInputs] = useState<ROIInputs>({
    ...defaultInputs,
    ...initialInputs,
  });

  const outputs = useMemo((): ROIOutputs => {
    const { numberOfLocations, questionsPerDayPerLocation, minutesPerQuestion, managerHourlyRate } =
      inputs;

    // Calculate daily minutes saved across all locations
    const dailyMinutesSaved = numberOfLocations * questionsPerDayPerLocation * minutesPerQuestion;

    // Convert to hours per week (assuming 5 working days)
    const hoursPerWeekSaved = (dailyMinutesSaved * 5) / 60;

    // Calculate monthly savings (4 weeks)
    const monthlySavings = hoursPerWeekSaved * 4 * managerHourlyRate;

    // Calculate yearly savings
    const yearlySavings = monthlySavings * 12;

    // Get plan cost based on number of locations
    const monthlyPlanCost = getPlanCost(numberOfLocations);

    // Calculate net savings
    const netMonthlySavings = monthlySavings - monthlyPlanCost;

    // Calculate ROI percentage
    const roi = monthlyPlanCost > 0 ? (netMonthlySavings / monthlyPlanCost) * 100 : 0;

    return {
      hoursPerWeekSaved: Math.round(hoursPerWeekSaved * 10) / 10,
      monthlySavings: Math.round(monthlySavings),
      yearlySavings: Math.round(yearlySavings),
      monthlyPlanCost,
      netMonthlySavings: Math.round(netMonthlySavings),
      roi: Math.round(roi),
    };
  }, [inputs]);

  const updateInput = <K extends keyof ROIInputs>(key: K, value: ROIInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const planName = getPlanName(inputs.numberOfLocations);

  return {
    inputs,
    outputs,
    updateInput,
    planName,
  };
}
