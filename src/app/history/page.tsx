"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav, SideNav } from "@/components/ui/Nav";
import { cn, formatDateVi, addDays } from "@/lib/utils";
import type { FamilyData, WeeklyMenuData, ChatLog } from "@/lib/store/familyStore";

// ---------------------------------------------------------------------------
// Types for menu_data payload (mirrors /menu/page.tsx)
// ---------------------------------------------------------------------------

interface MenuSlot {
  date: string;
  meal_slot: string;
  dishes: { ten: string; kcal?: number }[];
  kcal_total: number;
}

interface WeeklyMenu {
  slots: MenuSlot[];
}

function parseMenu(raw: unknown): WeeklyMenu | null {
  if (!raw) return null;
  const r = raw as { slots?: MenuSlot[] } | MenuSlot[];
  if (Array.isArray(r)) return { slots: r };
  if ((r as { slots?: MenuSlot[] }).slots) return r as WeeklyMenu;
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcAvgDailyKcal(menuData: WeeklyMenuData): number {
  const menu = parseMenu(menuData.menu_data);
  if (!menu || !menu.slots.length) return 0;
  // Group by date and sum kcal per day
  const byDate = new Map<string, number>();
  for (const slot of menu.slots) {
    byDate.set(slot.date, (byDate.get(slot.date) ?? 0) + (slot.kcal_total ?? 0));
  }
  if (!byDate.size) return 0;
  const total = Array.from(byDate.values()).reduce((a, b) => a + b, 0);
  return Math.round(total / byDate.size);
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return formatDateVi(iso.slice(0, 10)).split(",")[1]?.trim() ?? iso.slice(0, 10);
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${hh}:${mm} · ${day}/${month}`;
}

// ---------------------------------------------------------------------------
// Week menu card
// ---------------------------------------------------------------------------

function MenuHistoryCard({ entry }: { entry: WeeklyMenuData }) {
  const menu = parseMenu(entry.menu_data);
  const weekEnd = addDays(entry.week_start, 6);
  const avgKcal = calcAvgDailyKcal(entry);

  const totalDishes = menu?.slots.reduce((sum, s) => sum + s.dishes.length, 0) ?? 0;
  const totalDays = (() => {
    const days = new Set(menu?.slots.map((s) => s.date) ?? []);
    return days.size;
  })();

  const createdAt = formatRelativeTime(entry.created_at);

  const fmtShort = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    return `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")}`;
  };

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
            Tuần {fmtShort(entry.week_start)} – {fmtShort(weekEnd)}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Tạo {createdAt}</p>
        </div>
        <span className="text-xs bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-full px-2 py-0.5 whitespace-nowrap">
          {totalDays} ngày
        </span>
      </div>

      <div className="flex gap-4">
        <div className="text-center">
          <div className="text-lg font-bold text-brand-600">
            {avgKcal > 0 ? avgKcal.toLocaleString() : "—"}
          </div>
          <div className="text-xs text-gray-400">kcal TB/ngày</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-accent-500">
            {totalDishes > 0 ? totalDishes : "—"}
          </div>
          <div className="text-xs text-gray-400">món ăn</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-600 dark:text-gray-300">
            {menu?.slots.length ?? "—"}
          </div>
          <div className="text-xs text-gray-400">bữa ăn</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat bubble pair
// ---------------------------------------------------------------------------

function ChatBubblePair({ log }: { log: ChatLog }) {
  const [expanded, setExpanded] = useState(false);
  const TRUNCATE = 300;
  const isLong = log.ai_response.length > TRUNCATE;
  const displayResponse = isLong && !expanded
    ? log.ai_response.slice(0, TRUNCATE) + "..."
    : log.ai_response;

  return (
    <div className="mb-5">
      {/* User message — right aligned */}
      <div className="flex justify-end mb-2">
        <div className="max-w-[80%] md:max-w-[65%]">
          <div className="bg-brand-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
            {log.user_message}
          </div>
          <div className="text-right mt-1">
            <span className="text-xs text-gray-400">{formatTimestamp(log.timestamp)}</span>
          </div>
        </div>
      </div>

      {/* AI response — left aligned */}
      <div className="flex justify-start">
        <div className="max-w-[80%] md:max-w-[65%]">
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-brand-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mb-1">
              AI
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed text-gray-800 dark:text-gray-100 shadow-sm">
              <p className="whitespace-pre-line">{displayResponse}</p>
              {isLong && (
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="mt-2 text-xs text-brand-500 hover:text-brand-700 transition-colors"
                >
                  {expanded ? "Thu gọn" : "Xem thêm"}
                </button>
              )}
              {log.changes_applied && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Đã áp dụng thay đổi
                </div>
              )}
            </div>
          </div>
          <div className="ml-9 mt-1">
            <span className="text-xs text-gray-400">{formatTimestamp(log.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type Tab = "menu" | "chat";

export default function HistoryPage() {
  const router = useRouter();
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("menu");

  useEffect(() => {
    const id = localStorage.getItem("family_id");
    if (!id) { router.push("/"); return; }

    fetch(`/api/family?id=${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data: FamilyData) => setFamily(data))
      .catch(() => setError("Không thể tải lịch sử. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, [router]);

  const menuHistory = family?.weekly_menus.slice().reverse() ?? [];
  const chatHistory = family?.ai_chat_logs.slice().reverse() ?? [];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex max-w-4xl mx-auto">
          <SideNav />
          <main className="flex-1 p-4 pb-24 md:pb-4">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-5 animate-pulse" />
            <div className="flex gap-2 mb-5">
              <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-xl w-28 animate-pulse" />
              <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-xl w-28 animate-pulse" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card mb-3 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-24 mb-3" />
                <div className="flex gap-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="text-center">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 mb-1" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-16" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </main>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex max-w-4xl mx-auto">
        <SideNav />
        <main className="flex-1 p-4 pb-24 md:pb-4">

          {/* Header */}
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Lịch sử</h1>

          {/* Error banner */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            {(
              [
                { id: "menu" as Tab, label: "Lịch sử thực đơn", count: menuHistory.length },
                { id: "chat" as Tab, label: "Lịch sử chat AI", count: chatHistory.length },
              ] as const
            ).map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  activeTab === id
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand-300"
                )}
              >
                {label}
                <span
                  className={cn(
                    "text-xs rounded-full px-1.5 py-0.5 font-semibold",
                    activeTab === id
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  )}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Tab: Menu history */}
          {activeTab === "menu" && (
            <div>
              {menuHistory.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">🍽️</div>
                  <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Chưa có thực đơn nào
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Tạo thực đơn tuần đầu tiên để bắt đầu theo dõi lịch sử.
                  </p>
                  <a href="/menu" className="btn-primary inline-block">
                    Tạo thực đơn
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {menuHistory.map((entry) => (
                    <MenuHistoryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Chat history */}
          {activeTab === "chat" && (
            <div>
              {chatHistory.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">🤖</div>
                  <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Chưa có tin nhắn nào
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Trò chuyện với AI để điều chỉnh thực đơn theo nhu cầu gia đình.
                  </p>
                  <a href="/dashboard" className="btn-primary inline-block">
                    Bắt đầu chat
                  </a>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-4">
                  {/* Oldest messages note */}
                  {chatHistory.length >= 100 && (
                    <p className="text-xs text-center text-gray-400 mb-4">
                      Hiển thị 100 tin nhắn gần nhất
                    </p>
                  )}

                  {/* Chat bubbles — latest first */}
                  {chatHistory.map((log) => (
                    <ChatBubblePair key={log.id} log={log} />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
