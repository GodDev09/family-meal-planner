"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav, SideNav } from "@/components/ui/Nav";
import { NutritionWarnings } from "@/components/ui/NutritionWarnings";
import { NutritionActualVsTarget } from "@/components/ui/NutritionActualVsTarget";
import { cn, formatNutrient, getInitials } from "@/lib/utils";
import type { FamilyNutritionReport, DailyNutritionTarget } from "@/lib/nutrition/calculator";
import type { FamilyMember } from "@/lib/store/familyStore";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AVATAR_BG_CLASSES = [
  "bg-green-400",
  "bg-blue-400",
  "bg-orange-400",
  "bg-purple-400",
  "bg-pink-400",
  "bg-emerald-400",
  "bg-yellow-400",
  "bg-sky-400",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MemberWithTarget {
  member: FamilyMember;
  target: DailyNutritionTarget;
  index: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function avatarBg(index: number): string {
  return AVATAR_BG_CLASSES[index % AVATAR_BG_CLASSES.length];
}

// ---------------------------------------------------------------------------
// FamilyTotalBar
// ---------------------------------------------------------------------------

interface FamilyTotalBarProps {
  total: DailyNutritionTarget;
  memberCount: number;
}

function FamilyTotalBar({ total, memberCount }: FamilyTotalBarProps) {
  const proteinKcal = total.protein_g * 4;
  const lipidKcal = total.lipid_g * 9;
  const glucidKcal = total.glucid_g * 4;
  const sumMacroKcal = proteinKcal + lipidKcal + glucidKcal || 1;

  const proteinPct = Math.round((proteinKcal / sumMacroKcal) * 100);
  const lipidPct = Math.round((lipidKcal / sumMacroKcal) * 100);
  const glucidPct = 100 - proteinPct - lipidPct;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Tổng nhu cầu gia đình / ngày
          </h2>
          <p className="text-xs text-gray-400">{memberCount} thành viên</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(total.kcal).toLocaleString("vi-VN")}
          </span>
          <span className="text-sm text-gray-500 ml-1">kcal</span>
        </div>
      </div>

      {/* Stacked macro bar */}
      <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-blue-400 transition-all"
          style={{ width: `${proteinPct}%` }}
          title={`Protein ${proteinPct}%`}
        />
        <div
          className="h-full bg-yellow-400 transition-all"
          style={{ width: `${lipidPct}%` }}
          title={`Lipid ${lipidPct}%`}
        />
        <div
          className="h-full bg-green-400 transition-all"
          style={{ width: `${glucidPct}%` }}
          title={`Glucid ${glucidPct}%`}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3">
        {[
          { label: "Protein", grams: total.protein_g, pct: proteinPct, color: "bg-blue-400" },
          { label: "Lipid", grams: total.lipid_g, pct: lipidPct, color: "bg-yellow-400" },
          { label: "Glucid", grams: total.glucid_g, pct: glucidPct, color: "bg-green-400" },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded-full shrink-0", m.color)} />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {m.label}{" "}
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {Math.round(m.grams)}g
              </span>{" "}
              <span className="text-gray-400">({m.pct}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MemberNutritionCard
// ---------------------------------------------------------------------------

interface MemberNutritionCardProps {
  data: MemberWithTarget;
}

function MemberNutritionCard({ data }: MemberNutritionCardProps) {
  const { member, target, index } = data;
  const bg = avatarBg(index);
  const initials = getInitials(member.ten);

  const proteinKcal = target.protein_g * 4;
  const lipidKcal = target.lipid_g * 9;
  const glucidKcal = target.glucid_g * 4;
  const sumMacroKcal = proteinKcal + lipidKcal + glucidKcal || 1;

  const proteinPct = Math.round((proteinKcal / sumMacroKcal) * 100);
  const lipidPct = Math.round((lipidKcal / sumMacroKcal) * 100);
  const glucidPct = 100 - proteinPct - lipidPct;

  const micros = [
    {
      label: "Canxi",
      value: target.canxi_mg,
      unit: "mg",
      icon: "🦴",
    },
    {
      label: "Sắt",
      value: target.sat_mg,
      unit: "mg",
      icon: "🩸",
    },
    {
      label: "Vit C",
      value: target.vitC_mg,
      unit: "mg",
      icon: "🍊",
    },
    {
      label: "Vit D",
      value: target.vitD_mcg,
      unit: "mcg",
      icon: "☀️",
    },
    {
      label: "Vit A",
      value: target.vitA_mcg,
      unit: "mcg",
      icon: "👁",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0",
            bg
          )}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {member.ten}
          </p>
          <p className="text-xs text-gray-400">
            {member.gioi_tinh === "nam" ? "Nam" : "Nữ"} · {member.tuoi} tuổi
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {Math.round(target.kcal).toLocaleString("vi-VN")}
          </span>
          <span className="text-xs text-gray-500 ml-0.5">kcal/ngày</span>
        </div>
      </div>

      {/* Macro bar */}
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex mb-2">
        <div className="h-full bg-blue-400" style={{ width: `${proteinPct}%` }} />
        <div className="h-full bg-yellow-400" style={{ width: `${lipidPct}%` }} />
        <div className="h-full bg-green-400" style={{ width: `${glucidPct}%` }} />
      </div>

      {/* Macro values */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Protein", grams: target.protein_g, pct: proteinPct, color: "text-blue-500" },
          { label: "Lipid", grams: target.lipid_g, pct: lipidPct, color: "text-yellow-500" },
          { label: "Glucid", grams: target.glucid_g, pct: glucidPct, color: "text-green-600" },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 text-center"
          >
            <p className={cn("text-sm font-bold", m.color)}>
              {Math.round(m.grams)}g
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {m.label}
            </p>
            <p className="text-xs text-gray-400">{m.pct}%</p>
          </div>
        ))}
      </div>

      {/* Micronutrients grid */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Vi chất chính
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {micros.map((micro) => (
            <div
              key={micro.label}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2 text-center"
            >
              <div className="text-base leading-none mb-1">{micro.icon}</div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                {formatNutrient(micro.value, micro.unit)}
              </p>
              <p className="text-xs text-gray-400 leading-tight mt-0.5">{micro.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LoadingSkeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 h-36" />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 h-52"
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nutrition warnings pulled from latest weekly menu
// ---------------------------------------------------------------------------

function NutritionWarningsFromMenu({ familyId, className }: { familyId: string; className?: string }) {
  const [warnings, setWarnings] = useState<Array<{nutrient:string;status:"thieu"|"du_thua";percent_of_target:number;suggestion:string}>>([]);
  useEffect(() => {
    if (!familyId) return;
    fetch(`/api/menu?id=${familyId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.menu_data?.nutrition_summary) return;
        const summary = data.menu_data.nutrition_summary;
        const w: typeof warnings = [];
        if (summary.vs_target_pct && summary.vs_target_pct < 90)
          w.push({ nutrient: "kcal", status: "thieu", percent_of_target: summary.vs_target_pct, suggestion: "Thực đơn đang thiếu calo. Tạo lại hoặc thêm bữa phụ." });
        if (summary.protein_pct && summary.protein_pct < 13)
          w.push({ nutrient: "protein_g", status: "thieu", percent_of_target: summary.protein_pct, suggestion: "Tăng thêm thịt, cá, trứng, đậu phụ vào thực đơn." });
        if (summary.protein_pct && summary.protein_pct > 25)
          w.push({ nutrient: "protein_g", status: "du_thua", percent_of_target: summary.protein_pct, suggestion: "Giảm bớt thịt/cá, thêm rau và tinh bột phức hợp." });
        setWarnings(w);
      })
      .catch(() => {});
  }, [familyId]);
  if (!warnings.length) return null;
  return <NutritionWarnings warnings={warnings} className={className} />;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function NutritionPage() {
  const router = useRouter();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [report, setReport] = useState<FamilyNutritionReport | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("family_id");
    if (!id) {
      router.push("/");
      return;
    }
    setFamilyId(id);

    Promise.all([
      fetch(`/api/nutrition?id=${id}`).then((r) => {
        if (!r.ok) throw new Error("Không thể tải báo cáo dinh dưỡng");
        return r.json() as Promise<FamilyNutritionReport>;
      }),
      fetch(`/api/family?id=${id}`).then((r) => {
        if (!r.ok) throw new Error("Không thể tải dữ liệu gia đình");
        return r.json();
      }),
    ])
      .then(([nutr, fam]) => {
        setReport(nutr);
        setMembers(fam.members ?? []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex max-w-6xl mx-auto">
          <SideNav />
          <main className="flex-1 p-4 pb-28 md:pb-6">
            <div className="mb-6">
              <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-1" />
              <div className="h-4 w-28 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <LoadingSkeleton />
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-500 mb-3 text-sm">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-brand-600 hover:underline"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!report || members.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex max-w-6xl mx-auto">
          <SideNav />
          <main className="flex-1 p-4 pb-28 md:pb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Báo cáo dinh dưỡng
            </h1>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Chưa có dữ liệu
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Thêm thành viên gia đình để xem báo cáo nhu cầu dinh dưỡng.
              </p>
              <button
                onClick={() => router.push("/family")}
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                Thêm thành viên
              </button>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Zip members with their targets
  const memberTargets: MemberWithTarget[] = members.map((member, idx) => {
    const target =
      report.members.find((t) => t.memberId === member.id) ?? report.members[idx];
    return { member, target, index: idx };
  }).filter((x) => x.target != null);

  const generatedAt = report.generated_at
    ? new Date(report.generated_at).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex max-w-6xl mx-auto">
        <SideNav />

        <main className="flex-1 p-4 pb-28 md:pb-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Báo cáo dinh dưỡng
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Nhu cầu khuyến nghị mỗi ngày
                {generatedAt ? ` · ${generatedAt}` : ""}
              </p>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                if (!familyId) return;
                Promise.all([
                  fetch(`/api/nutrition?id=${familyId}`).then((r) => r.json()),
                  fetch(`/api/family?id=${familyId}`).then((r) => r.json()),
                ]).then(([nutr, fam]) => {
                  setReport(nutr);
                  setMembers(fam.members ?? []);
                  setLoading(false);
                });
              }}
              className="text-xs text-brand-600 hover:text-brand-800 font-medium px-3 py-1.5 rounded-lg border border-brand-200 hover:bg-brand-50 transition-colors dark:border-brand-800 dark:hover:bg-brand-900/20"
            >
              Làm mới
            </button>
          </div>

          {/* Family total bar */}
          <FamilyTotalBar
            total={report.family_total}
            memberCount={members.length}
          />

          {/* Actual vs target comparison */}
          <NutritionActualVsTarget
            familyId={familyId!}
            targetKcal={report.family_total.kcal}
            targetProtein={report.family_total.protein_g}
            targetLipid={report.family_total.lipid_g}
            targetGlucid={report.family_total.glucid_g}
          />

          {/* Nutrition warnings from weekly menu */}
          <NutritionWarningsFromMenu familyId={familyId!} className="mb-4" />

          {/* Color legend */}
          <div className="flex flex-wrap gap-3 mb-5 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-xs text-gray-500">Protein</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="text-xs text-gray-500">Lipid</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="text-xs text-gray-500">Glucid</span>
            </div>
          </div>

          {/* Member cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {memberTargets.map((data) => (
              <MemberNutritionCard key={data.member.id} data={data} />
            ))}
          </div>

          {/* Additional family totals table */}
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Tổng vi chất gia đình / ngày
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { label: "Canxi", value: report.family_total.canxi_mg, unit: "mg", icon: "🦴" },
                { label: "Sắt", value: report.family_total.sat_mg, unit: "mg", icon: "🩸" },
                { label: "Kẽm", value: report.family_total.kem_mg, unit: "mg", icon: "⚡" },
                { label: "Iod", value: report.family_total.iod_mcg, unit: "mcg", icon: "🧪" },
                { label: "Selen", value: report.family_total.selen_mcg, unit: "mcg", icon: "🔬" },
                { label: "Vitamin A", value: report.family_total.vitA_mcg, unit: "mcg", icon: "👁" },
                { label: "Vitamin D", value: report.family_total.vitD_mcg, unit: "mcg", icon: "☀️" },
                { label: "Vitamin E", value: report.family_total.vitE_mg, unit: "mg", icon: "🌿" },
                { label: "Vitamin C", value: report.family_total.vitC_mg, unit: "mg", icon: "🍊" },
                { label: "Vitamin B1", value: report.family_total.vitB1_mg, unit: "mg", icon: "🌾" },
                { label: "Vitamin B12", value: report.family_total.vitB12_mcg, unit: "mcg", icon: "💊" },
                { label: "Folate", value: report.family_total.folat_mcg, unit: "mcg", icon: "🥬" },
                { label: "Chất xơ", value: report.family_total.chat_xo_g, unit: "g", icon: "🌱" },
                {
                  label: "Natri (max)",
                  value: report.family_total.natri_mg_max,
                  unit: "mg",
                  icon: "🧂",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex items-center gap-2"
                >
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                      {formatNutrient(item.value, item.unit)}
                    </p>
                    <p className="text-xs text-gray-500 leading-tight truncate">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footnote */}
          <p className="text-xs text-gray-400 text-center mt-6 pb-2">
            Nguồn tham khảo: Bộ Y tế / Viện Dinh dưỡng 2016
          </p>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
