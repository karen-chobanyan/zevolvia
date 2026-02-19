"use client";

import { useState, useMemo } from "react";

interface ROIInputs {
  staffCount: number;
  missedTextsPerDay: number;
  averageAppointmentValue: number;
}

interface ROIOutputs {
  recoveredBookingsPerMonth: number;
  additionalMonthlyRevenue: number;
  monthlyPlanCost: number;
  netMonthlyGain: number;
  roiMultiple: number;
}

const defaultInputs: ROIInputs = {
  staffCount: 5,
  missedTextsPerDay: 5,
  averageAppointmentValue: 80,
};

function getMonthlyPlanCost(staffCount: number): number {
  // $19 base + $9 for each additional staff seat
  return 19 + Math.max(0, staffCount - 1) * 9;
}

export function useROICalculator(initialInputs?: Partial<ROIInputs>) {
  const [inputs, setInputs] = useState<ROIInputs>({
    ...defaultInputs,
    ...initialInputs,
  });

  const outputs = useMemo((): ROIOutputs => {
    const { staffCount, missedTextsPerDay, averageAppointmentValue } = inputs;
    const monthlyPlanCost = getMonthlyPlanCost(staffCount);

    // Conservative estimate of missed inquiries that convert once auto-replies are enabled.
    const recoveredBookingsPerMonth = Math.round(missedTextsPerDay * 30 * 0.35);
    const additionalMonthlyRevenue = recoveredBookingsPerMonth * averageAppointmentValue;
    const netMonthlyGain = additionalMonthlyRevenue - monthlyPlanCost;
    const roiMultiple = monthlyPlanCost > 0 ? additionalMonthlyRevenue / monthlyPlanCost : 0;

    return {
      recoveredBookingsPerMonth,
      additionalMonthlyRevenue,
      monthlyPlanCost,
      netMonthlyGain: Math.round(netMonthlyGain),
      roiMultiple: Math.round(roiMultiple * 10) / 10,
    };
  }, [inputs]);

  const updateInput = <K extends keyof ROIInputs>(key: K, value: ROIInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  return {
    inputs,
    outputs,
    updateInput,
  };
}
