"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateFamilyCode, isValidFamilyCode, normalizeFamilyCode } from "@/lib/auth/familyCode";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "create">("login");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    setError("");
    try {
      const newCode = generateFamilyCode();
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family_id: newCode }),
      });
      if (!res.ok) throw new Error("Không tạo được hồ sơ gia đình");
      localStorage.setItem("family_id", newCode);
      router.push("/onboarding"); // new family → onboarding wizard
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const normalized = normalizeFamilyCode(code);
    if (!isValidFamilyCode(normalized)) {
      setError("Mã không hợp lệ. Kiểm tra lại định dạng FAM-XXXXXXXX");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/family?id=${encodeURIComponent(normalized)}`);
      if (res.status === 404) {
        setError("Không tìm thấy hồ sơ gia đình với mã này");
        return;
      }
      if (!res.ok) throw new Error("Lỗi kết nối");
      localStorage.setItem("family_id", normalized);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍚</div>
          <h1 className="text-3xl font-bold text-brand-700">BuaCom.AI</h1>
          <p className="text-gray-500 mt-1 text-sm">Thực đơn gia đình Việt theo chuẩn dinh dưỡng 2016</p>
        </div>

        <div className="card">
          {/* Tabs */}
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(["login", "create"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m
                    ? "bg-white dark:bg-gray-700 text-brand-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "login" ? "Đã có mã" : "Tạo mới"}
              </button>
            ))}
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mã gia đình
                </label>
                <input
                  className="input font-mono text-lg tracking-widest"
                  placeholder="FAM-XXXXXXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={12}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Đang tìm..." : "Vào hồ sơ gia đình"}
              </button>
              <p className="text-xs text-gray-400 text-center">
                Mã giống chìa khoá nhà — ai có mã đều xem được dữ liệu. Hãy giữ kín.
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hệ thống sẽ tạo mã định danh duy nhất cho gia đình bạn. Lưu lại mã để đăng nhập lần sau.
              </p>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button onClick={handleCreate} className="btn-primary w-full" disabled={loading}>
                {loading ? "Đang tạo..." : "Tạo hồ sơ gia đình mới"}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Đây là công cụ gợi ý tham khảo, không thay thế tư vấn y khoa.
        </p>
      </div>
    </div>
  );
}
