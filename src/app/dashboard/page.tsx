"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNav, SideNav } from "@/components/ui/Nav";
import { type FamilyData } from "@/lib/store/familyStore";
import { type FamilyNutritionReport } from "@/lib/nutrition/calculator";

export default function DashboardPage() {
  const router = useRouter();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [nutrition, setNutrition] = useState<FamilyNutritionReport | null>(null);
  const [hasMenu, setHasMenu] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("family_id");
    if (!id) { router.push("/"); return; }
    setFamilyId(id);
    Promise.all([
      fetch(`/api/family?id=${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/nutrition?id=${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/menu?id=${id}`).then((r) => r.ok),
    ]).then(([fam, nutr, menu]) => {
      // New family with no members → redirect to onboarding
      if (fam && fam.members?.length === 0) {
        router.push("/onboarding");
        return;
      }
      setFamily(fam);
      setNutrition(nutr);
      setHasMenu(!!menu);
    });
  }, [router]);

  async function generateMenu() {
    if (!familyId) return;
    setGenerating(true);
    await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ family_id: familyId }),
    });
    setHasMenu(true);
    setGenerating(false);
    router.push("/menu");
  }

  if (!family) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Đang tải...</div>
      </div>
    );
  }

  const totalKcal = nutrition?.family_total.kcal ?? 0;
  const memberCount = family.members.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex max-w-6xl mx-auto">
        <SideNav />
        <main className="flex-1 p-4 pb-24 md:pb-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tổng quan</h1>
              <p className="text-xs text-gray-400 font-mono">{familyId}</p>
            </div>
            <button
              onClick={() => { localStorage.removeItem("family_id"); router.push("/"); }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Đăng xuất
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Thành viên", value: memberCount, icon: "👨‍👩‍👧", color: "brand" },
              { label: "Nhu cầu kcal/ngày", value: totalKcal ? `${Math.round(totalKcal).toLocaleString()}` : "—", icon: "🔥", color: "accent" },
              { label: "Thực đơn tuần", value: hasMenu ? "Đã có" : "Chưa tạo", icon: "🍽️", color: "brand" },
              { label: "Tin nhắn AI", value: family.ai_chat_logs.length, icon: "🤖", color: "accent" },
            ].map((stat) => (
              <div key={stat.label} className="card">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {memberCount === 0 && (
            <div className="card text-center py-8 mb-4">
              <div className="text-4xl mb-3">👨‍👩‍👧</div>
              <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Chưa có thành viên nào</h2>
              <p className="text-sm text-gray-500 mb-4">Thêm thành viên gia đình để bắt đầu lên thực đơn</p>
              <Link href="/family" className="btn-primary inline-block">Thêm thành viên</Link>
            </div>
          )}

          {/* Actions */}
          {memberCount > 0 && (
            <div className="grid md:grid-cols-2 gap-3">
              <button onClick={generateMenu} disabled={generating} className="card hover:shadow-md transition-shadow text-left">
                <div className="text-3xl mb-2">🍽️</div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  {generating ? "Đang tạo thực đơn..." : hasMenu ? "Tạo lại thực đơn tuần" : "Tạo thực đơn tuần"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Sinh tự động 7 ngày × 3 bữa theo nhu cầu dinh dưỡng gia đình</p>
              </button>

              <Link href="/nutrition" className="card hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Báo cáo dinh dưỡng</h3>
                <p className="text-xs text-gray-500 mt-1">Xem nhu cầu kcal, macro, vitamin, khoáng chất của từng người</p>
              </Link>
            </div>
          )}

          {/* Recent chat */}
          {family.ai_chat_logs.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Tin nhắn gần đây</h2>
              {family.ai_chat_logs.slice(-2).map((log) => (
                <div key={log.id} className="card mb-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Bạn: {log.user_message}</p>
                  <p className="text-gray-800 dark:text-gray-200">{log.ai_response.slice(0, 120)}...</p>
                </div>
              ))}
              <Link href="/history" className="text-xs text-brand-600 hover:underline">Xem toàn bộ lịch sử →</Link>
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
