import { NextRequest, NextResponse } from "next/server";
import { getFamily, saveWeeklyMenu } from "@/lib/store/sqliteStore";
import { isValidFamilyCode } from "@/lib/auth/familyCode";
import { popUndo } from "@/lib/store/undoStack";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { family_id, week_start } = body as { family_id: string; week_start: string };

  if (!family_id || !isValidFamilyCode(family_id)) {
    return NextResponse.json({ error: "Invalid family_id" }, { status: 400 });
  }

  const family = getFamily(family_id);
  if (!family) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const previous = popUndo(family_id);
  if (!previous) {
    return NextResponse.json({ error: "Không có thay đổi nào để hoàn tác" }, { status: 404 });
  }

  const saved = saveWeeklyMenu(family_id, { week_start, menu_data: previous });
  return NextResponse.json({ ok: true, restored_menu: saved });
}
