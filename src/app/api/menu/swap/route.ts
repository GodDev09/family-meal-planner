import { NextRequest, NextResponse } from "next/server";
import { getFamily, saveWeeklyMenu } from "@/lib/store/sqliteStore";
import { DISHES } from "@/lib/data/dishes";
import { isValidFamilyCode } from "@/lib/auth/familyCode";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { family_id, week_start, date, meal_slot, dish_index, exclude_dish_ids = [] } = body as {
    family_id: string;
    week_start: string;
    date: string;
    meal_slot: "sang" | "trua" | "toi" | "phu";
    dish_index: number;
    exclude_dish_ids?: string[];
  };

  if (!family_id || !isValidFamilyCode(family_id)) {
    return NextResponse.json({ error: "Invalid family_id" }, { status: 400 });
  }

  const family = getFamily(family_id);
  if (!family) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const menuRecord = family.weekly_menus.find((m) => m.week_start === week_start);
  if (!menuRecord) return NextResponse.json({ error: "Menu not found" }, { status: 404 });

  // Merge all family restrictions
  const allExcluded = new Set(family.members.flatMap((m) => m.di_ung));

  type RawSlot = { date: string; meal_slot: string; dishes: Array<{ id: string }> };
  // Get all dish IDs already in this week's menu
  const usedIds = new Set<string>();
  const slots = ((menuRecord.menu_data as { slots?: RawSlot[] })?.slots ?? []) as RawSlot[];
  for (const slot of slots) {
    for (const d of slot.dishes ?? []) usedIds.add(d.id);
  }

  // Find the current dish to know nhomMon
  const targetSlot = slots.find((s) => s.date === date && s.meal_slot === meal_slot);

  const currentDish = targetSlot?.dishes?.[dish_index];
  const currentNhomMon = currentDish
    ? DISHES.find((d) => d.id === currentDish.id)?.nhomMon
    : undefined;

  const excludeSet = new Set([...exclude_dish_ids, currentDish?.id ?? ""]);

  // Build candidate pool
  const isSafe = (d: (typeof DISHES)[0]) =>
    d.mealSlots.includes(meal_slot) &&
    !excludeSet.has(d.id) &&
    !usedIds.has(d.id) &&
    !d.nguyenLieu.some((ing) =>
      [...allExcluded].some((exc) => ing.toLowerCase().includes(exc.toLowerCase()))
    );

  const sameCat = DISHES.filter((d) => isSafe(d) && d.nhomMon === currentNhomMon);
  const anyCat = DISHES.filter(isSafe);
  const candidates = sameCat.length > 0 ? sameCat : anyCat;

  if (!candidates.length) {
    return NextResponse.json({ error: "Không tìm được món thay thế phù hợp" }, { status: 422 });
  }

  const newDish = candidates[Math.floor(Math.random() * candidates.length)];

  // Patch menu_data
  const updatedMenuData = JSON.parse(JSON.stringify(menuRecord.menu_data)) as {
    slots: Array<{ date: string; meal_slot: string; dishes: unknown[]; kcal_total: number }>;
  };

  for (const slot of updatedMenuData.slots) {
    if (slot.date === date && slot.meal_slot === meal_slot) {
      const dishes = slot.dishes as Array<{ id: string }>;
      if (dish_index >= 0 && dish_index < dishes.length) {
        dishes[dish_index] = newDish as unknown as { id: string };
        slot.kcal_total = dishes.reduce(
          (s, d) =>
            s + (DISHES.find((dish) => dish.id === (d as { id: string }).id)?.nutritionPerServing.kcal ?? 0),
          0
        );
      }
      break;
    }
  }

  const saved = saveWeeklyMenu(family_id, { week_start, menu_data: updatedMenuData });
  return NextResponse.json({ new_dish: newDish, updated_menu: saved });
}
