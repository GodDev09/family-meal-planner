"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BottomNav, SideNav } from "@/components/ui/Nav";
import { addDays, getWeekStart } from "@/lib/utils";
import type { WeeklyMenuData } from "@/lib/store/familyStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Dish {
  ten: string;
  nguyenLieu?: string[];
}

interface MenuSlot {
  date: string;
  meal_slot: string;
  dishes: Dish[];
  kcal_total: number;
}

interface WeeklyMenu {
  slots: MenuSlot[];
}

interface Ingredient {
  name: string;          // normalised lower-case key
  displayName: string;   // original capitalisation from first appearance
  category: IngredientCategory;
  usedInDishes: string[]; // dish names that use this ingredient
}

type IngredientCategory = "rau_cu" | "thit_ca" | "gia_vi" | "khac";

// ---------------------------------------------------------------------------
// Category classification (keyword-based, Vietnamese)
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<IngredientCategory, string[]> = {
  rau_cu: [
    "rau", "cải", "cà", "bắp", "ngô", "khoai", "củ", "hành", "tỏi", "gừng",
    "sả", "ớt", "dưa", "bí", "mướp", "đậu bắp", "nấm", "măng", "giá",
    "rong biển", "cần tây", "cải thảo", "xà lách", "súp lơ", "bông cải",
    "atisô", "khổ qua", "mồng tơi", "rau muống", "rau ngót", "rau đay",
  ],
  thit_ca: [
    "thịt", "cá", "tôm", "cua", "mực", "ốc", "hàu", "nghêu",
    "gà", "vịt", "heo", "bò", "dê", "trứng", "lợn", "giò",
    "chả", "xúc xích", "ba chỉ", "sườn", "nạc", "phi lê",
  ],
  gia_vi: [
    "muối", "đường", "tiêu", "nước mắm", "dầu", "mỡ", "bơ",
    "nước tương", "tương", "miso", "giấm", "chanh", "me",
    "hồ tiêu", "quế", "hồi", "đinh hương", "bột", "bột nêm",
    "mì chính", "bột ngọt", "nước dừa", "cốt dừa", "kem",
    "sữa", "phô mai", "bột năng", "bột mì", "tinh bột",
  ],
  khac: [],
};

function classifyIngredient(name: string): IngredientCategory {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [IngredientCategory, string[]][]) {
    if (cat === "khac") continue;
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "khac";
}

const CATEGORY_META: Record<IngredientCategory, { label: string; icon: string; color: string }> = {
  rau_cu:  { label: "Rau củ",   icon: "🥦", color: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" },
  thit_ca: { label: "Thịt cá",  icon: "🥩", color: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" },
  gia_vi:  { label: "Gia vị",   icon: "🧂", color: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800" },
  khac:    { label: "Khác",     icon: "🛒", color: "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700" },
};

const CATEGORY_ORDER: IngredientCategory[] = ["thit_ca", "rau_cu", "gia_vi", "khac"];

const LS_KEY_PREFIX = "shopping_checked_";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseMenu(raw: unknown): WeeklyMenu | null {
  if (!raw) return null;
  const r = raw as { slots?: MenuSlot[] } | MenuSlot[];
  if (Array.isArray(r)) return { slots: r };
  if ((r as { slots?: MenuSlot[] }).slots) return r as WeeklyMenu;
  return null;
}

function aggregateIngredients(menu: WeeklyMenu): Ingredient[] {
  const map = new Map<string, Ingredient>();
  for (const slot of menu.slots) {
    for (const dish of slot.dishes) {
      const dishName = dish.ten ?? "Không rõ";
      for (const raw of dish.nguyenLieu ?? []) {
        const key = raw.trim().toLowerCase();
        if (!key) continue;
        if (map.has(key)) {
          const ing = map.get(key)!;
          if (!ing.usedInDishes.includes(dishName)) ing.usedInDishes.push(dishName);
        } else {
          map.set(key, {
            name: key,
            displayName: raw.trim(),
            category: classifyIngredient(raw),
            usedInDishes: [dishName],
          });
        }
      }
    }
  }
  return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ShoppingPage() {
  const router = useRouter();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<WeeklyMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [tooltip, setTooltip] = useState<string | null>(null); // ingredient name with open tooltip
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Load family_id + menu
  useEffect(() => {
    const id = localStorage.getItem("family_id");
    if (!id) { router.push("/"); return; }
    setFamilyId(id);

    // Load persisted checked state
    const stored = localStorage.getItem(LS_KEY_PREFIX + id);
    if (stored) {
      try { setChecked(new Set(JSON.parse(stored) as string[])); } catch { /* ignore */ }
    }

    fetch(`/api/menu?id=${id}`)
      .then((r) => r.ok ? r.json() : (r.status === 404 ? null : Promise.reject(r.statusText)))
      .then((data: WeeklyMenuData | null) => setMenuData(data))
      .catch(() => setError("Không thể tải thực đơn."))
      .finally(() => setLoading(false));
  }, [router]);

  // Persist checked to localStorage whenever it changes
  useEffect(() => {
    if (!familyId) return;
    localStorage.setItem(LS_KEY_PREFIX + familyId, JSON.stringify(Array.from(checked)));
  }, [checked, familyId]);

  const weeklyMenu = useMemo(() => parseMenu(menuData?.menu_data), [menuData]);
  const ingredients = useMemo(() => weeklyMenu ? aggregateIngredients(weeklyMenu) : [], [weeklyMenu]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<IngredientCategory, Ingredient[]> = {
      rau_cu: [], thit_ca: [], gia_vi: [], khac: [],
    };
    for (const ing of ingredients) groups[ing.category].push(ing);
    return groups;
  }, [ingredients]);

  const toggle = useCallback((key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const removeChecked = useCallback(() => {
    // "Xoá đã mua" means uncheck all (reset bought items so list is clean again)
    setChecked(new Set());
  }, []);

  // Week range — declared before buildListText which uses it in closure
  const weekStart = menuData?.week_start ?? getWeekStart();
  const weekEnd = addDays(weekStart, 6);
  const fmtDate = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    return `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")}`;
  };
  const weekLabel = `Tuần: ${fmtDate(weekStart)} - ${fmtDate(weekEnd)}`;

  const CATEGORY_ICONS_TXT: Record<IngredientCategory, string> = {
    thit_ca: "🥩 THỊT CÁ HẢI SẢN",
    rau_cu:  "🥬 RAU CỦ QUẢ",
    gia_vi:  "🧄 GIA VỊ",
    khac:    "📦 KHÁC",
  };

  const buildListText = useCallback(() => {
    const end = addDays(weekStart, 6);
    const endDt = new Date(end + "T00:00:00");
    const header = `DANH SÁCH ĐI CHỢ — Tuần ${fmtDate(weekStart)} - ${fmtDate(end)}/${endDt.getFullYear()}`;
    const separator = "=".repeat(header.length);
    const lines: string[] = [header, separator, ""];
    for (const cat of CATEGORY_ORDER) {
      const items = groupedByCategory[cat];
      if (!items.length) continue;
      lines.push(`${CATEGORY_ICONS_TXT[cat]}:`);
      for (const ing of items) {
        lines.push(`[ ] ${ing.displayName}`);
      }
      lines.push("");
    }
    return lines.join("\n").trimEnd();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedByCategory, weekStart, CATEGORY_ICONS_TXT]);

  const copyToClipboard = useCallback(async () => {
    if (!ingredients.length) return;
    const lines: string[] = [];
    for (const cat of CATEGORY_ORDER) {
      const items = groupedByCategory[cat];
      if (!items.length) continue;
      lines.push(`## ${CATEGORY_META[cat].label}`);
      for (const ing of items) {
        const mark = checked.has(ing.name) ? "[x]" : "[ ]";
        lines.push(`${mark} ${ing.displayName}`);
      }
      lines.push("");
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n").trim());
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch { /* clipboard denied */ }
  }, [ingredients, groupedByCategory, checked]);

  const downloadTxt = useCallback(() => {
    if (!ingredients.length) return;
    const text = buildListText();
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `danh-sach-di-cho-${weekStart}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [ingredients, buildListText, weekStart]);


  const checkedCount = checked.size;
  const totalCount = ingredients.length;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex max-w-4xl mx-auto">
          <SideNav />
          <main className="flex-1 p-4 pb-24 md:pb-4">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6 animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="card mb-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                  </div>
                ))}
              </div>
            ))}
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!weeklyMenu) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex max-w-4xl mx-auto">
          <SideNav />
          <main className="flex-1 p-4 pb-24 md:pb-4 flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Chưa có danh sách đi chợ
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
              Bạn cần tạo thực đơn tuần trước, sau đó danh sách nguyên liệu sẽ được tổng hợp tự động.
            </p>
            <a href="/menu" className="btn-primary inline-block">
              Tạo thực đơn tuần
            </a>
            {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex max-w-4xl mx-auto">
        <SideNav />
        <main className="flex-1 p-4 pb-24 md:pb-4">

          {/* Header */}
          <div className="flex items-start justify-between mb-4 gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Danh sách đi chợ</h1>
              <p className="text-xs text-gray-400 mt-0.5">{weekLabel}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={copyToClipboard}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                {copyFeedback ? "Đã sao chép!" : "Sao chép"}
              </button>
              <button
                onClick={downloadTxt}
                className="btn-secondary text-sm flex items-center gap-1.5"
                title="Tải danh sách về máy dạng .txt"
              >
                📥 Tải file .txt
              </button>
              {checkedCount > 0 && (
                <button
                  onClick={removeChecked}
                  className="text-sm text-red-500 hover:text-red-700 border border-red-200 dark:border-red-800 rounded-lg px-3 py-1.5 transition-colors hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Xoá đã mua
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Đã mua {checkedCount}/{totalCount} nguyên liệu</span>
                <span>{Math.round((checkedCount / totalCount) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Category groups */}
          {CATEGORY_ORDER.map((cat) => {
            const items = groupedByCategory[cat];
            if (!items.length) return null;
            const meta = CATEGORY_META[cat];
            return (
              <div
                key={cat}
                className={`rounded-xl border mb-4 overflow-hidden ${meta.color}`}
              >
                {/* Category header */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-inherit">
                  <span className="text-base">{meta.icon}</span>
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{meta.label}</h2>
                  <span className="ml-auto text-xs text-gray-400">
                    {items.filter((i) => checked.has(i.name)).length}/{items.length}
                  </span>
                </div>

                {/* Ingredient rows */}
                <ul>
                  {items.map((ing, idx) => {
                    const isDone = checked.has(ing.name);
                    const isTooltipOpen = tooltip === ing.name;
                    return (
                      <li
                        key={ing.name}
                        className={`flex items-center gap-3 px-4 py-3 ${idx < items.length - 1 ? "border-b border-inherit" : ""} transition-colors ${isDone ? "opacity-50" : ""}`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggle(ing.name)}
                          aria-label={isDone ? `Bỏ đánh dấu ${ing.displayName}` : `Đánh dấu đã mua ${ing.displayName}`}
                          className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${isDone ? "bg-brand-500 border-brand-500" : "border-gray-300 dark:border-gray-600 hover:border-brand-400"}`}
                        >
                          {isDone && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        {/* Name */}
                        <span
                          className={`flex-1 text-sm ${isDone ? "line-through text-gray-400 dark:text-gray-600" : "text-gray-800 dark:text-gray-100"}`}
                        >
                          {ing.displayName}
                        </span>

                        {/* Dishes tooltip trigger */}
                        {ing.usedInDishes.length > 0 && (
                          <div className="relative">
                            <button
                              onClick={() => setTooltip(isTooltipOpen ? null : ing.name)}
                              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              aria-label="Xem món dùng nguyên liệu này"
                            >
                              {ing.usedInDishes.length} món
                            </button>
                            {isTooltipOpen && (
                              <div className="absolute right-0 top-6 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3 w-56">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Dùng trong:</p>
                                <ul className="space-y-1">
                                  {ing.usedInDishes.map((d) => (
                                    <li key={d} className="text-xs text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                      <span className="w-1 h-1 rounded-full bg-brand-400 flex-shrink-0" />
                                      {d}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {ingredients.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Thực đơn chưa có nguyên liệu nào được liệt kê.</p>
            </div>
          )}
        </main>
      </div>

      {/* Close tooltip on outside click */}
      {tooltip && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setTooltip(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}
