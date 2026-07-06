/**
 * Vietnamese RDA 2016 — Nhu cầu dinh dưỡng khuyến nghị cho người Việt Nam
 * Nguồn: Bộ Y tế / Viện Dinh dưỡng Quốc gia, 2016
 *
 * All values are per person per day unless otherwise noted.
 */

// ---------------------------------------------------------------------------
// PAL (Physical Activity Level) factors
// ---------------------------------------------------------------------------

/**
 * PAL multipliers to convert BMR → TDEE.
 * Mapped from occupational category keys used in FamilyMemberInput.
 *
 * Ref: Viện Dinh dưỡng 2016, Bảng 2 — Hệ số hoạt động thể lực
 *   - Nhẹ (sedentary/office)  : PAL 1.40–1.69  → midpoint 1.55, rounded to 1.5
 *   - Vừa (moderate activity) : PAL 1.70–1.99  → midpoint 1.85, rounded to 1.7
 *   - Nặng (heavy labour)     : PAL 2.00–2.40  → lower bound 2.0
 */
export const PAL_FACTORS: Record<string, number> = {
  /** Văn phòng: lập trình viên, kế toán, sinh viên, nhân viên hành chính */
  van_phong: 1.5,
  /** Trung bình: giáo viên, nhân viên bán hàng, nội trợ, thợ thủ công */
  trung_binh: 1.7,
  /** Nặng: công nhân xây dựng, nông dân, bộ đội, vận động viên */
  nang: 2.0,
  /** Học sinh: trẻ em đi học, hoạt động vừa phải (PAL ~1.75 theo RDA 2016 nhóm trẻ) */
  hoc_sinh: 1.75,
  /** Trẻ nhỏ (3-6 tuổi): hoạt động nhẹ, ở nhà hoặc mẫu giáo */
  tre_nho: 1.4,
} as const

// ---------------------------------------------------------------------------
// Standard body weights for Vietnamese by age/gender
// Ref: Viện Dinh dưỡng — số liệu nhân trắc học Việt Nam
// Used when can_nang_kg is not supplied.
// ---------------------------------------------------------------------------

export interface AgeGenderWeightEntry {
  /** Standard body weight in kg */
  weight_kg: number
  /** Standard height in cm (for Mifflin-St Jeor fallback) */
  height_cm: number
}

export const STANDARD_WEIGHTS: Record<
  'nam' | 'nu',
  Record<string, AgeGenderWeightEntry>
> = {
  nam: {
    '0-6m':  { weight_kg: 6.0,  height_cm: 62 },
    '6-12m': { weight_kg: 9.0,  height_cm: 72 },
    '1-3':   { weight_kg: 13.0, height_cm: 92 },
    '4-6':   { weight_kg: 18.0, height_cm: 109 },
    '7-9':   { weight_kg: 24.0, height_cm: 124 },
    '10-12': { weight_kg: 32.0, height_cm: 138 },
    '13-15': { weight_kg: 47.0, height_cm: 158 },
    '16-18': { weight_kg: 56.0, height_cm: 165 },
    '18-30': { weight_kg: 58.0, height_cm: 166 },
    '31-50': { weight_kg: 60.0, height_cm: 165 },
    '51-60': { weight_kg: 60.0, height_cm: 164 },
    '60+':   { weight_kg: 58.0, height_cm: 162 },
  },
  nu: {
    '0-6m':  { weight_kg: 5.5,  height_cm: 61 },
    '6-12m': { weight_kg: 8.5,  height_cm: 70 },
    '1-3':   { weight_kg: 12.5, height_cm: 90 },
    '4-6':   { weight_kg: 17.0, height_cm: 107 },
    '7-9':   { weight_kg: 23.0, height_cm: 122 },
    '10-12': { weight_kg: 30.0, height_cm: 136 },
    '13-15': { weight_kg: 45.0, height_cm: 154 },
    '16-18': { weight_kg: 50.0, height_cm: 157 },
    '18-30': { weight_kg: 52.0, height_cm: 157 },
    '31-50': { weight_kg: 53.0, height_cm: 156 },
    '51-60': { weight_kg: 53.0, height_cm: 155 },
    '60+':   { weight_kg: 51.0, height_cm: 153 },
  },
} as const

// ---------------------------------------------------------------------------
// Energy RDA (kcal/day) — base values at reference PAL (sedentary)
// Ref: Bảng nhu cầu năng lượng khuyến nghị, Viện Dinh dưỡng 2016
// Note: These are TDEE reference values at PAL ~1.5 (van_phong).
//       For other PAL categories the calculator derives TDEE from BMR × PAL.
//       Infants (0–12m) and young children have fixed values independent of PAL.
// ---------------------------------------------------------------------------

export type AgeGroupKey =
  | '0-6m'
  | '6-12m'
  | '1-3'
  | '4-6'
  | '7-9'
  | '10-12'
  | '13-15'
  | '16-18'
  | '18-30'
  | '31-50'
  | '51-60'
  | '60+'

export interface EnergyRDAEntry {
  /** Base kcal/day (TDEE at sedentary PAL ≈ 1.5 for adults, fixed for children) */
  kcal: number
  /** BMR (kcal/day) used to recompute TDEE at other PAL levels. 0 for infants. */
  bmr: number
}

export const ENERGY_RDA: Record<'nam' | 'nu', Record<AgeGroupKey, EnergyRDAEntry>> = {
  nam: {
    '0-6m':  { kcal: 560,  bmr: 0 },   // breast-milk + complementary
    '6-12m': { kcal: 820,  bmr: 0 },
    '1-3':   { kcal: 1180, bmr: 787 },
    '4-6':   { kcal: 1470, bmr: 926 },  // kcal = bmr × ~1.59 (moderate child PAL)
    '7-9':   { kcal: 1825, bmr: 1103 },
    '10-12': { kcal: 2150, bmr: 1310 },
    '13-15': { kcal: 2525, bmr: 1570 },
    '16-18': { kcal: 2715, bmr: 1743 },
    '18-30': { kcal: 2700, bmr: 1800 },
    '31-50': { kcal: 2650, bmr: 1767 },
    '51-60': { kcal: 2350, bmr: 1567 },
    '60+':   { kcal: 2200, bmr: 1467 },
  },
  nu: {
    '0-6m':  { kcal: 520,  bmr: 0 },
    '6-12m': { kcal: 755,  bmr: 0 },
    '1-3':   { kcal: 1100, bmr: 733 },
    '4-6':   { kcal: 1360, bmr: 855 },
    '7-9':   { kcal: 1670, bmr: 1010 },
    '10-12': { kcal: 1970, bmr: 1190 },
    '13-15': { kcal: 2145, bmr: 1336 },
    '16-18': { kcal: 2190, bmr: 1394 },
    '18-30': { kcal: 2200, bmr: 1467 },
    '31-50': { kcal: 2150, bmr: 1433 },
    '51-60': { kcal: 1900, bmr: 1267 },
    '60+':   { kcal: 1750, bmr: 1167 },
  },
} as const

/**
 * Additional kcal for pregnancy / breastfeeding.
 * Ref: Viện Dinh dưỡng 2016, Bảng 3
 */
export const SPECIAL_CONDITION_KCAL: Record<
  'mang_thai_1' | 'mang_thai_2' | 'mang_thai_3' | 'cho_con_bu',
  number
> = {
  mang_thai_1: 0,    // 3 tháng đầu: không tăng thêm
  mang_thai_2: 250,  // 3 tháng giữa: +250 kcal/ngày
  mang_thai_3: 450,  // 3 tháng cuối: +450 kcal/ngày
  cho_con_bu:  500,  // Cho con bú: +500 kcal/ngày
} as const

// ---------------------------------------------------------------------------
// Macro ratios (% of total energy)
// Ref: Viện Dinh dưỡng 2016, Bảng 5 — Nhu cầu protein, lipid, glucid
// ---------------------------------------------------------------------------

export interface MacroRatio {
  /** Protein as % of total energy */
  protein_pct: number
  /** Lipid as % of total energy */
  lipid_pct: number
  /** Glucid (carbohydrate) as % of total energy */
  glucid_pct: number
}

/** 1 g protein = 4 kcal; 1 g lipid = 9 kcal; 1 g glucid = 4 kcal */
export const KCAL_PER_G = { protein: 4, lipid: 9, glucid: 4 } as const

export const MACRO_RATIOS: Record<AgeGroupKey, MacroRatio> = {
  '0-6m':  { protein_pct: 8,  lipid_pct: 55, glucid_pct: 37 }, // breast-milk composition
  '6-12m': { protein_pct: 10, lipid_pct: 40, glucid_pct: 50 },
  '1-3':   { protein_pct: 13, lipid_pct: 35, glucid_pct: 52 },
  '4-6':   { protein_pct: 14, lipid_pct: 30, glucid_pct: 56 },
  '7-9':   { protein_pct: 14, lipid_pct: 25, glucid_pct: 61 },
  '10-12': { protein_pct: 15, lipid_pct: 25, glucid_pct: 60 },
  '13-15': { protein_pct: 15, lipid_pct: 25, glucid_pct: 60 },
  '16-18': { protein_pct: 15, lipid_pct: 25, glucid_pct: 60 },
  '18-30': { protein_pct: 15, lipid_pct: 25, glucid_pct: 60 },
  '31-50': { protein_pct: 15, lipid_pct: 25, glucid_pct: 60 },
  '51-60': { protein_pct: 15, lipid_pct: 25, glucid_pct: 60 },
  '60+':   { protein_pct: 16, lipid_pct: 20, glucid_pct: 64 }, // higher protein to prevent sarcopenia
} as const

// ---------------------------------------------------------------------------
// Micronutrient RDA
// Ref: Bảng nhu cầu vitamin và khoáng chất, Viện Dinh dưỡng 2016
// natri_mg_max = upper safe limit (UL), all others are RDA/AI
// ---------------------------------------------------------------------------

export interface MicronutrientRDA {
  canxi_mg: number
  sat_mg: number        // iron (sắt)
  kem_mg: number        // zinc (kẽm)
  iod_mcg: number       // iodine
  selen_mcg: number     // selenium
  vitA_mcg: number      // retinol equivalents (RE)
  vitD_mcg: number
  vitE_mg: number       // alpha-tocopherol equivalents
  vitC_mg: number
  vitB1_mg: number      // thiamine
  vitB2_mg: number      // riboflavin
  vitB6_mg: number
  vitB12_mcg: number
  folat_mcg: number     // folate DFE
  natri_mg_max: number  // upper limit (not RDA)
  chat_xo_g: number     // dietary fibre
}

export const MICRONUTRIENT_RDA: Record<'nam' | 'nu', Record<AgeGroupKey, MicronutrientRDA>> = {
  nam: {
    '0-6m': {
      canxi_mg: 300, sat_mg: 0.27, kem_mg: 2.0, iod_mcg: 110, selen_mcg: 15,
      vitA_mcg: 375, vitD_mcg: 5,  vitE_mg: 4,  vitC_mg: 25,
      vitB1_mg: 0.2, vitB2_mg: 0.3, vitB6_mg: 0.1, vitB12_mcg: 0.4,
      folat_mcg: 65, natri_mg_max: 400, chat_xo_g: 0,
    },
    '6-12m': {
      canxi_mg: 400, sat_mg: 11.0, kem_mg: 3.0, iod_mcg: 130, selen_mcg: 20,
      vitA_mcg: 400, vitD_mcg: 5,  vitE_mg: 5,  vitC_mg: 30,
      vitB1_mg: 0.3, vitB2_mg: 0.4, vitB6_mg: 0.3, vitB12_mcg: 0.5,
      folat_mcg: 80, natri_mg_max: 600, chat_xo_g: 5,
    },
    '1-3': {
      canxi_mg: 500, sat_mg: 7.0,  kem_mg: 4.0, iod_mcg: 90,  selen_mcg: 20,
      vitA_mcg: 400, vitD_mcg: 5,  vitE_mg: 6,  vitC_mg: 30,
      vitB1_mg: 0.5, vitB2_mg: 0.5, vitB6_mg: 0.5, vitB12_mcg: 0.9,
      folat_mcg: 150, natri_mg_max: 1000, chat_xo_g: 14,
    },
    '4-6': {
      canxi_mg: 600, sat_mg: 10.0, kem_mg: 5.0, iod_mcg: 90,  selen_mcg: 20,
      vitA_mcg: 450, vitD_mcg: 5,  vitE_mg: 7,  vitC_mg: 35,
      vitB1_mg: 0.6, vitB2_mg: 0.6, vitB6_mg: 0.6, vitB12_mcg: 1.2,
      folat_mcg: 200, natri_mg_max: 1200, chat_xo_g: 16,
    },
    '7-9': {
      canxi_mg: 700, sat_mg: 10.0, kem_mg: 6.0, iod_mcg: 120, selen_mcg: 25,
      vitA_mcg: 500, vitD_mcg: 5,  vitE_mg: 8,  vitC_mg: 40,
      vitB1_mg: 0.9, vitB2_mg: 0.9, vitB6_mg: 1.0, vitB12_mcg: 1.8,
      folat_mcg: 300, natri_mg_max: 1500, chat_xo_g: 20,
    },
    '10-12': {
      canxi_mg: 1000, sat_mg: 13.0, kem_mg: 8.0, iod_mcg: 120, selen_mcg: 35,
      vitA_mcg: 600,  vitD_mcg: 5,  vitE_mg: 10, vitC_mg: 50,
      vitB1_mg: 1.1, vitB2_mg: 1.1, vitB6_mg: 1.1, vitB12_mcg: 2.4,
      folat_mcg: 300, natri_mg_max: 1900, chat_xo_g: 22,
    },
    '13-15': {
      canxi_mg: 1000, sat_mg: 15.0, kem_mg: 10.0, iod_mcg: 150, selen_mcg: 45,
      vitA_mcg: 700,  vitD_mcg: 5,  vitE_mg: 13, vitC_mg: 65,
      vitB1_mg: 1.2, vitB2_mg: 1.3, vitB6_mg: 1.3, vitB12_mcg: 2.4,
      folat_mcg: 400, natri_mg_max: 2200, chat_xo_g: 26,
    },
    '16-18': {
      canxi_mg: 1000, sat_mg: 12.0, kem_mg: 12.0, iod_mcg: 150, selen_mcg: 55,
      vitA_mcg: 750,  vitD_mcg: 5,  vitE_mg: 15, vitC_mg: 75,
      vitB1_mg: 1.2, vitB2_mg: 1.3, vitB6_mg: 1.3, vitB12_mcg: 2.4,
      folat_mcg: 400, natri_mg_max: 2300, chat_xo_g: 28,
    },
    '18-30': {
      canxi_mg: 800, sat_mg: 11.0, kem_mg: 11.0, iod_mcg: 150, selen_mcg: 55,
      vitA_mcg: 700, vitD_mcg: 5,  vitE_mg: 15, vitC_mg: 75,
      vitB1_mg: 1.2, vitB2_mg: 1.3, vitB6_mg: 1.3, vitB12_mcg: 2.4,
      folat_mcg: 400, natri_mg_max: 2300, chat_xo_g: 30,
    },
    '31-50': {
      canxi_mg: 800, sat_mg: 11.0, kem_mg: 11.0, iod_mcg: 150, selen_mcg: 55,
      vitA_mcg: 700, vitD_mcg: 5,  vitE_mg: 15, vitC_mg: 75,
      vitB1_mg: 1.2, vitB2_mg: 1.3, vitB6_mg: 1.3, vitB12_mcg: 2.4,
      folat_mcg: 400, natri_mg_max: 2300, chat_xo_g: 28,
    },
    '51-60': {
      canxi_mg: 1000, sat_mg: 11.0, kem_mg: 11.0, iod_mcg: 150, selen_mcg: 55,
      vitA_mcg: 700,  vitD_mcg: 10, vitE_mg: 15, vitC_mg: 75,
      vitB1_mg: 1.2, vitB2_mg: 1.3, vitB6_mg: 1.7, vitB12_mcg: 2.4,
      folat_mcg: 400, natri_mg_max: 2300, chat_xo_g: 25,
    },
    '60+': {
      canxi_mg: 1000, sat_mg: 11.0, kem_mg: 11.0, iod_mcg: 150, selen_mcg: 55,
      vitA_mcg: 700,  vitD_mcg: 15, vitE_mg: 15, vitC_mg: 75,
      vitB1_mg: 1.2, vitB2_mg: 1.3, vitB6_mg: 1.7, vitB12_mcg: 2.4,
      folat_mcg: 400, natri_mg_max: 2300, chat_xo_g: 21,
    },
  },
  nu: {
    '0-6m': {
      canxi_mg: 300, sat_mg: 0.27, kem_mg: 2.0, iod_mcg: 110, selen_mcg: 15,
      vitA_mcg: 375, vitD_mcg: 5,  vitE_mg: 4,  vitC_mg: 25,
      vitB1_mg: 0.2, vitB2_mg: 0.3, vitB6_mg: 0.1, vitB12_mcg: 0.4,
      folat_mcg: 65, natri_mg_max: 400, chat_xo_g: 0,
    },
    '6-12m': {
      canxi_mg: 400, sat_mg: 11.0, kem_mg: 3.0, iod_mcg: 130, selen_mcg: 20,
      vitA_mcg: 400, vitD_mcg: 5,  vitE_mg: 5,  vitC_mg: 30,
      vitB1_mg: 0.3, vitB2_mg: 0.4, vitB6_mg: 0.3, vitB12_mcg: 0.5,
      folat_mcg: 80, natri_mg_max: 600, chat_xo_g: 5,
    },
    '1-3': {
      canxi_mg: 500, sat_mg: 7.0,  kem_mg: 4.0, iod_mcg: 90,  selen_mcg: 20,
      vitA_mcg: 400, vitD_mcg: 5,  vitE_mg: 6,  vitC_mg: 30,
      vitB1_mg: 0.5, vitB2_mg: 0.5, vitB6_mg: 0.5, vitB12_mcg: 0.9,
      folat_mcg: 150, natri_mg_max: 1000, chat_xo_g: 14,
    },
    '4-6': {
      canxi_mg: 600, sat_mg: 10.0, kem_mg: 5.0, iod_mcg: 90,  selen_mcg: 20,
      vitA_mcg: 450, vitD_mcg: 5,  vitE_mg: 7,  vitC_mg: 35,
      vitB1_mg: 0.6, vitB2_mg: 0.6, vitB6_mg: 0.6, vitB12_mcg: 1.2,
      folat_mcg: 200, natri_mg_max: 1200, chat_xo_g: 16,
    },
    '7-9': {
      canxi_mg: 700, sat_mg: 10.0, kem_mg: 6.0, iod_mcg: 120, selen_mcg: 25,
      vitA_mcg: 500, vitD_mcg: 5,  vitE_mg: 8,  vitC_mg: 40,
      vitB1_mg: 0.9, vitB2_mg: 0.9, vitB6_mg: 1.0, vitB12_mcg: 1.8,
      folat_mcg: 300, natri_mg_max: 1500, chat_xo_g: 20,
    },
    '10-12': {
      canxi_mg: 1000, sat_mg: 20.0, kem_mg: 8.0, iod_mcg: 120, selen_mcg: 35,
      vitA_mcg: 600,  vitD_mcg: 5,  vitE_mg: 10, vitC_mg: 50,
      vitB1_mg: 1.1, vitB2_mg: 1.1, vitB6_mg: 1.1, vitB12_mcg: 2.4,
      folat_mcg: 300, natri_mg_max: 1900, chat_xo_g: 22,
    },
    '13-15': {
      canxi_mg: 1000, sat_mg: 25.0, kem_mg: 8.0,  iod_mcg: 150, selen_mcg: 45,
      vitA_mcg: 600,  vitD_mcg: 5,  vitE_mg: 12, vitC_mg: 65,
      vitB1_mg: 1.1, vitB2_mg: 1.1, vitB6_mg: 1.2, vitB12_mcg: 2.4,
      folat_mcg: 400, natri_mg_max: 2200, chat_xo_g: 24,
    },
    '16-18': {
      canxi_mg: 1000, sat_mg: 25.0, kem_mg: 9.0,  iod_mcg: 150, selen_mcg: 55,
      vitA_mcg: 650,  vitD_mcg: 5,  vitE_mg: 15, vitC_mg: 65,
      vitB1_mg: 1.1, vitB2_mg: 1.1, vitB6_mg: 1.2, vitB12_mcg: 2.4,
      folat_mcg: 400, natri_mg_max: 2300, chat_xo_g: 24,
    },
    '18-30': {
      canxi_mg: 800,  sat_mg: 24.0, kem_mg: 8.0,  iod_mcg: 150, selen_mcg: 55,
      vitA_mcg: 600,  vitD_mcg: 5,  vitE_mg: 15, vitC_mg: 70,
      vitB1_mg: 1.1, vitB2_mg: 1.1, vitB6_mg: 1.3, vitB12_mcg: 2.4,
      folat_mcg: 400, natri_mg_max: 2300, chat_xo_g: 25,
    },
    '31-50': {
      canxi_mg: 800,  sat_mg: 24.0, kem_mg: 8.0,  iod_mcg: 150, selen_mcg: 55,
      vitA_mcg: 600,  vitD_mcg: 5,  vitE_mg: 15, vitC_mg: 70,
      vitB1_mg: 1.1, vitB2_mg: 1.1, vitB6_mg: 1.3, vitB12_mcg: 2.4,
      folat_mcg: 400, natri_mg_max: 2300, chat_xo_g: 22,
    },
    '51-60': {
      canxi_mg: 1000, sat_mg: 11.0, kem_mg: 8.0,  iod_mcg: 150, selen_mcg: 55,
      vitA_mcg: 600,  vitD_mcg: 10, vitE_mg: 15, vitC_mg: 70,
      vitB1_mg: 1.1, vitB2_mg: 1.1, vitB6_mg: 1.5, vitB12_mcg: 2.4,
      folat_mcg: 400, natri_mg_max: 2300, chat_xo_g: 21,
    },
    '60+': {
      canxi_mg: 1000, sat_mg: 11.0, kem_mg: 8.0,  iod_mcg: 150, selen_mcg: 55,
      vitA_mcg: 600,  vitD_mcg: 15, vitE_mg: 15, vitC_mg: 70,
      vitB1_mg: 1.1, vitB2_mg: 1.1, vitB6_mg: 1.5, vitB12_mcg: 2.4,
      folat_mcg: 400, natri_mg_max: 2300, chat_xo_g: 18,
    },
  },
} as const

/**
 * Additional micronutrient needs during pregnancy / breastfeeding (additive to base).
 * Ref: Bảng 7 — Nhu cầu vitamin và khoáng chất cho phụ nữ mang thai và cho con bú
 */
export const SPECIAL_CONDITION_MICRO: Record<
  'mang_thai_1' | 'mang_thai_2' | 'mang_thai_3' | 'cho_con_bu',
  Partial<MicronutrientRDA>
> = {
  mang_thai_1: {
    canxi_mg: 0,   sat_mg: 16,  kem_mg: 3,  iod_mcg: 25, selen_mcg: 4,
    vitA_mcg: 0,   vitD_mcg: 0, vitE_mg: 0, vitC_mg: 10,
    vitB1_mg: 0.2, vitB2_mg: 0.2, vitB6_mg: 0.5, vitB12_mcg: 0.2,
    folat_mcg: 200, chat_xo_g: 3,
  },
  mang_thai_2: {
    canxi_mg: 200, sat_mg: 16,  kem_mg: 3,  iod_mcg: 25, selen_mcg: 4,
    vitA_mcg: 100, vitD_mcg: 0, vitE_mg: 2, vitC_mg: 10,
    vitB1_mg: 0.2, vitB2_mg: 0.2, vitB6_mg: 0.5, vitB12_mcg: 0.2,
    folat_mcg: 200, chat_xo_g: 3,
  },
  mang_thai_3: {
    canxi_mg: 300, sat_mg: 16,  kem_mg: 3,  iod_mcg: 25, selen_mcg: 4,
    vitA_mcg: 100, vitD_mcg: 0, vitE_mg: 2, vitC_mg: 10,
    vitB1_mg: 0.3, vitB2_mg: 0.3, vitB6_mg: 0.5, vitB12_mcg: 0.2,
    folat_mcg: 200, chat_xo_g: 5,
  },
  cho_con_bu: {
    canxi_mg: 400, sat_mg: 10,  kem_mg: 5,  iod_mcg: 50, selen_mcg: 15,
    vitA_mcg: 400, vitD_mcg: 0, vitE_mg: 4, vitC_mg: 30,
    vitB1_mg: 0.2, vitB2_mg: 0.4, vitB6_mg: 0.5, vitB12_mcg: 0.4,
    folat_mcg: 100, chat_xo_g: 5,
  },
} as const
