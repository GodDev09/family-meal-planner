"use client";

import { useEffect, useState } from "react";

interface Dish {
  id: string;
  ten: string;
  nhomMon: string;
  nguyenLieu: string[];
  nutritionPerServing: { kcal: number; protein_g: number };
}

interface Props {
  open: boolean;
  onClose: () => void;
  familyId: string;
  weekStart: string;
  date: string;
  mealSlot: "sang" | "trua" | "toi" | "phu";
  dishIndex: number;
  currentDishName: string;
  onSwapped: (newDish: Dish) => void;
}

export function SwapDishModal({
  open, onClose, familyId, weekStart, date, mealSlot, dishIndex, currentDishName, onSwapped,
}: Props) {
  const [suggestion, setSuggestion] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [excludeIds, setExcludeIds] = useState<string[]>([]);

  async function fetchSuggestion(excluded: string[]) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/menu/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_id: familyId,
          week_start: weekStart,
          date,
          meal_slot: mealSlot,
          dish_index: dishIndex,
          exclude_dish_ids: excluded,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lỗi không xác định");
      setSuggestion(data.new_dish);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setSuggestion(null);
      setExcludeIds([]);
      setError("");
      fetchSuggestion([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleAnotherSuggestion() {
    const newExclude = suggestion ? [...excludeIds, suggestion.id] : excludeIds;
    setExcludeIds(newExclude);
    fetchSuggestion(newExclude);
  }

  function handleConfirm() {
    if (suggestion) {
      onSwapped(suggestion);
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white text-lg">Đổi món</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Thay <span className="font-medium text-gray-700 dark:text-gray-300">{currentDishName}</span>
          </p>
        </div>

        {/* Body */}
        <div className="p-5 min-h-[160px] flex flex-col">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-400 animate-pulse text-sm">Đang tìm món phù hợp...</div>
            </div>
          )}
          {error && !loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-red-500 text-sm text-center">{error}</div>
            </div>
          )}
          {suggestion && !loading && (
            <div className="space-y-3">
              <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4">
                <div className="font-semibold text-brand-700 dark:text-brand-300 text-base">{suggestion.ten}</div>
                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                  <span>🔥 {suggestion.nutritionPerServing.kcal} kcal</span>
                  <span>💪 {suggestion.nutritionPerServing.protein_g}g protein</span>
                </div>
                <div className="mt-2 text-xs text-gray-400 leading-relaxed">
                  {suggestion.nguyenLieu.slice(0, 4).join(", ")}
                  {suggestion.nguyenLieu.length > 4 && "..."}
                </div>
              </div>
              <button
                onClick={handleAnotherSuggestion}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline w-full text-center"
              >
                🔄 Gợi ý khác
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
          <button
            onClick={handleConfirm}
            disabled={!suggestion || loading}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            Đổi ngay
          </button>
        </div>
      </div>
    </div>
  );
}
