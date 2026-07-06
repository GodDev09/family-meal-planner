/**
 * chatOrchestrator.ts
 * Nối luồng: Intent Parser -> Engine -> Response Composer
 * Thay thế các `declare` stubs bằng store thật (familyStore).
 */

import { parseUserIntent, type FamilyContext } from "./intentParser";
import { processIntent } from "../engine/nutritionEngine";
import { composeResponse } from "./responseComposer";
import { getFamily, saveWeeklyMenu } from "../lib/store/sqliteStore";
import type { EngineDiffOutput } from "../types/schemas";

export interface ChatResult {
  response: string;
  needsConfirmation: boolean;
  changes: EngineDiffOutput | null;
}

export async function processChatMessage(
  familyId: string,
  userMessage: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  familyData: any
): Promise<ChatResult> {
  const family = familyData ?? getFamily(familyId);
  if (!family) throw new Error("Family not found");

  // Build context for intent parser (summary, not full data)
  const context: FamilyContext = {
    familyId,
    members: family.members.map((m: { id: string; ten: string; tuoi: number; di_ung: string[] }) => ({
      id: m.id,
      name: m.ten,
      age: m.tuoi,
      restrictions: m.di_ung,
    })),
    currentWeekMenuSummary: buildMenuSummary(family),
  };

  // Layer 1 inbound: AI parses natural language -> structured intent
  const intent = await parseUserIntent(userMessage, context);

  // Short-circuit: unclear intent or needs clarification
  if (intent.intent === "unclear" || intent.clarification_question) {
    return {
      response:
        intent.clarification_question ??
        "Mình chưa hiểu rõ ý bạn. Bạn có thể nói cụ thể hơn không?",
      needsConfirmation: false,
      changes: null,
    };
  }

  // Handle general_question without touching menu data
  if (intent.intent === "general_question") {
    const response = await composeResponse(userMessage, {
      status: "rejected",
      reject_reason: null,
      changes: [],
      nutrition_impact: { before: {}, after: {}, warnings: [] },
      severity_flag: "none",
      professional_advice_note: null,
    });
    return { response, needsConfirmation: false, changes: null };
  }

  // Layer 2: rule-based engine processes intent
  const latestMenu = family.weekly_menus[family.weekly_menus.length - 1]?.menu_data;

  const engineDeps = buildEngineDeps(familyId, latestMenu);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const diff = await processIntent(familyId, intent, engineDeps as any);

  // Layer 1 outbound: AI narrates technical diff in natural language
  const response = await composeResponse(userMessage, diff);

  return {
    response,
    needsConfirmation: diff.severity_flag !== "none",
    changes: diff,
  };
}

function buildMenuSummary(family: { weekly_menus: Array<{ week_start: string; menu_data: { slots?: Array<{ meal_slot: string; dishes: Array<{ ten: string }> }> } }> }): string {
  const latest = family.weekly_menus[family.weekly_menus.length - 1];
  if (!latest?.menu_data) return "Chưa có thực đơn nào được tạo.";
  const slots = latest.menu_data?.slots ?? [];
  const sample = slots.slice(0, 6).map((s: { meal_slot: string; dishes: Array<{ ten: string }> }) =>
    `${s.meal_slot}: ${s.dishes.map((d: { ten: string }) => d.ten).join(", ")}`
  );
  return `Tuần ${latest.week_start}. Mẫu: ${sample.join(" | ")}`;
}

// Build EngineDeps from in-memory store + current menu data
function buildEngineDeps(familyId: string, menuData: { slots?: Array<{
  date: string;
  mealSlot: string;
  memberIds: string[];
  dish: {
    id: string;
    name: string;
    mealSlot: string;
    ingredients: string[];
    nutritionPerServing: Record<string, number>;
  };
}> } | null) {
  return {
    async getFamilyMembers(fId: string) {
      const f = getFamily(fId);
      if (!f) return [];
      return f.members.map((m) => ({
        id: m.id,
        name: m.ten,
        age: m.tuoi,
        restrictions: m.di_ung,
        dailyTargets: {} as Record<string, number>,
      }));
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getWeeklyMenu(_familyId: string) {
      if (!menuData?.slots) return [];
      return menuData.slots.map((s) => ({
        date: s.date,
        mealSlot: s.mealSlot as "sang" | "trua" | "toi" | "phu",
        memberIds: s.memberIds,
        dish: {
          id: s.dish.id,
          name: s.dish.name,
          mealSlot: s.dish.mealSlot as "sang" | "trua" | "toi" | "phu",
          ingredients: s.dish.ingredients ?? [],
          nutritionPerServing: s.dish.nutritionPerServing ?? {},
        },
      }));
    },

    async findAlternativeDish(params: {
      mealSlot: string;
      excludeIngredients: string[];
      similarTo?: { nhomMon?: string };
    }) {
      // Lazy-load dishes to avoid circular dependency
      try {
        const { DISHES } = await import("../lib/data/dishes");
        const candidates = DISHES.filter(
          (d) =>
            d.mealSlots.includes(params.mealSlot as "sang" | "trua" | "toi" | "phu") &&
            !d.nguyenLieu.some((ing) =>
              params.excludeIngredients.some((exc) =>
                ing.toLowerCase().includes(exc.toLowerCase())
              )
            )
        );
        // Prefer same nhomMon as original dish
        const sameCat = params.similarTo?.nhomMon
          ? candidates.filter((d) => d.nhomMon === params.similarTo!.nhomMon)
          : [];
        const candidate = sameCat.length > 0
          ? sameCat[Math.floor(Math.random() * sameCat.length)]
          : candidates[Math.floor(Math.random() * candidates.length)];
        if (!candidate) return null;
        return {
          id: candidate.id,
          name: candidate.ten,
          mealSlot: params.mealSlot as "sang" | "trua" | "toi" | "phu",
          ingredients: candidate.nguyenLieu,
          nutritionPerServing: candidate.nutritionPerServing as Record<string, number>,
        };
      } catch {
        return null;
      }
    },

    async saveWeeklyMenu(fId: string, menu: unknown[]) {
      if (!menuData) return;
      saveWeeklyMenu(fId, {
        week_start: new Date().toISOString().slice(0, 10),
        menu_data: { ...menuData, slots: menu },
      });
    },
  };
}
