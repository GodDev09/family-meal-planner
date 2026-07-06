"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Warning {
  nutrient: string;
  status: "thieu" | "du_thua";
  percent_of_target: number;
  suggestion: string;
}

interface Props {
  warnings: Warning[];
  className?: string;
}

const NUTRIENT_VI: Record<string, string> = {
  canxi_mg: "Canxi", sat_mg: "Sắt", kem_mg: "Kẽm", iod_mcg: "Iốt",
  vitA_mcg: "Vitamin A", vitD_mcg: "Vitamin D", vitE_mg: "Vitamin E",
  vitC_mg: "Vitamin C", vitB1_mg: "Vitamin B1", vitB2_mg: "Vitamin B2",
  vitB6_mg: "Vitamin B6", vitB12_mcg: "Vitamin B12", folat_mcg: "Folate",
  natri_mg: "Natri", protein_g: "Protein", chat_xo_g: "Chất xơ",
  kcal: "Năng lượng",
};

const COLLAPSE_THRESHOLD = 3;

export function NutritionWarnings({ warnings, className }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!warnings.length) return null;

  const shown = expanded ? warnings : warnings.slice(0, COLLAPSE_THRESHOLD);

  return (
    <div className={cn("rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚠️</span>
        <span className="font-semibold text-orange-800 dark:text-orange-300 text-sm">
          {warnings.length} cảnh báo dinh dưỡng
        </span>
      </div>
      <div className="space-y-2">
        {shown.map((w, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="shrink-0 mt-0.5">{w.status === "thieu" ? "🟡" : "🔴"}</span>
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {NUTRIENT_VI[w.nutrient] ?? w.nutrient}
              </span>
              <span className={cn(
                "ml-1 text-xs px-1.5 py-0.5 rounded-full font-medium",
                w.status === "thieu"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
              )}>
                {w.status === "thieu" ? `Thiếu ${w.percent_of_target}%` : `Dư ${w.percent_of_target}%`}
              </span>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-xs leading-relaxed">{w.suggestion}</p>
            </div>
          </div>
        ))}
      </div>
      {warnings.length > COLLAPSE_THRESHOLD && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs text-orange-700 dark:text-orange-400 hover:underline font-medium"
        >
          {expanded ? "Thu gọn ▲" : `Xem thêm ${warnings.length - COLLAPSE_THRESHOLD} cảnh báo ▼`}
        </button>
      )}
    </div>
  );
}
