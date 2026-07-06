"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BottomNav, SideNav } from "@/components/ui/Nav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

type Region = "Bắc" | "Trung" | "Nam";
type Budget = "Thấp" | "Trung bình" | "Cao";

const ALL_REGIONS: Region[] = ["Bắc", "Trung", "Nam"];
const ALL_BUDGETS: Budget[] = ["Thấp", "Trung bình", "Cao"];

export default function SettingsPage() {
  const router = useRouter();

  // --- Family code ---
  const [familyCode, setFamilyCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // --- Region preferences ---
  const [regions, setRegions] = useState<Region[]>(["Bắc", "Trung", "Nam"]);

  // --- Budget ---
  const [budget, setBudget] = useState<Budget>("Trung bình");

  // --- Saving state ---
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const code = localStorage.getItem("familyCode") ?? "";
      setFamilyCode(code);

      const storedRegions = localStorage.getItem("preferredRegions");
      if (storedRegions) {
        const parsed = JSON.parse(storedRegions) as Region[];
        if (Array.isArray(parsed) && parsed.length > 0) setRegions(parsed);
      }

      const storedBudget = localStorage.getItem("shoppingBudget") as Budget | null;
      if (storedBudget && ALL_BUDGETS.includes(storedBudget)) {
        setBudget(storedBudget);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // --- Copy family code ---
  const handleCopy = useCallback(() => {
    if (!familyCode) return;
    navigator.clipboard.writeText(familyCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [familyCode]);

  // --- Save settings to API ---
  const saveSettings = useCallback(
    async (newRegions: Region[], newBudget: Budget) => {
      setSaving(true);
      setSaveError(null);
      try {
        localStorage.setItem("preferredRegions", JSON.stringify(newRegions));
        localStorage.setItem("shoppingBudget", newBudget);

        const res = await fetch("/api/family", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_settings",
            preferred_regions: newRegions,
            shopping_budget: newBudget,
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Lưu thất bại");
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const handleRegionToggle = (region: Region) => {
    const next = regions.includes(region)
      ? regions.length === 1
        ? regions
        : regions.filter((r) => r !== region)
      : [...regions, region];
    setRegions(next);
    void saveSettings(next, budget);
  };

  const handleBudgetChange = (b: Budget) => {
    setBudget(b);
    void saveSettings(regions, b);
  };

  // --- Export JSON ---
  const handleExport = () => {
    try {
      const data: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key) ?? "null");
          } catch {
            data[key] = localStorage.getItem(key);
          }
        }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `family-meal-planner-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Không thể xuất dữ liệu.");
    }
  };

  // --- Delete all data ---
  const handleDeleteAll = () => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xoá toàn bộ dữ liệu? Hành động này không thể hoàn tác."
    );
    if (!confirmed) return;
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <SideNav />

      <main className="flex-1 px-4 pt-6 pb-28 md:pb-8 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Cài đặt
          </h1>
          <ThemeToggle />
        </div>

        <div className="flex flex-col gap-5">
          {/* ── Section 1: Family Code ── */}
          <Section title="Mã gia đình">
            <div className="flex items-center gap-3">
              <code className="flex-1 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm font-mono text-gray-700 dark:text-gray-200 truncate">
                {familyCode || <span className="text-gray-400">Chưa có mã</span>}
              </code>
              <button
                onClick={handleCopy}
                disabled={!familyCode}
                className={cn(
                  "shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  copied
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40"
                )}
              >
                {copied ? "Đã sao chép!" : "Sao chép"}
              </button>
            </div>
          </Section>

          {/* ── Section 2: Region Preferences ── */}
          <Section
            title="Vùng miền ưu tiên"
            subtitle="Chọn các vùng ẩm thực bạn muốn gợi ý"
          >
            <div className="flex gap-3">
              {ALL_REGIONS.map((region) => {
                const active = regions.includes(region);
                return (
                  <button
                    key={region}
                    onClick={() => handleRegionToggle(region)}
                    className={cn(
                      "flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors",
                      active
                        ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-400"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                    )}
                  >
                    {region}
                  </button>
                );
              })}
            </div>
            {saveError && (
              <p className="mt-2 text-xs text-red-500">{saveError}</p>
            )}
            {saving && (
              <p className="mt-2 text-xs text-gray-400">Đang lưu…</p>
            )}
          </Section>

          {/* ── Section 3: Budget ── */}
          <Section
            title="Ngân sách đi chợ"
            subtitle="Mức chi tiêu trung bình mỗi ngày"
          >
            <div className="flex flex-col gap-2">
              {ALL_BUDGETS.map((b) => (
                <label
                  key={b}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors",
                    budget === b
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-950 dark:border-brand-400"
                      : "border-gray-200 bg-white hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700"
                  )}
                >
                  <input
                    type="radio"
                    name="budget"
                    value={b}
                    checked={budget === b}
                    onChange={() => handleBudgetChange(b)}
                    className="accent-brand-600 w-4 h-4"
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      budget === b
                        ? "text-brand-700 dark:text-brand-300"
                        : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {b}
                  </span>
                </label>
              ))}
            </div>
          </Section>

          {/* ── Section 4: Theme ── */}
          <Section
            title="Chế độ hiển thị"
            subtitle="Chuyển đổi giữa giao diện sáng và tối"
          >
            <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Giao diện tối
              </span>
              <DarkModeToggle />
            </div>
          </Section>

          {/* ── Section 5: Export ── */}
          <Section
            title="Xuất dữ liệu"
            subtitle="Tải xuống toàn bộ dữ liệu dưới dạng JSON"
          >
            <button
              onClick={handleExport}
              className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
            >
              Xuất JSON
            </button>
          </Section>

          {/* ── Section 6: Danger zone ── */}
          <Section
            title="Vùng nguy hiểm"
            titleClass="text-red-600 dark:text-red-400"
          >
            <button
              onClick={handleDeleteAll}
              className="w-full rounded-xl border-2 border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              Xoá toàn bộ dữ liệu
            </button>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Hành động này sẽ xoá toàn bộ dữ liệu cục bộ và không thể hoàn
              tác.
            </p>
          </Section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({
  title,
  titleClass,
  subtitle,
  children,
}: {
  title: string;
  titleClass?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
      <h2
        className={cn(
          "text-base font-semibold mb-1",
          titleClass ?? "text-gray-900 dark:text-gray-100"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {subtitle}
        </p>
      )}
      {!subtitle && <div className="mb-3" />}
      {children}
    </div>
  );
}

function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    document.documentElement.classList.toggle("dark");
    setDark((prev) => !prev);
  };

  return (
    <button
      role="switch"
      aria-checked={dark}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        dark ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-600"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          dark ? "translate-x-6" : "translate-x-1"
        )}
      />
      <span className="sr-only">{dark ? "Tắt giao diện tối" : "Bật giao diện tối"}</span>
    </button>
  );
}
