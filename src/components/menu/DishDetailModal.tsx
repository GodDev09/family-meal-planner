"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { getRecipe } from "@/lib/data/recipes";
import { getDishImageUrl } from "@/lib/data/dishImages";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NutritionPerServing {
  kcal: number;
  protein_g: number;
  lipid_g: number;
  glucid_g: number;
  canxi_mg: number;
  sat_mg: number;
  vitC_mg: number;
  chat_xo_g: number;
  natri_mg: number;
}

interface Dish {
  id: string;
  ten: string;
  ten_en?: string;
  nhomMon: string;
  vung_mien: string;
  nguyenLieu: string[];
  doKho: 1 | 2 | 3;
  thoiGianNau: number;
  chayMan: "chay" | "man";
  diUng: string[];
  nutritionPerServing: NutritionPerServing;
  imageEmoji?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  dish: Dish | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NHOM_MON_LABELS: Record<string, string> = {
  canh: "Canh/Súp",
  xao: "Xào",
  kho: "Kho/Rim",
  luoc_hap: "Luộc/Hấp",
  chien: "Chiên/Rán",
  nuong: "Nướng",
  goi_nom: "Gỏi/Nộm",
  com_bun_pho: "Cơm/Bún/Phở",
  trang_miet: "Tráng miệng",
};

const VUNG_MIEN_LABELS: Record<string, string> = {
  bac: "Bắc",
  trung: "Trung",
  nam: "Nam",
  chung: "Chung",
};

const VUNG_MIEN_COLORS: Record<string, string> = {
  bac: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  trung: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  nam: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  chung: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

const DO_KHO_LABELS: Record<1 | 2 | 3, string> = {
  1: "Dễ",
  2: "Trung bình",
  3: "Khó",
};

const DO_KHO_STARS: Record<1 | 2 | 3, string> = {
  1: "⭐",
  2: "⭐⭐",
  3: "⭐⭐⭐",
};

const NHOM_EMOJI: Record<string, string> = {
  canh: "🍲", xao: "🥘", kho: "🍖", luoc_hap: "♨️",
  chien: "🍳", nuong: "🔥", goi_nom: "🥗", com_bun_pho: "🍜",
  trang_miet: "🍑", khac: "🍽️",
};

// Gradient backgrounds per nhomMon for image placeholder
const NHOM_GRADIENT: Record<string, string> = {
  canh:       "from-teal-400 to-cyan-500",
  xao:        "from-yellow-400 to-orange-500",
  kho:        "from-amber-500 to-red-600",
  luoc_hap:   "from-sky-400 to-blue-500",
  chien:      "from-yellow-300 to-amber-500",
  nuong:      "from-orange-500 to-red-500",
  goi_nom:    "from-green-400 to-emerald-500",
  com_bun_pho:"from-rose-400 to-pink-500",
  trang_miet: "from-pink-300 to-purple-400",
  khac:       "from-gray-400 to-gray-500",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NutritionCard({
  label,
  value,
  unit,
  large,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  large?: boolean;
  color?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl p-3 text-center",
        large
          ? "bg-brand-50 dark:bg-brand-900/30"
          : "bg-gray-50 dark:bg-gray-800",
        color
      )}
    >
      <span
        className={cn(
          "font-bold leading-none",
          large ? "text-3xl text-brand-700 dark:text-brand-300" : "text-xl text-gray-800 dark:text-gray-100"
        )}
      >
        {Math.round(value)}
      </span>
      <span
        className={cn(
          "text-xs mt-0.5",
          large ? "text-brand-500 dark:text-brand-400" : "text-gray-400"
        )}
      >
        {unit}
      </span>
      <span className={cn("text-xs font-medium mt-0.5", large ? "text-brand-600 dark:text-brand-300" : "text-gray-500")}>
        {label}
      </span>
    </div>
  );
}

function MiniNutritionRow({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
        {value >= 1000
          ? `${(value / 1000).toFixed(1)} g`
          : value < 1
          ? `${(value * 1000).toFixed(0)} m${unit}`
          : `${Math.round(value)} ${unit}`}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

export function DishDetailModal({ open, onClose, dish }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent background scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open || !dish) return null;

  const vungLabel = VUNG_MIEN_LABELS[dish.vung_mien] ?? dish.vung_mien;
  const vungColor = VUNG_MIEN_COLORS[dish.vung_mien] ?? VUNG_MIEN_COLORS.chung;
  const nhomLabel = NHOM_MON_LABELS[dish.nhomMon] ?? dish.nhomMon;
  const n = dish.nutritionPerServing;
  const gradient = NHOM_GRADIENT[dish.nhomMon] ?? NHOM_GRADIENT.khac;
  const emoji = dish.imageEmoji ?? NHOM_EMOJI[dish.nhomMon] ?? "🍽️";
  const steps = getRecipe(dish.id, dish.nhomMon);
  const imageUrl = getDishImageUrl(dish.id);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={dish.ten}
        className="relative bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden"
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {dish.ten}
            </h2>
            {dish.ten_en && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 italic">
                {dish.ten_en}
              </p>
            )}
            {/* Badges row */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", vungColor)}>
                {vungLabel}
              </span>
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  dish.chayMan === "chay"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                )}
              >
                {dish.chayMan === "chay" ? "🌿 Chay" : "🥩 Mặn"}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {nhomLabel}
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Dish image — real Unsplash photo, fallback to gradient+emoji */}
        <div className={cn("w-full h-48 relative overflow-hidden bg-gradient-to-br", gradient)}>
          <img
            src={imageUrl ?? undefined}
            alt={dish.ten}
            className="w-full h-full object-cover"
            onError={(e) => {
              // On load error: hide img, show emoji fallback
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          {/* Emoji fallback — hidden by default, shown if img fails */}
          <div className="absolute inset-0 items-center justify-center hidden">
            <div className="text-7xl select-none drop-shadow-lg">{emoji}</div>
          </div>
          {/* Overlay with dish name */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
            <span className="text-white font-bold text-base drop-shadow-md">{dish.ten}</span>
            <span className="text-white/90 text-xs bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5">⏱ {dish.thoiGianNau} phút</span>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Nutrition cards row */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Dinh dưỡng / khẩu phần
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <NutritionCard label="Năng lượng" value={n.kcal} unit="kcal" large />
              <NutritionCard label="Protein" value={n.protein_g} unit="g" />
              <NutritionCard label="Lipid" value={n.lipid_g} unit="g" />
              <NutritionCard label="Glucid" value={n.glucid_g} unit="g" />
            </div>
          </section>

          {/* Ingredients */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Nguyên liệu
            </h3>
            <ul className="space-y-1">
              {dish.nguyenLieu.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Cooking steps */}
          {steps.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <span>👨‍🍳</span> Cách nấu
              </h3>
              <ol className="space-y-3">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={cn(
                      "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5",
                      i === 0 ? "bg-brand-500" : i === steps.length - 1 ? "bg-brand-700" : "bg-brand-400"
                    )}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Meta info */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Thông tin chế biến
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-1">Độ khó</div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {DO_KHO_STARS[dish.doKho]}{" "}
                  <span className="text-gray-500 dark:text-gray-400 font-normal">
                    {DO_KHO_LABELS[dish.doKho]}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-1">Thời gian nấu</div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                  ⏱ {dish.thoiGianNau} phút
                </div>
              </div>
            </div>
          </section>

          {/* Allergy tags */}
          {dish.diUng.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Dị ứng / cảnh báo
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {dish.diUng.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  >
                    ⚠️ {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Mini nutrition table */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Vi chất dinh dưỡng
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-1">
              <MiniNutritionRow label="Canxi" value={n.canxi_mg} unit="mg" />
              <MiniNutritionRow label="Sắt" value={n.sat_mg} unit="mg" />
              <MiniNutritionRow label="Vitamin C" value={n.vitC_mg} unit="mg" />
              <MiniNutritionRow label="Chất xơ" value={n.chat_xo_g} unit="g" />
              <MiniNutritionRow label="Natri" value={n.natri_mg} unit="mg" />
            </div>
          </section>
        </div>

        {/* Footer close button */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          <button onClick={onClose} className="btn-secondary w-full">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
