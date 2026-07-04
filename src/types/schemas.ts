/**
 * schemas.ts
 * Zod schemas dùng để validate dữ liệu trao đổi giữa:
 *  - AI Intent Parser (Lớp 1 chiều vào)  -> Engine tính toán (Lớp 2)
 *  - Engine tính toán (Lớp 2)            -> AI Response Composer (Lớp 1 chiều ra)
 *
 * Tương ứng với Phụ lục B.1 và B.2 trong docs/plan-website-goi-y-bua-an-gia-dinh.md
 * Luôn validate output của model bằng schema này trước khi tin tưởng dữ liệu,
 * vì model có thể trả sai định dạng dù đã ép bằng tool-use.
 */

import { z } from "zod";

// ---------- B.1: Intent Parser output (AI -> Engine) ----------

export const IntentEnum = z.enum([
  "add_restriction",
  "remove_restriction",
  "adjust_energy_goal",
  "add_temporary_guest",
  "mark_member_absent",
  "change_cuisine_style",
  "swap_specific_dish",
  "budget_constraint",
  "time_constraint",
  "health_condition_update",
  "general_question",
  "unclear",
]);
export type Intent = z.infer<typeof IntentEnum>;

export const SeverityFlagEnum = z.enum([
  "none",
  "needs_confirmation",
  "needs_professional_advice",
]);
export type SeverityFlag = z.infer<typeof SeverityFlagEnum>;

// params là union theo intent — dùng passthrough object vì mỗi intent có field khác nhau,
// nhưng validate chi tiết hơn qua các sub-schema bên dưới khi cần dùng.
export const AddRestrictionParams = z.object({
  restriction_type: z.enum(["di_ung", "khong_thich", "kieng_ton_giao", "kieng_benh_ly"]),
  ingredient_or_dish: z.string(),
  reason: z.string().optional(),
});

export const AdjustEnergyGoalParams = z.object({
  direction: z.enum(["increase", "decrease"]),
  amount_kcal_per_day: z.number().nullable(),
  duration: z.enum(["1_tuan", "vo_thoi_han", "toi_khi_huy"]),
});

export const AddTemporaryGuestParams = z.object({
  guest_count: z.number().int().min(1),
  guest_profile: z.enum(["nguoi_lon", "tre_em", "nguoi_gia", "khong_ro"]),
  affected_dates: z.array(z.string()), // ISO date string, validate format ở business logic
});

export const SwapSpecificDishParams = z.object({
  date: z.string(),
  meal_slot: z.enum(["sang", "trua", "toi", "phu"]),
  reason: z.string().optional(),
});

export const IntentParserOutputSchema = z.object({
  intent: IntentEnum,
  confidence: z.number().min(0).max(1),
  target_member: z.string().nullable(),
  // params để "unknown" ở tầng schema chung, cast/validate lại theo intent cụ thể
  // trong bước xử lý business logic (xem intentParser.ts -> parseParamsByIntent)
  params: z.record(z.unknown()).default({}),
  severity_flag: SeverityFlagEnum,
  clarification_question: z.string().nullable(),
});
export type IntentParserOutput = z.infer<typeof IntentParserOutputSchema>;

// ---------- B.2: Engine diff output (Engine -> Response Composer) ----------

export const MenuChangeSchema = z.object({
  date: z.string(),
  meal_slot: z.enum(["sang", "trua", "toi", "phu"]),
  member_affected: z.string(),
  old_dish: z.string().nullable(),
  new_dish: z.string().nullable(),
  change_type: z.enum(["replaced", "removed", "added", "portion_adjusted"]),
});
export type MenuChange = z.infer<typeof MenuChangeSchema>;

export const NutritionWarningSchema = z.object({
  nutrient: z.string(),
  status: z.enum(["thieu", "du_thua"]),
  percent_of_target: z.number(),
  suggestion: z.string(),
});
export type NutritionWarning = z.infer<typeof NutritionWarningSchema>;

export const NutritionSnapshotSchema = z.record(z.number());
// VD: { kcal_tuan: 15400, protein_g: 520, canxi_mg: 5600, ... }

export const EngineDiffOutputSchema = z.object({
  status: z.enum(["applied", "rejected", "partial"]),
  reject_reason: z.string().nullable(),
  changes: z.array(MenuChangeSchema),
  nutrition_impact: z.object({
    before: NutritionSnapshotSchema,
    after: NutritionSnapshotSchema,
    warnings: z.array(NutritionWarningSchema),
  }),
  severity_flag: SeverityFlagEnum,
  professional_advice_note: z.string().nullable(),
});
export type EngineDiffOutput = z.infer<typeof EngineDiffOutputSchema>;
