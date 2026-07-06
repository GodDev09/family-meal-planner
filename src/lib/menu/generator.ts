import { type Dish } from "../data/dishes";
import { type FamilyNutritionReport } from "../nutrition/calculator";
import { addDays } from "../utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MenuSlot {
  date: string;
  meal_slot: "sang" | "trua" | "toi" | "phu";
  dishes: Dish[];
  kcal_total: number;
}

export interface WeeklyMenu {
  family_id: string;
  week_start: string;
  slots: MenuSlot[];
  nutrition_summary: {
    daily_avg_kcal: number;
    target_daily_kcal: number;
    vs_target_pct: number;
    protein_pct: number;
    lipid_pct: number;
    glucid_pct: number;
  };
}

export interface GeneratorOptions {
  week_start: string;
  family_id: string;
  nutritionReport: FamilyNutritionReport;
  restrictions: Record<string, string[]>;
  lockedDishes: Array<{ date: string; meal_slot: string; dish_id: string }>;
  preferVung?: Array<"bac" | "trung" | "nam">;
  hasYoungChildren: boolean;
  hasElderly: boolean;
  avoidDishIds?: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROTEIN_SOURCES: Record<string, string> = {
  "thịt heo": "heo",
  "thịt bò": "bo",
  "thịt gà": "ga",
  "tôm": "tom",
  "cá": "ca",
  "trứng": "trung",
  "đậu phụ": "dau",
  "mực": "ca",
  "cua": "ca",
  "lươn": "ca",
  "ếch": "be",
};

function getProteinSource(dish: Dish): string {
  const ing = dish.nguyenLieu.join(" ").toLowerCase();
  for (const [key, src] of Object.entries(PROTEIN_SOURCES)) {
    if (ing.includes(key)) return src;
  }
  return "khac";
}

function isSafeDish(dish: Dish, excludeIngredients: Set<string>): boolean {
  if (excludeIngredients.size === 0) return true;
  const ings = dish.nguyenLieu.join(" ").toLowerCase();
  for (const exc of excludeIngredients) {
    if (ings.includes(exc.toLowerCase())) return false;
  }
  return true;
}

function pickRandom<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

function preferredFirst(dishes: Dish[], preferVung?: Array<"bac" | "trung" | "nam">): Dish[] {
  if (!preferVung?.length) return dishes;
  const preferred = dishes.filter((d) => preferVung.includes(d.vung_mien as "bac" | "trung" | "nam"));
  return preferred.length > 0 ? preferred : dishes;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateWeeklyMenu(allDishes: Dish[], options: GeneratorOptions): WeeklyMenu {
  const { week_start, family_id, nutritionReport, restrictions, lockedDishes, preferVung, hasYoungChildren, hasElderly, avoidDishIds } = options;

  // Merge all restrictions
  const allExcluded = new Set<string>();
  for (const exc of Object.values(restrictions)) {
    for (const e of exc) allExcluded.add(e);
  }

  // Filter safe dishes
  const safeDishes = allDishes.filter((d) => isSafeDish(d, allExcluded));

  const targetDailyKcal = nutritionReport.family_total.kcal;
  const mealTargets = {
    sang: targetDailyKcal * 0.25,
    trua: targetDailyKcal * 0.35,
    toi: targetDailyKcal * 0.35,
    phu: targetDailyKcal * 0.05,
  };

  // Helper: prefer dishes not seen last week, fall back to full pool if needed
  const avoidSet = new Set(avoidDishIds ?? []);
  function withAvoidFallback(pool: Dish[]): Dish[] {
    if (!avoidSet.size) return pool;
    const filtered = pool.filter((d) => !avoidSet.has(d.id));
    return filtered.length > 0 ? filtered : pool;
  }

  // Pre-categorise dishes
  const breakfastDishes = withAvoidFallback(safeDishes.filter((d) => d.mealSlots.includes("sang")));
  const soupDishes = withAvoidFallback(safeDishes.filter(
    (d) => (d.mealSlots.includes("trua") || d.mealSlots.includes("toi")) && d.nhomMon === "canh"
  ));
  const mainDishes = withAvoidFallback(safeDishes.filter(
    (d) =>
      (d.mealSlots.includes("trua") || d.mealSlots.includes("toi")) &&
      ["xao", "kho", "luoc_hap", "chien", "nuong"].includes(d.nhomMon)
  ));
  const vegDishes = safeDishes.filter(
    (d) =>
      (d.mealSlots.includes("trua") || d.mealSlots.includes("toi")) &&
      d.chayMan === "chay" && d.nhomMon === "xao"
  );
  // Hoa quả / tráng miệng cho bữa trưa và tối
  const fruitDishes = withAvoidFallback(safeDishes.filter(
    (d) => d.mealSlots.includes("phu") && d.nhomMon === "trang_miet"
  ));
  const snackDishes = withAvoidFallback(safeDishes.filter((d) => d.mealSlots.includes("phu")));
  const needSnack = hasYoungChildren || hasElderly;

  const slots: MenuSlot[] = [];
  const usedDishIds = new Set<string>();
  const lastProteinSource: string[] = []; // rolling last 2 days

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const date = addDays(week_start, dayIdx);
    const todayProteinSources: string[] = [];

    // --- SÁNG ---
    const lockedSang = lockedDishes.find((l) => l.date === date && l.meal_slot === "sang");
    let sangDish: Dish | undefined;
    if (lockedSang) {
      sangDish = safeDishes.find((d) => d.id === lockedSang.dish_id);
    }
    if (!sangDish) {
      const pool = preferredFirst(
        breakfastDishes.filter((d) => !usedDishIds.has(d.id)),
        preferVung
      );
      sangDish = pickRandom(pool.length > 0 ? pool : breakfastDishes);
    }
    if (sangDish) {
      usedDishIds.add(sangDish.id);
      slots.push({
        date,
        meal_slot: "sang",
        dishes: [sangDish],
        kcal_total: sangDish.nutritionPerServing.kcal,
      });
    }

    // --- Helper for trua/toi ---
    function buildMainMeal(mealSlot: "trua" | "toi"): MenuSlot | null {
      const locked = lockedDishes.find((l) => l.date === date && l.meal_slot === mealSlot);
      if (locked) {
        const ld = safeDishes.find((d) => d.id === locked.dish_id);
        if (ld) return { date, meal_slot: mealSlot, dishes: [ld], kcal_total: ld.nutritionPerServing.kcal };
      }

      // Pick soup
      const soupPool = preferredFirst(soupDishes.filter((d) => !usedDishIds.has(d.id)), preferVung);
      const soup = pickRandom(soupPool.length > 0 ? soupPool : soupDishes);
      if (!soup) return null;

      // Pick main — prefer different protein from last 2 days
      let mainPool = mainDishes.filter(
        (d) => !usedDishIds.has(d.id) && !lastProteinSource.includes(getProteinSource(d))
      );
      if (!mainPool.length) mainPool = mainDishes.filter((d) => !usedDishIds.has(d.id));
      if (!mainPool.length) mainPool = mainDishes;
      const main = pickRandom(preferredFirst(mainPool, preferVung));
      if (!main) return null;

      const mealDishes: Dish[] = [soup, main];
      const proteinSrc = getProteinSource(main);
      if (!todayProteinSources.includes(proteinSrc)) todayProteinSources.push(proteinSrc);

      // Optionally add veg dish if kcal below 80% of target
      const currentKcal = soup.nutritionPerServing.kcal + main.nutritionPerServing.kcal;
      if (currentKcal < mealTargets[mealSlot] * 0.8 && vegDishes.length > 0) {
        const vegPool = vegDishes.filter((d) => !usedDishIds.has(d.id));
        const veg = pickRandom(vegPool.length > 0 ? vegPool : vegDishes);
        if (veg) mealDishes.push(veg);
      }

      // Luôn thêm hoa quả / tráng miệng vào bữa trưa và tối
      if (fruitDishes.length > 0) {
        const fruitPool = fruitDishes.filter((d) => !usedDishIds.has(d.id));
        const fruit = pickRandom(fruitPool.length > 0 ? fruitPool : fruitDishes);
        if (fruit) mealDishes.push(fruit);
      }

      for (const d of mealDishes) usedDishIds.add(d.id);
      return { date, meal_slot: mealSlot, dishes: mealDishes, kcal_total: mealDishes.reduce((s, d) => s + d.nutritionPerServing.kcal, 0) };
    }

    const trua = buildMainMeal("trua");
    const toi = buildMainMeal("toi");
    if (trua) slots.push(trua);
    if (toi) slots.push(toi);

    // Update rolling protein tracker
    for (const p of todayProteinSources) lastProteinSource.push(p);
    if (lastProteinSource.length > 4) lastProteinSource.splice(0, lastProteinSource.length - 4);

    // --- PHỤ ---
    if (needSnack) {
      const lockedPhu = lockedDishes.find((l) => l.date === date && l.meal_slot === "phu");
      let snack: Dish | undefined;
      if (lockedPhu) snack = safeDishes.find((d) => d.id === lockedPhu.dish_id);
      if (!snack) {
        const snackPool = snackDishes.filter((d) => !usedDishIds.has(d.id));
        snack = pickRandom(snackPool.length > 0 ? snackPool : snackDishes);
      }
      if (snack) {
        usedDishIds.add(snack.id);
        slots.push({ date, meal_slot: "phu", dishes: [snack], kcal_total: snack.nutritionPerServing.kcal });
      }
    }
  }

  // Nutrition summary
  const totalKcal = slots.reduce((s, sl) => s + sl.kcal_total, 0);
  const dailyAvgKcal = totalKcal / 7;
  const totalProteinKcal = slots.reduce((s, sl) => s + sl.dishes.reduce((ds, d) => ds + d.nutritionPerServing.protein_g * 4, 0), 0);
  const totalLipidKcal = slots.reduce((s, sl) => s + sl.dishes.reduce((ds, d) => ds + d.nutritionPerServing.lipid_g * 9, 0), 0);
  const totalGlucidKcal = slots.reduce((s, sl) => s + sl.dishes.reduce((ds, d) => ds + d.nutritionPerServing.glucid_g * 4, 0), 0);

  return {
    family_id,
    week_start,
    slots,
    nutrition_summary: {
      daily_avg_kcal: Math.round(dailyAvgKcal),
      target_daily_kcal: Math.round(targetDailyKcal),
      vs_target_pct: targetDailyKcal > 0 ? Math.round((dailyAvgKcal / targetDailyKcal) * 100) : 0,
      protein_pct: totalKcal > 0 ? Math.round((totalProteinKcal / totalKcal) * 100) : 0,
      lipid_pct: totalKcal > 0 ? Math.round((totalLipidKcal / totalKcal) * 100) : 0,
      glucid_pct: totalKcal > 0 ? Math.round((totalGlucidKcal / totalKcal) * 100) : 0,
    },
  };
}
