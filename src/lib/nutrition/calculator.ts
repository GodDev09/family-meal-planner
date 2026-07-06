/**
 * Nutrition calculator — pure functions, no DB calls.
 * All logic references Vietnamese RDA 2016 tables from rda2016.ts.
 */

import {
  PAL_FACTORS,
  ENERGY_RDA,
  MACRO_RATIOS,
  MICRONUTRIENT_RDA,
  SPECIAL_CONDITION_KCAL,
  SPECIAL_CONDITION_MICRO,
  STANDARD_WEIGHTS,
  KCAL_PER_G,
  type AgeGroupKey,
  type MicronutrientRDA,
} from './rda2016'

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface FamilyMemberInput {
  id: string
  ten: string
  /** Age in years. Use 0.5 for a 6-month infant, 0 for newborn. */
  tuoi: number
  gioi_tinh: 'nam' | 'nu'
  /** Actual body weight in kg. When omitted, standard weight for age/gender is used. */
  can_nang_kg?: number
  /** Key into PAL_FACTORS (e.g. "van_phong", "trung_binh", "nang") */
  nghe_nghiep_pal: string
  tinh_trang_dac_biet?:
    | 'mang_thai_1'
    | 'mang_thai_2'
    | 'mang_thai_3'
    | 'cho_con_bu'
    | null
}

export interface DailyNutritionTarget {
  memberId: string
  kcal: number
  protein_g: number
  lipid_g: number
  glucid_g: number
  // micronutrients
  canxi_mg: number
  sat_mg: number
  kem_mg: number
  iod_mcg: number
  selen_mcg: number
  vitA_mcg: number
  vitD_mcg: number
  vitE_mg: number
  vitC_mg: number
  vitB1_mg: number
  vitB2_mg: number
  vitB6_mg: number
  vitB12_mcg: number
  folat_mcg: number
  natri_mg_max: number
  chat_xo_g: number
}

export interface FamilyNutritionReport {
  members: DailyNutritionTarget[]
  /** Element-wise sum of all member targets */
  family_total: DailyNutritionTarget
  /** ISO 8601 timestamp of report generation */
  generated_at: string
}

// ---------------------------------------------------------------------------
// Internal: Mifflin-St Jeor BMR
// ---------------------------------------------------------------------------

/**
 * Mifflin-St Jeor BMR (kcal/day).
 * Used only for adult age groups (18+) when actual weight is supplied.
 */
function mifflinStJeorBMR(
  weight_kg: number,
  height_cm: number,
  age_years: number,
  gioi_tinh: 'nam' | 'nu',
): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age_years
  return gioi_tinh === 'nam' ? base + 5 : base - 161
}

// ---------------------------------------------------------------------------
// Exported helper: age → AgeGroupKey
// ---------------------------------------------------------------------------

/**
 * Maps a fractional age (years) to the age-group key used in RDA tables.
 *
 * Examples:
 *   0.0  → "0-6m"
 *   0.5  → "6-12m"
 *   1    → "1-3"
 *   10   → "10-12"
 *   65   → "60+"
 */
export function getAgeGroup(tuoi: number): AgeGroupKey {
  if (tuoi < 0.5)  return '0-6m'
  if (tuoi < 1)    return '6-12m'
  if (tuoi < 4)    return '1-3'
  if (tuoi < 7)    return '4-6'
  if (tuoi < 10)   return '7-9'
  if (tuoi < 13)   return '10-12'
  if (tuoi < 16)   return '13-15'
  if (tuoi < 18)   return '16-18'
  if (tuoi < 31)   return '18-30'
  if (tuoi < 51)   return '31-50'
  if (tuoi < 61)   return '51-60'
  return '60+'
}

// ---------------------------------------------------------------------------
// Core: calculate a single member's daily nutrition target
// ---------------------------------------------------------------------------

/**
 * Returns the daily nutrition target for one family member.
 *
 * Algorithm:
 * 1. Resolve age group.
 * 2. Determine BMR:
 *    - Infants (0–12m) / young children: use fixed ENERGY_RDA[gender][group].kcal (PAL not applied).
 *    - Older children & adults with actual weight: use Mifflin-St Jeor × PAL.
 *    - Adults without actual weight: use ENERGY_RDA[gender][group].bmr × PAL.
 * 3. Apply pregnancy/breastfeeding kcal bonus.
 * 4. Derive macros from MACRO_RATIOS.
 * 5. Look up micronutrients; add special-condition increments.
 */
export function calculateMemberTarget(member: FamilyMemberInput): DailyNutritionTarget {
  const ageGroup = getAgeGroup(member.tuoi)
  const gender = member.gioi_tinh
  const rdaEntry = ENERGY_RDA[gender][ageGroup]
  const macroRatio = MACRO_RATIOS[ageGroup]
  const microBase: MicronutrientRDA = MICRONUTRIENT_RDA[gender][ageGroup]

  // Resolve PAL factor (default to van_phong if key not found)
  const pal: number = PAL_FACTORS[member.nghe_nghiep_pal] ?? PAL_FACTORS['van_phong']!

  // ── 1. Compute base kcal ────────────────────────────────────────────────

  let kcal: number

  if (ageGroup === '0-6m' || ageGroup === '6-12m') {
    // Infants: fixed energy — PAL multiplication not meaningful
    kcal = rdaEntry.kcal
  } else {
    const stdRef = STANDARD_WEIGHTS[gender][ageGroup]
    const weight = member.can_nang_kg ?? stdRef.weight_kg
    const height = stdRef.height_cm  // use standard height (actual rarely supplied)

    if (
      ageGroup === '1-3'   ||
      ageGroup === '4-6'   ||
      ageGroup === '7-9'   ||
      ageGroup === '10-12' ||
      ageGroup === '13-15' ||
      ageGroup === '16-18'
    ) {
      // Children & adolescents: scale table BMR by ratio of actual vs standard weight,
      // then multiply by PAL. If actual weight not supplied, use table BMR directly × PAL.
      if (member.can_nang_kg != null && rdaEntry.bmr > 0) { // != null catches both null and undefined
        const weightRatio = member.can_nang_kg / stdRef.weight_kg
        kcal = Math.round(rdaEntry.bmr * weightRatio * pal)
      } else {
        kcal = Math.round(rdaEntry.bmr * pal)
      }
    } else {
      // Adults (18+): Mifflin-St Jeor when weight is available
      if (member.can_nang_kg != null) {
        const bmr = mifflinStJeorBMR(weight, height, member.tuoi, gender)
        kcal = Math.round(bmr * pal)
      } else {
        kcal = Math.round(rdaEntry.bmr * pal)
      }
    }
  }

  // ── 2. Pregnancy / breastfeeding kcal bonus ────────────────────────────

  const specialCondition = member.tinh_trang_dac_biet ?? null
  if (specialCondition !== null) {
    kcal += SPECIAL_CONDITION_KCAL[specialCondition]
  }

  // ── 3. Macros (g/day from kcal percentages) ────────────────────────────

  const protein_g = Math.round((kcal * macroRatio.protein_pct) / 100 / KCAL_PER_G.protein)
  const lipid_g   = Math.round((kcal * macroRatio.lipid_pct)   / 100 / KCAL_PER_G.lipid)
  const glucid_g  = Math.round((kcal * macroRatio.glucid_pct)  / 100 / KCAL_PER_G.glucid)

  // ── 4. Micronutrients (base + special condition increments) ────────────

  const microKeys: (keyof MicronutrientRDA)[] = [
    'canxi_mg', 'sat_mg', 'kem_mg', 'iod_mcg', 'selen_mcg',
    'vitA_mcg', 'vitD_mcg', 'vitE_mg', 'vitC_mg',
    'vitB1_mg', 'vitB2_mg', 'vitB6_mg', 'vitB12_mcg',
    'folat_mcg', 'natri_mg_max', 'chat_xo_g',
  ]

  // natri_mg_max is a LIMIT, not additive — keep base value regardless of condition
  const micro = {} as MicronutrientRDA
  for (const key of microKeys) {
    let value: number = microBase[key]
    if (specialCondition !== null && key !== 'natri_mg_max') {
      const increment = SPECIAL_CONDITION_MICRO[specialCondition][key]
      if (increment !== undefined) {
        value += increment
      }
    }
    micro[key] = value
  }

  return {
    memberId: member.id,
    kcal,
    protein_g,
    lipid_g,
    glucid_g,
    ...micro,
  }
}

// ---------------------------------------------------------------------------
// Family-level aggregation
// ---------------------------------------------------------------------------

/**
 * Generates a nutrition report for all family members, including family totals.
 * Infants under 6 months are included but their micronutrient totals reflect
 * breast-milk AI values from the 2016 tables.
 */
export function calculateFamilyReport(members: FamilyMemberInput[]): FamilyNutritionReport {
  const targets: DailyNutritionTarget[] = members.map(calculateMemberTarget)

  const numericKeys: (keyof Omit<DailyNutritionTarget, 'memberId'>)[] = [
    'kcal', 'protein_g', 'lipid_g', 'glucid_g',
    'canxi_mg', 'sat_mg', 'kem_mg', 'iod_mcg', 'selen_mcg',
    'vitA_mcg', 'vitD_mcg', 'vitE_mg', 'vitC_mg',
    'vitB1_mg', 'vitB2_mg', 'vitB6_mg', 'vitB12_mcg',
    'folat_mcg', 'natri_mg_max', 'chat_xo_g',
  ]

  const family_total: DailyNutritionTarget = {
    memberId: 'family_total',
    kcal: 0,
    protein_g: 0,
    lipid_g: 0,
    glucid_g: 0,
    canxi_mg: 0,
    sat_mg: 0,
    kem_mg: 0,
    iod_mcg: 0,
    selen_mcg: 0,
    vitA_mcg: 0,
    vitD_mcg: 0,
    vitE_mg: 0,
    vitC_mg: 0,
    vitB1_mg: 0,
    vitB2_mg: 0,
    vitB6_mg: 0,
    vitB12_mcg: 0,
    folat_mcg: 0,
    natri_mg_max: 0,
    chat_xo_g: 0,
  }

  for (const t of targets) {
    for (const key of numericKeys) {
      ;(family_total[key] as number) += t[key]
    }
  }

  // Round summed totals to avoid floating-point noise
  for (const key of numericKeys) {
    ;(family_total[key] as number) =
      Math.round((family_total[key] as number) * 100) / 100
  }

  return {
    members: targets,
    family_total,
    generated_at: new Date().toISOString(),
  }
}
