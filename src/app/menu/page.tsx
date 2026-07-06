"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BottomNav, SideNav } from "@/components/ui/Nav";
import { SwapDishModal } from "@/components/menu/SwapDishModal";
import { DishDetailModal } from "@/components/menu/DishDetailModal";
import { DISHES } from "@/lib/data/dishes";
import { cn, formatDateVi, getWeekdayVi, addDays, getWeekStart } from "@/lib/utils";
import type { WeeklyMenuData } from "@/lib/store/familyStore";

// ---------------------------------------------------------------------------
// Types for menu_data payload
// ---------------------------------------------------------------------------

interface Dish {
  id?: string;
  ten: string;
  kcal?: number;
  nguyenLieu?: string[];
  nhomMon?: string;
  chayMan?: string;
}

const NHOM_ICON: Record<string, string> = {
  canh: "🍲", xao: "🥘", kho: "🍖", luoc_hap: "♨️",
  chien: "🍳", nuong: "🔥", goi_nom: "🥗", com_bun_pho: "🍜",
  trang_miet: "🍑", khac: "🍽️",
};

function dishIcon(dish: Dish): string {
  if (dish.nhomMon && NHOM_ICON[dish.nhomMon]) return NHOM_ICON[dish.nhomMon];
  if (dish.chayMan === "chay") return "🌿";
  return "🍽️";
}

interface MenuSlot {
  date: string;           // YYYY-MM-DD
  meal_slot: "sang" | "trua" | "toi" | "phu";
  dishes: Dish[];
  kcal_total: number;
}

interface WeeklyMenu {
  slots: MenuSlot[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MEAL_ORDER: MenuSlot["meal_slot"][] = ["sang", "trua", "toi", "phu"];
const MEAL_LABELS: Record<MenuSlot["meal_slot"], string> = {
  sang: "Sáng",
  trua: "Trưa",
  toi: "Tối",
  phu: "Phụ",
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkeletonSlot() {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 animate-pulse">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1" />
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
    </div>
  );
}

function SkeletonDay() {
  return (
    <div className="min-w-[160px] flex-1">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3 animate-pulse" />
      <div className="flex flex-col gap-2">
        <SkeletonSlot />
        <SkeletonSlot />
        <SkeletonSlot />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slot card
// ---------------------------------------------------------------------------

interface SlotCardProps {
  slot: MenuSlot;
  locked: boolean;
  onSwap: (dishIndex: number, dishName: string) => void;
  onToggleLock: () => void;
  onDishClick: (dishId: string) => void;
}

function SlotCard({ slot, locked, onSwap, onToggleLock, onDishClick }: SlotCardProps) {
  return (
    <div className={cn(
      "rounded-xl border bg-white dark:bg-gray-900 p-3 group transition-colors",
      locked
        ? "border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-950/20"
        : "border-gray-100 dark:border-gray-800"
    )}>
      <div className="flex items-center justify-end mb-1.5">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">{Math.round(slot.kcal_total)} kcal</span>
          <button
            onClick={onToggleLock}
            className={cn(
              "text-sm transition-opacity",
              locked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            title={locked ? "Bỏ khoá bữa này" : "Khoá bữa này (giữ nguyên khi tạo lại)"}
          >
            {locked ? "🔒" : "🔓"}
          </button>
        </div>
      </div>

      <ul className="space-y-0.5 mb-2">
        {slot.dishes.map((dish, i) => (
          <li key={i} className="flex items-center justify-between gap-1">
            <button
              onClick={() => dish.id && onDishClick(dish.id)}
              className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug text-left hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5 min-w-0"
              title="Xem chi tiết món ăn"
            >
              <span className="text-base shrink-0">{dishIcon(dish)}</span>
              <span className="truncate">{dish.ten}</span>
            </button>
            {!locked && (
              <button
                onClick={() => onSwap(i, dish.ten)}
                className="shrink-0 text-[10px] text-gray-300 hover:text-brand-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Đổi món này"
              >
                🔄
              </button>
            )}
          </li>
        ))}
      </ul>

      {!locked && (
        <button
          onClick={() => slot.dishes[0] && onSwap(0, slot.dishes[0].ten)}
          className="w-full text-xs text-gray-400 hover:text-brand-600 border border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-400 rounded-lg py-1 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          Đổi bữa
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day column
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function MenuPage() {
  const router = useRouter();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<WeeklyMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0); // mobile nav
  const [swapState, setSwapState] = useState<{
    date: string; mealSlot: "sang" | "trua" | "toi" | "phu"; dishIndex: number; dishName: string;
  } | null>(null);
  const [lockedSlots, setLockedSlots] = useState<Set<string>>(new Set());
  const [detailDish, setDetailDish] = useState<(typeof DISHES)[0] | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(getWeekStart());
  const [selectedVung, setSelectedVung] = useState<"all" | "bac" | "trung" | "nam">("all");

  const weekStart = currentWeekStart;
  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Today index
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayIndex = dates.indexOf(todayStr);

  useEffect(() => {
    const id = localStorage.getItem("family_id");
    if (!id) { router.push("/"); return; }
    setFamilyId(id);
    // Set active day to today if in current week
    const todayInWeek = dates.indexOf(new Date().toISOString().slice(0, 10));
    if (todayInWeek !== -1) setActiveDayIndex(todayInWeek);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadMenu = useCallback(async (id: string, week?: string) => {
    setLoading(true);
    setError(null);
    try {
      const weekParam = week ?? currentWeekStart;
      const res = await fetch(`/api/menu?id=${id}&week=${weekParam}`);
      if (res.ok) {
        const data: WeeklyMenuData = await res.json();
        setMenuData(data);
      } else if (res.status === 404) {
        setMenuData(null);
      } else {
        setError("Không thể tải thực đơn. Vui lòng thử lại.");
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart]);

  useEffect(() => {
    if (familyId) loadMenu(familyId);
  }, [familyId, loadMenu]);

  function navigateWeek(direction: -1 | 1) {
    const current = new Date(currentWeekStart + "T00:00:00");
    current.setDate(current.getDate() + direction * 7);
    const newWeek = current.toISOString().slice(0, 10);
    setCurrentWeekStart(newWeek);
    setMenuData(null);
    setActiveDayIndex(0);
    if (familyId) loadMenu(familyId, newWeek);
  }

  async function handleGenerate() {
    if (!familyId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_id: familyId,
          week_start: currentWeekStart,
          prefer_vung: selectedVung === "all" ? ["bac", "trung", "nam"] : [selectedVung],
        }),
      });
      if (res.ok) {
        const data: WeeklyMenuData = await res.json();
        setMenuData(data);
      } else {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? "Tạo thực đơn thất bại.");
      }
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setGenerating(false);
    }
  }

  // Normalise menu_data into WeeklyMenu shape
  const weeklyMenu: WeeklyMenu | null = (() => {
    if (!menuData?.menu_data) return null;
    const raw = menuData.menu_data as { slots?: MenuSlot[] } | MenuSlot[];
    if (Array.isArray(raw)) return { slots: raw };
    if (raw.slots) return raw as WeeklyMenu;
    return null;
  })();

  const getSlots = (dateStr: string): MenuSlot[] =>
    weeklyMenu?.slots.filter((s) => s.date === dateStr) ?? [];

  // Kcal summary across days
  const dailyKcal = dates.map((d) => {
    const slots = getSlots(d);
    return slots.reduce((sum, s) => sum + (s.kcal_total ?? 0), 0);
  });

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function renderEmptyState() {
    const fmtShort = (d: string) => {
      const dt = new Date(d + "T00:00:00");
      return `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")}`;
    };
    const end = addDays(weekStart, 6);
    const endDt = new Date(end + "T00:00:00");
    const weekLabel = `tuần ${fmtShort(weekStart)} – ${fmtShort(end)}/${endDt.getFullYear()}`;

    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🍽️</div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Chưa có thực đơn tuần này
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
          Chưa có thực đơn cho {weekLabel}. Tạo thực đơn tự động 7 ngày × 3 bữa được tính toán theo nhu cầu dinh dưỡng của gia đình bạn.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary text-base px-8 py-3 disabled:opacity-60"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang tạo thực đơn...
            </span>
          ) : (
            "Tạo thực đơn tuần này"
          )}
        </button>
      </div>
    );
  }

  function renderSkeleton() {
    return (
      <div className="hidden md:flex gap-3 overflow-x-auto pb-4">
        {dates.map((d) => <SkeletonDay key={d} />)}
      </div>
    );
  }

  function handleDishClick(dishId: string) {
    const dish = DISHES.find((d) => d.id === dishId);
    if (dish) setDetailDish(dish);
  }

  function handleOpenSwap(date: string, slot: MenuSlot, dishIndex: number, dishName: string) {
    setSwapState({ date, mealSlot: slot.meal_slot, dishIndex, dishName });
  }

  async function handleToggleLock(date: string, mealSlot: string) {
    if (!familyId || !menuData) return;
    const key = `${date}:${mealSlot}`;
    const isLocked = lockedSlots.has(key);
    const slot = weeklyMenu?.slots.find((s) => s.date === date && s.meal_slot === mealSlot);
    const dishId = slot?.dishes?.[0]?.id ?? "";
    try {
      await fetch("/api/menu/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_id: familyId,
          date,
          meal_slot: mealSlot,
          dish_id: dishId,
          action: isLocked ? "unlock" : "lock",
        }),
      });
      setLockedSlots((prev) => {
        const next = new Set(prev);
        if (isLocked) { next.delete(key); } else { next.add(key); }
        return next;
      });
    } catch { /* silent */ }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleSwapped(_newDish: unknown) {
    // Reload menu from server to get updated data
    if (familyId) loadMenu(familyId);
    setSwapState(null);
  }

  const MEAL_ICONS: Record<string, string> = { sang: "🌅", trua: "☀️", toi: "🌙", phu: "🍎" };
  const DAY_COLORS = [
    "border-t-rose-400",    // T2
    "border-t-orange-400",  // T3
    "border-t-amber-400",   // T4
    "border-t-green-400",   // T5
    "border-t-teal-400",    // T6
    "border-t-blue-400",    // T7
    "border-t-purple-400",  // CN
  ];

  function renderDesktopGrid() {
    return (
      // Trello-style: horizontal scroll, each day = fixed-width column
      <div className="hidden md:flex gap-3 overflow-x-auto pb-4 items-start">
        {dates.map((d, i) => {
          const dt = new Date(d + "T00:00:00");
          const isToday = i === todayIndex;
          const daySlots = getSlots(d);
          const dayKcal = daySlots.reduce((s, sl) => s + sl.kcal_total, 0);
          const hasPhu = daySlots.some((s) => s.meal_slot === "phu");
          const mealOrder = hasPhu
            ? (["sang", "trua", "toi", "phu"] as const)
            : (["sang", "trua", "toi"] as const);

          return (
            <div
              key={d}
              className={cn(
                "shrink-0 w-52 flex flex-col rounded-2xl border-t-4 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 overflow-hidden",
                isToday
                  ? "border-t-brand-500 ring-2 ring-brand-200 dark:ring-brand-800"
                  : DAY_COLORS[i]
              )}
            >
              {/* Column header */}
              <div className={cn(
                "px-3 py-2.5 flex items-center justify-between",
                isToday ? "bg-brand-50 dark:bg-brand-950/30" : "bg-white dark:bg-gray-900"
              )}>
                <div>
                  <div className={cn("text-xs font-bold uppercase tracking-wide", isToday ? "text-brand-600" : "text-gray-500 dark:text-gray-400")}>
                    {getWeekdayVi(d)}
                  </div>
                  <div className={cn("text-lg font-bold leading-none", isToday ? "text-brand-700 dark:text-brand-300" : "text-gray-800 dark:text-gray-100")}>
                    {dt.getDate()}/{dt.getMonth() + 1}
                  </div>
                </div>
                <div className="text-right">
                  {isToday && (
                    <span className="text-[10px] bg-brand-500 text-white rounded-full px-1.5 py-0.5 block mb-0.5">Hôm nay</span>
                  )}
                  {dayKcal > 0 && (
                    <span className="text-[10px] text-gray-400">{Math.round(dayKcal).toLocaleString()} kcal</span>
                  )}
                </div>
              </div>

              {/* Meal cards stacked vertically — Trello card style */}
              <div className="flex flex-col gap-2 p-2">
                {mealOrder.map((mealSlot) => {
                  const slot = daySlots.find((s) => s.meal_slot === mealSlot);
                  const lockKey = `${d}:${mealSlot}`;
                  const locked = lockedSlots.has(lockKey);

                  if (!slot) {
                    return (
                      <div key={mealSlot} className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-2 flex items-center gap-1.5">
                        <span className="text-base opacity-30">{MEAL_ICONS[mealSlot]}</span>
                        <span className="text-xs text-gray-300 dark:text-gray-600">{MEAL_LABELS[mealSlot]}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={mealSlot}
                      className={cn(
                        "rounded-xl border bg-white dark:bg-gray-900 p-2.5 shadow-sm group",
                        locked
                          ? "border-brand-300 dark:border-brand-700"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all"
                      )}
                    >
                      {/* Card header: meal icon + kcal + lock */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{MEAL_ICONS[mealSlot]}</span>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{MEAL_LABELS[mealSlot]}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-300">{Math.round(slot.kcal_total)} kcal</span>
                          <button
                            onClick={() => handleToggleLock(d, mealSlot)}
                            className={cn("text-xs transition-opacity", locked ? "opacity-100" : "opacity-0 group-hover:opacity-60")}
                            title={locked ? "Bỏ khoá" : "Khoá bữa này"}
                          >
                            {locked ? "🔒" : "🔓"}
                          </button>
                        </div>
                      </div>

                      {/* Dish list — dùng div thay button ngoài để tránh nested button */}
                      <ul className="space-y-0.5">
                        {slot.dishes.map((dish, idx) => (
                          <li key={idx} className="flex items-center gap-1 group/dish">
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => dish.id && handleDishClick(dish.id)}
                              onKeyDown={(e) => e.key === "Enter" && dish.id && handleDishClick(dish.id)}
                              className="flex-1 flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-gray-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors leading-snug cursor-pointer min-w-0"
                              title="Xem chi tiết"
                            >
                              <span className="text-base shrink-0">{dishIcon(dish)}</span>
                              <span className="truncate">{dish.ten}</span>
                            </span>
                            {!locked && (
                              <button
                                onClick={() => handleOpenSwap(d, slot, idx, dish.ten)}
                                className="shrink-0 text-[10px] text-gray-300 hover:text-brand-500 opacity-0 group-hover/dish:opacity-100 transition-opacity"
                                title="Đổi món"
                              >
                                🔄
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>

                      {/* Swap bữa button */}
                      {!locked && (
                        <button
                          onClick={() => slot.dishes[0] && handleOpenSwap(d, slot, 0, slot.dishes[0].ten)}
                          className="mt-1.5 w-full text-[10px] text-gray-400 hover:text-brand-600 border border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-400 rounded-lg py-1 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          + Đổi bữa
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderMobileView() {
    const dateStr = dates[activeDayIndex];
    const slots = getSlots(dateStr);

    return (
      <div className="md:hidden">
        {/* Day navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setActiveDayIndex((p) => Math.max(0, p - 1))}
            disabled={activeDayIndex === 0}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            ← Trước
          </button>

          <div className="text-center">
            <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {getWeekdayVi(dateStr)}
            </div>
            <div className="text-xs text-gray-500">{formatDateVi(dateStr).split(", ")[1]}</div>
            {activeDayIndex === todayIndex && (
              <span className="inline-block mt-0.5 text-[10px] bg-brand-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                Hôm nay
              </span>
            )}
          </div>

          <button
            onClick={() => setActiveDayIndex((p) => Math.min(6, p + 1))}
            disabled={activeDayIndex === 6}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Sau →
          </button>
        </div>

        {/* Day indicator dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {dates.map((d, i) => (
            <button
              key={d}
              onClick={() => setActiveDayIndex(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === activeDayIndex
                  ? "bg-brand-500 w-4"
                  : i === todayIndex
                  ? "bg-brand-200"
                  : "bg-gray-200 dark:bg-gray-700"
              )}
            />
          ))}
        </div>

        {/* Slots for active day */}
        <div className="flex flex-col gap-3">
          {MEAL_ORDER.filter((m) => {
            if (m === "phu") return slots.some((s) => s.meal_slot === "phu");
            return true;
          }).map((m) => {
            const slot = slots.find((s) => s.meal_slot === m);
            return slot ? (
              <SlotCard
                key={m}
                slot={slot}
                locked={lockedSlots.has(`${dateStr}:${m}`)}
                onSwap={(idx, name) => handleOpenSwap(dateStr, slot, idx, name)}
                onToggleLock={() => handleToggleLock(dateStr, m)}
                onDishClick={handleDishClick}
              />
            ) : (
              <div
                key={m}
                className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center"
              >
                <span className="text-sm text-gray-400">
                  {MEAL_LABELS[m]} — chưa có
                </span>
              </div>
            );
          })}
        </div>

        {/* Day kcal */}
        {dailyKcal[activeDayIndex] > 0 && (
          <div className="mt-3 text-center text-xs text-gray-400">
            Tổng ngày: <span className="font-semibold text-gray-600 dark:text-gray-300">{Math.round(dailyKcal[activeDayIndex]).toLocaleString()} kcal</span>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex max-w-7xl mx-auto">
        <SideNav />
        <main className="flex-1 p-4 pb-24 md:pb-4 min-w-0">

          {/* Region filter */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">Vùng miền:</span>
            {(["all", "bac", "trung", "nam"] as const).map((v) => {
              const labels = { all: "🇻🇳 Tất cả", bac: "🏔️ Miền Bắc", trung: "🌊 Miền Trung", nam: "🌴 Miền Nam" };
              return (
                <button
                  key={v}
                  onClick={() => setSelectedVung(v)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    selectedVung === v
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-brand-400"
                  )}
                >
                  {labels[v]}
                </button>
              );
            })}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Thực đơn tuần</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {(() => {
                  const fmtShort = (d: string) => {
                    const dt = new Date(d + "T00:00:00");
                    return `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")}`;
                  };
                  const end = addDays(weekStart, 6);
                  const endDt = new Date(end + "T00:00:00");
                  return `Tuần ${fmtShort(weekStart)} – ${fmtShort(end)}/${endDt.getFullYear()}`;
                })()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Week navigation */}
              <button
                onClick={() => navigateWeek(-1)}
                disabled={loading}
                className="btn-secondary text-sm disabled:opacity-40 flex items-center gap-1"
              >
                ← Tuần trước
              </button>
              <button
                onClick={() => navigateWeek(1)}
                disabled={loading}
                className="btn-secondary text-sm disabled:opacity-40 flex items-center gap-1"
              >
                Tuần sau →
              </button>

              {weeklyMenu && (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-secondary text-sm disabled:opacity-60 flex items-center gap-1.5"
                >
                  {generating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo lại"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3">
              {error}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <>
              {renderSkeleton()}
              {/* Mobile skeleton */}
              <div className="md:hidden flex flex-col gap-3">
                <SkeletonSlot />
                <SkeletonSlot />
                <SkeletonSlot />
              </div>
            </>
          ) : !weeklyMenu ? (
            renderEmptyState()
          ) : (
            <>
              {renderDesktopGrid()}
              {renderMobileView()}

              {/* Weekly kcal summary strip */}
              <div className="hidden md:flex mt-4 gap-3">
                {dates.map((d, i) => (
                  <div key={d} className="flex-1 min-w-[148px] text-center">
                    <div
                      className={cn(
                        "text-xs",
                        i === todayIndex ? "text-brand-600 font-semibold" : "text-gray-400"
                      )}
                    >
                      {dailyKcal[i] > 0 ? `${Math.round(dailyKcal[i]).toLocaleString()} kcal` : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
      <BottomNav />
      <DishDetailModal
        open={!!detailDish}
        onClose={() => setDetailDish(null)}
        dish={detailDish}
      />
      {swapState && familyId && menuData && (
        <SwapDishModal
          open={!!swapState}
          onClose={() => setSwapState(null)}
          familyId={familyId}
          weekStart={menuData.week_start}
          date={swapState.date}
          mealSlot={swapState.mealSlot}
          dishIndex={swapState.dishIndex}
          currentDishName={swapState.dishName}
          onSwapped={handleSwapped}
        />
      )}
    </div>
  );
}
