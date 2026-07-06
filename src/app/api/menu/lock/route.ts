import { NextRequest, NextResponse } from "next/server";
import { getFamily, updateSettings } from "@/lib/store/sqliteStore";
import { isValidFamilyCode } from "@/lib/auth/familyCode";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { family_id, date, meal_slot, dish_id, action } = body as {
    family_id: string;
    date: string;
    meal_slot: string;
    dish_id: string;
    action: "lock" | "unlock";
  };

  if (!family_id || !isValidFamilyCode(family_id)) {
    return NextResponse.json({ error: "Invalid family_id" }, { status: 400 });
  }
  if (!["lock", "unlock"].includes(action)) {
    return NextResponse.json({ error: "action must be lock or unlock" }, { status: 400 });
  }

  const family = getFamily(family_id);
  if (!family) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const current = family.settings.locked_dishes;

  const updated =
    action === "lock"
      ? current.some((l) => l.date === date && l.meal_slot === meal_slot)
        ? current
        : [...current, { date, meal_slot, dish_id }]
      : current.filter((l) => !(l.date === date && l.meal_slot === meal_slot));

  const settings = updateSettings(family_id, { locked_dishes: updated });
  return NextResponse.json({ ok: true, locked_dishes: settings?.locked_dishes ?? [] });
}
