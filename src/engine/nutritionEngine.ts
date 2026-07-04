/**
 * nutritionEngine.ts
 * Lớp 2: Engine thuần thuật toán (KHÔNG phải AI) — nhận IntentParserOutput
 * đã validate, áp dụng thay đổi vào dữ liệu gia đình, tính lại dinh dưỡng
 * theo bảng RDA Việt Nam 2016, và trả về EngineDiffOutput.
 *
 * File này minh hoạ luồng xử lý cho intent "add_restriction" (ví dụ dị ứng
 * tôm) — các intent khác (adjust_energy_goal, add_temporary_guest,...) áp
 * dụng cùng một khung xử lý, chỉ khác bước 2 (áp dụng ràng buộc) và bước 4
 * (chọn món thay thế).
 */

import type {
  IntentParserOutput,
  EngineDiffOutput,
  MenuChange,
  NutritionWarning,
} from "../types/schemas";

// ---- Các kiểu dữ liệu nội bộ (rút gọn, thực tế map từ bảng DB) ----

interface Dish {
  id: string;
  name: string;
  mealSlot: "sang" | "trua" | "toi" | "phu";
  ingredients: string[]; // danh sách nguyên liệu, dùng để check ràng buộc dị ứng
  nutritionPerServing: NutrientMap;
  region?: "bac" | "trung" | "nam";
}

type NutrientMap = Record<string, number>; // vd { kcal: 350, protein_g: 20, canxi_mg: 80 }

interface FamilyMember {
  id: string;
  name: string;
  age: number;
  restrictions: string[]; // danh sách nguyên liệu bị loại trừ
  dailyTargets: NutrientMap; // nhu cầu khuyến nghị/ngày, tính sẵn theo bảng RDA (mục 3 trong plan)
}

interface WeeklyMenuEntry {
  date: string;
  mealSlot: "sang" | "trua" | "toi" | "phu";
  memberIds: string[]; // thành viên ăn bữa này
  dish: Dish;
}

interface EngineDeps {
  // Các hàm truy vấn dữ liệu — trong thực tế gọi vào DB (Postgres/Supabase)
  getFamilyMembers: (familyId: string) => Promise<FamilyMember[]>;
  getWeeklyMenu: (familyId: string) => Promise<WeeklyMenuEntry[]>;
  findAlternativeDish: (params: {
    mealSlot: Dish["mealSlot"];
    excludeIngredients: string[];
    similarTo: Dish; // ưu tiên món cùng nhóm (VD cùng là món canh) để giữ cấu trúc bữa ăn
  }) => Promise<Dish | null>;
  saveWeeklyMenu: (familyId: string, menu: WeeklyMenuEntry[]) => Promise<void>;
}

// Bảng % giới hạn cảnh báo (ví dụ đơn giản hoá — thực tế nên tách file config riêng
// theo từng vi chất và nhóm tuổi, tham chiếu bảng RDA 2016 mục 3 trong plan)
const WARNING_THRESHOLD_LOW = 0.9; // dưới 90% mục tiêu tuần -> cảnh báo thiếu
const WARNING_THRESHOLD_HIGH = 1.5; // trên 150% mục tiêu tuần -> cảnh báo dư thừa

function sumNutrition(entries: WeeklyMenuEntry[]): NutrientMap {
  const total: NutrientMap = {};
  for (const entry of entries) {
    for (const [key, value] of Object.entries(entry.dish.nutritionPerServing)) {
      total[key] = (total[key] ?? 0) + value * entry.memberIds.length;
    }
  }
  return total;
}

function buildWarnings(
  after: NutrientMap,
  weeklyTargets: NutrientMap
): NutritionWarning[] {
  const warnings: NutritionWarning[] = [];
  for (const [nutrient, target] of Object.entries(weeklyTargets)) {
    const actual = after[nutrient] ?? 0;
    const percent = target > 0 ? Math.round((actual / target) * 100) : 0;
    if (percent < WARNING_THRESHOLD_LOW * 100) {
      warnings.push({
        nutrient,
        status: "thieu",
        percent_of_target: percent,
        suggestion: suggestionForLowNutrient(nutrient),
      });
    } else if (percent > WARNING_THRESHOLD_HIGH * 100) {
      warnings.push({
        nutrient,
        status: "du_thua",
        percent_of_target: percent,
        suggestion: suggestionForHighNutrient(nutrient),
      });
    }
  }
  return warnings;
}

// Gợi ý khắc phục đơn giản theo từng vi chất — nên mở rộng dựa trên bảng
// thành phần thực phẩm Việt Nam khi triển khai thật.
function suggestionForLowNutrient(nutrient: string): string {
  const table: Record<string, string> = {
    canxi_mg: "Bổ sung thêm sữa, phô mai, hoặc rau lá xanh đậm như rau cải, mồng tơi",
    sat_mg: "Tăng cường thịt đỏ, gan, hoặc rau bina kết hợp vitamin C để hấp thu tốt hơn",
    vitaminC_mg: "Thêm trái cây tráng miệng (cam, ổi, đu đủ) vào bữa ăn",
  };
  return table[nutrient] ?? "Nên đa dạng thêm thực phẩm giàu chất này trong tuần";
}

function suggestionForHighNutrient(nutrient: string): string {
  const table: Record<string, string> = {
    natri_mg: "Giảm bớt lượng muối/nước mắm khi nêm nếm, hạn chế đồ kho mặn",
  };
  return table[nutrient] ?? "Nên giảm bớt thực phẩm giàu chất này trong vài ngày tới";
}

/**
 * Xử lý intent "add_restriction": loại 1 nguyên liệu khỏi thực đơn của 1
 * thành viên, tìm món thay thế phù hợp, tính lại dinh dưỡng tuần, trả về diff.
 */
export async function handleAddRestriction(
  familyId: string,
  intent: Extract<IntentParserOutput, { intent: "add_restriction" }> | IntentParserOutput,
  deps: EngineDeps
): Promise<EngineDiffOutput> {
  const { target_member, params, severity_flag } = intent;
  const ingredientToExclude = params.ingredient_or_dish as string;

  if (!target_member) {
    return rejectedResult("Không xác định được thành viên cần áp dụng ràng buộc.");
  }

  const members = await deps.getFamilyMembers(familyId);
  const member = members.find((m) => m.id === target_member);
  if (!member) {
    return rejectedResult(`Không tìm thấy thành viên có id "${target_member}".`);
  }

  const menuBefore = await deps.getWeeklyMenu(familyId);
  const before = sumNutrition(menuBefore);

  const changes: MenuChange[] = [];
  const menuAfter: WeeklyMenuEntry[] = [];

  for (const entry of menuBefore) {
    const affectsMember = entry.memberIds.includes(target_member);
    const dishContainsIngredient = entry.dish.ingredients.some((ing) =>
      ing.toLowerCase().includes(ingredientToExclude.toLowerCase())
    );

    if (affectsMember && dishContainsIngredient) {
      const alternative = await deps.findAlternativeDish({
        mealSlot: entry.mealSlot,
        excludeIngredients: [...member.restrictions, ingredientToExclude],
        similarTo: entry.dish,
      });

      if (alternative) {
        changes.push({
          date: entry.date,
          meal_slot: entry.mealSlot,
          member_affected: target_member,
          old_dish: entry.dish.name,
          new_dish: alternative.name,
          change_type: "replaced",
        });
        menuAfter.push({ ...entry, dish: alternative });
      } else {
        // Không tìm được món thay thế phù hợp -> giữ nguyên nhưng đánh dấu để
        // UI cảnh báo người dùng tự chọn món khác cho bữa này
        changes.push({
          date: entry.date,
          meal_slot: entry.mealSlot,
          member_affected: target_member,
          old_dish: entry.dish.name,
          new_dish: null,
          change_type: "removed",
        });
        menuAfter.push(entry);
      }
    } else {
      menuAfter.push(entry);
    }
  }

  await deps.saveWeeklyMenu(familyId, menuAfter);

  const after = sumNutrition(menuAfter);
  const weeklyTargets = scaleDailyToWeekly(member.dailyTargets);
  const warnings = buildWarnings(after, weeklyTargets);

  return {
    status: changes.length > 0 ? "applied" : "partial",
    reject_reason: null,
    changes,
    nutrition_impact: { before, after, warnings },
    severity_flag,
    professional_advice_note:
      severity_flag === "needs_professional_advice"
        ? "Đây là thay đổi liên quan sức khỏe, nên tham khảo bác sĩ/chuyên gia dinh dưỡng trước khi áp dụng lâu dài."
        : null,
  };
}

function scaleDailyToWeekly(daily: NutrientMap): NutrientMap {
  const weekly: NutrientMap = {};
  for (const [k, v] of Object.entries(daily)) weekly[k] = v * 7;
  return weekly;
}

function rejectedResult(reason: string): EngineDiffOutput {
  return {
    status: "rejected",
    reject_reason: reason,
    changes: [],
    nutrition_impact: { before: {}, after: {}, warnings: [] },
    severity_flag: "none",
    professional_advice_note: null,
  };
}

/**
 * Bộ điều phối chính — route theo intent.intent, gọi handler tương ứng.
 * Các handler khác (handleAdjustEnergyGoal, handleAddTemporaryGuest, ...)
 * viết theo cùng khung: đọc dữ liệu -> áp dụng thay đổi -> tính lại dinh
 * dưỡng -> trả EngineDiffOutput.
 */
export async function processIntent(
  familyId: string,
  intent: IntentParserOutput,
  deps: EngineDeps
): Promise<EngineDiffOutput> {
  switch (intent.intent) {
    case "add_restriction":
      return handleAddRestriction(familyId, intent, deps);
    // case "adjust_energy_goal": return handleAdjustEnergyGoal(familyId, intent, deps);
    // case "add_temporary_guest": return handleAddTemporaryGuest(familyId, intent, deps);
    // case "swap_specific_dish": return handleSwapSpecificDish(familyId, intent, deps);
    default:
      return rejectedResult(
        `Intent "${intent.intent}" chưa được hỗ trợ trong bản demo này.`
      );
  }
}
