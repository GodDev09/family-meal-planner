import { NextRequest, NextResponse } from "next/server";
import { getFamily } from "@/lib/store/sqliteStore";
import { calculateFamilyReport, type FamilyMemberInput } from "@/lib/nutrition/calculator";
import { isValidFamilyCode } from "@/lib/auth/familyCode";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id || !isValidFamilyCode(id)) {
    return NextResponse.json({ error: "Invalid family_id" }, { status: 400 });
  }
  const family = getFamily(id);
  if (!family) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inputs: FamilyMemberInput[] = family.members.map((m) => ({
    id: m.id,
    ten: m.ten,
    tuoi: m.tuoi,
    gioi_tinh: m.gioi_tinh,
    can_nang_kg: m.can_nang_kg ?? undefined, // null from SQLite → undefined for calculator
    nghe_nghiep_pal: m.nghe_nghiep_pal,
    tinh_trang_dac_biet: m.tinh_trang_dac_biet ?? null,
  }));

  const report = calculateFamilyReport(inputs);
  return NextResponse.json(report);
}
