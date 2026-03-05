"use client";

import { useMemo, useState } from "react";

interface ROIInputs {
  averageServicePrice: number;
  weeklyNoShows: number;
  stylists: number;
}

interface ROIOutputs {
  annualLostRevenue: number;
  monthlyLostRevenue: number;
}

const defaultInputs: ROIInputs = {
  averageServicePrice: 80,
  weeklyNoShows: 4,
  stylists: 3,
};

export function useROICalculator(initialInputs?: Partial<ROIInputs>) {
  const [inputs, setInputs] = useState<ROIInputs>({
    ...defaultInputs,
    ...initialInputs,
  });

  const outputs = useMemo((): ROIOutputs => {
    const { averageServicePrice, weeklyNoShows, stylists } = inputs;

    const annualLostRevenue = Math.round(averageServicePrice * weeklyNoShows * stylists * 52);
    const monthlyLostRevenue = Math.round(annualLostRevenue / 12);

    return {
      annualLostRevenue,
      monthlyLostRevenue,
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
