"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  familyId: string;
  targetKcal: number;
  targetProtein: number;
  targetLipid: number;
  targetGlucid: number;
}

interface ActualData {
  kcal: number;
  protein_g: number;
  lipid_g: number;
  glucid_g: number;
  days: number;
}

function pct(actual: number, target: number): number {
  if (!target) return 0;
  return Math.min(150, Math.round((actual / target) * 100));
}

function barColor(p: number): string {
  if (p < 80) return "bg-yellow-400";
  if (p > 130) return "bg-red-400";
  return "bg-brand-500";
}

function statusText(p: number): string {
  if (p < 80) return "Thiếu";
  if (p > 120) return "Dư";
  return "Đạt";
}

function statusColor(p: number): string {
  if (p < 80) return "text-yellow-600 dark:text-yellow-400";
  if (p > 120) return "text-red-500 dark:text-red-400";
  return "text-brand-600 dark:text-brand-400";
}

export function NutritionActualVsTarget({ familyId, targetKcal, targetProtein, targetLipid, targetGlucid }: Props) {
  const [actual, setActual] = useState<ActualData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) return;
    fetch(`/api/menu?id=${familyId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.menu_data?.slots) { setLoading(false); return; }
        const slots = data.menu_data.slots as Array<{
          dishes: Array<{
            nutritionPerServing?: {
              kcal?: number; protein_g?: number; lipid_g?: number; glucid_g?: number;
            };
          }>;
        }>;

        let kcal = 0, protein = 0, lipid = 0, glucid = 0;
        for (const slot of slots) {
          for (const dish of slot.dishes ?? []) {
            const n = dish.nutritionPerServing ?? {};
            kcal += n.kcal ?? 0;
            protein += n.protein_g ?? 0;
            lipid += n.lipid_g ?? 0;
            glucid += n.glucid_g ?? 0;
          }
        }
        const days = 7;
        setActual({ kcal: kcal / days, protein_g: protein / days, lipid_g: lipid / days, glucid_g: glucid / days, days });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [familyId]);

  if (loading) return (
    <div className="card animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-3" />
      {[1,2,3,4].map(i => <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded mb-2" />)}
    </div>
  );

  if (!actual) return null;

  const rows = [
    { label: "Năng lượng", actual: actual.kcal, target: targetKcal, unit: "kcal" },
    { label: "Protein", actual: actual.protein_g, target: targetProtein, unit: "g" },
    { label: "Lipid", actual: actual.lipid_g, target: targetLipid, unit: "g" },
    { label: "Glucid", actual: actual.glucid_g, target: targetGlucid, unit: "g" },
  ];

  return (
    <div className="card mb-6">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        📊 Thực tế tuần này vs Mục tiêu
        <span className="text-xs font-normal text-gray-400">(trung bình / ngày)</span>
      </h3>
      <div className="space-y-3">
        {rows.map((row) => {
          const p = pct(row.actual, row.target);
          return (
            <div key={row.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{row.label}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">
                    {Math.round(row.actual)}<span className="text-gray-400">/{Math.round(row.target)} {row.unit}</span>
                  </span>
                  <span className={cn("font-semibold", statusColor(p))}>
                    {statusText(p)} ({p}%)
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", barColor(p))}
                  style={{ width: `${Math.min(100, p)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-right">
        Dữ liệu từ thực đơn tuần {actual.days} ngày
      </p>
    </div>
  );
}
