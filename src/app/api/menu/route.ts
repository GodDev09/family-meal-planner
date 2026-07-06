import { NextRequest, NextResponse } from "next/server";
import { getFamily, saveWeeklyMenu } from "@/lib/store/sqliteStore";
import { calculateFamilyReport, type FamilyMemberInput } from "@/lib/nutrition/calculator";
import { isValidFamilyCode } from "@/lib/auth/familyCode";
import { getWeekStart, addDays } from "@/lib/utils";
import { generateWeeklyMenu, type MenuSlot } from "@/lib/menu/generator";
import { DISHES } from "@/lib/data/dishes";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const week = req.nextUrl.searchParams.get("week"); // YYYY-MM-DD Monday
  if (!id || !isValidFamilyCode(id)) {
    return NextResponse.json({ error: "Invalid family_id" }, { status: 400 });
  }
  const family = getFamily(id);
  if (!family) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const targetWeek = week ?? getWeekStart();
  const existing = family.weekly_menus.find((m) => m.week_start === targetWeek);
  if (existing) return NextResponse.json(existing);
  return NextResponse.json({ error: "No menu for this week" }, { status: 404 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { family_id, week_start, prefer_vung } = body as {
    family_id: string;
    week_start?: string;
    prefer_vung?: Array<"bac" | "trung" | "nam">;
  };

  if (!family_id || !isValidFamilyCode(family_id)) {
    return NextResponse.json({ error: "Invalid family_id" }, { status: 400 });
  }
  const family = getFamily(family_id);
  if (!family) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inputs: FamilyMemberInput[] = family.members.map((m) => ({
    id: m.id,
    ten: m.ten,
    tuoi: m.tuoi,
    gioi_tinh: m.gioi_tinh,
    can_nang_kg: m.can_nang_kg ?? undefined,
    nghe_nghiep_pal: m.nghe_nghiep_pal,
    tinh_trang_dac_biet: m.tinh_trang_dac_biet ?? null,
  }));

  const nutritionReport = calculateFamilyReport(inputs);
  const allRestrictions: Record<string, string[]> = {};
  for (const m of family.members) allRestrictions[m.id] = m.di_ung;

  const hasYoungChildren = family.members.some((m) => m.tuoi < 12);
  const hasElderly = family.members.some((m) => m.tuoi >= 60);

  const weekStart = week_start ?? getWeekStart();

  // Collect dish IDs from the previous week to avoid repeating them
  const prevWeekStart = addDays(weekStart, -7);
  const prevMenu = family.weekly_menus.find((m) => m.week_start === prevWeekStart);
  const prevMenuData = prevMenu?.menu_data as { slots?: MenuSlot[] } | MenuSlot[] | undefined;
  let avoidDishIds: string[] | undefined;
  if (prevMenuData) {
    const slots: MenuSlot[] = Array.isArray(prevMenuData)
      ? prevMenuData
      : (prevMenuData.slots ?? []);
    avoidDishIds = slots.flatMap((s) => s.dishes.map((d) => d.id));
  }

  const menu = generateWeeklyMenu(DISHES, {
    week_start: weekStart,
    family_id,
    nutritionReport,
    restrictions: allRestrictions,
    lockedDishes: family.settings.locked_dishes.filter((l) => l.date >= weekStart),
    preferVung: prefer_vung ?? family.settings.vung_mien_uu_tien,
    hasYoungChildren,
    hasElderly,
    avoidDishIds,
  });

  const saved = saveWeeklyMenu(family_id, { week_start: weekStart, menu_data: menu });
  return NextResponse.json(saved, { status: 201 });
}
