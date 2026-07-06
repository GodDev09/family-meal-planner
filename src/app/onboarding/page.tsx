"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NghePAL = "van_phong" | "trung_binh" | "nang" | "hoc_sinh" | "tre_nho";

interface MemberForm {
  ten: string;
  tuoi: string;
  gioi_tinh: "nam" | "nu";
  nghe_nghiep_pal: NghePAL;
}

const EMPTY_MEMBER: MemberForm = {
  ten: "",
  tuoi: "",
  gioi_tinh: "nam",
  nghe_nghiep_pal: "van_phong",
};

const PAL_OPTIONS: { value: NghePAL; label: string; desc: string }[] = [
  { value: "tre_nho",    label: "Trẻ nhỏ ≤6 tuổi", desc: "Mẫu giáo, ở nhà" },
  { value: "hoc_sinh",   label: "Học sinh",         desc: "Trẻ 7–18 tuổi đi học" },
  { value: "van_phong",  label: "Văn phòng",        desc: "Ngồi nhiều, ít vận động" },
  { value: "trung_binh", label: "Trung bình",       desc: "Đi lại, đứng, lao động nhẹ" },
  { value: "nang",       label: "Nặng",             desc: "Lao động tay chân, luyện tập nhiều" },
];

function suggestPAL(tuoi: number): NghePAL {
  if (tuoi > 0 && tuoi <= 6) return "tre_nho";
  if (tuoi > 6 && tuoi <= 18) return "hoc_sinh";
  return "van_phong";
}

// ---------------------------------------------------------------------------
// Progress dots
// ---------------------------------------------------------------------------

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-300",
            i + 1 === current
              ? "w-6 h-2 bg-brand-500"
              : i + 1 < current
              ? "w-2 h-2 bg-brand-300"
              : "w-2 h-2 bg-gray-200 dark:bg-gray-700"
          )}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Welcome
// ---------------------------------------------------------------------------

function Step1Welcome({
  familyCode,
  onNext,
}: {
  familyCode: string;
  onNext: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(familyCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col items-center text-center gap-4">
      <div className="text-6xl mb-2">🍚</div>
      <h1 className="text-3xl font-bold text-brand-700 dark:text-brand-400">BuaCom.AI</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
        Ứng dụng lên thực đơn 7 ngày cho cả gia đình theo chuẩn dinh dưỡng Việt Nam 2016.
        Cá nhân hoá theo từng thành viên — trẻ em, người lớn tuổi, bà bầu.
      </p>

      {/* Family code card */}
      <div className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mt-2">
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">
          Mã gia đình của bạn
        </p>
        <div className="font-mono text-2xl font-bold text-amber-800 dark:text-amber-300 tracking-widest mb-3">
          {familyCode}
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-500 mb-3 leading-relaxed">
          ⚠️ Lưu mã lại ngay bây giờ! Đây là chìa khoá duy nhất để truy cập dữ liệu gia đình bạn.
          Ai có mã đều xem được — hãy giữ kín.
        </p>
        <button
          onClick={handleCopy}
          className={cn(
            "w-full py-2 rounded-xl text-sm font-medium transition-colors",
            copied
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-800/30 dark:hover:bg-amber-700/40 dark:text-amber-300"
          )}
        >
          {copied ? "✓ Đã sao chép!" : "📋 Sao chép mã"}
        </button>
      </div>

      <button onClick={onNext} className="btn-primary w-full mt-2 text-base py-3">
        Bắt đầu →
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Add members
// ---------------------------------------------------------------------------

function MemberCard({
  member,
  index,
  total,
  onChange,
  onRemove,
}: {
  member: MemberForm;
  index: number;
  total: number;
  onChange: (field: keyof MemberForm, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          Người {index + 1}
        </span>
        {total > 1 && (
          <button
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-600 transition-colors"
            type="button"
          >
            Xoá
          </button>
        )}
      </div>

      {/* Tên */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Họ tên *
        </label>
        <input
          className="input text-sm"
          placeholder="Ví dụ: Nguyễn Văn A"
          value={member.ten}
          onChange={(e) => onChange("ten", e.target.value)}
          maxLength={50}
        />
      </div>

      {/* Tuổi */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Tuổi *
        </label>
        <input
          className="input text-sm"
          type="number"
          placeholder="Ví dụ: 35"
          value={member.tuoi}
          onChange={(e) => {
            onChange("tuoi", e.target.value);
            const age = Number(e.target.value);
            if (age > 0) onChange("nghe_nghiep_pal", suggestPAL(age));
          }}
          min={1}
          max={120}
        />
      </div>

      {/* Giới tính */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Giới tính *
        </label>
        <div className="flex gap-2">
          {(["nam", "nu"] as const).map((g) => (
            <label
              key={g}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border cursor-pointer text-sm font-medium transition-colors",
                member.gioi_tinh === g
                  ? "border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300"
                  : "border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                name={`gioi_tinh_${index}`}
                value={g}
                checked={member.gioi_tinh === g}
                onChange={() => onChange("gioi_tinh", g)}
                className="sr-only"
              />
              {g === "nam" ? "👨 Nam" : "👩 Nữ"}
            </label>
          ))}
        </div>
      </div>

      {/* Nghề nghiệp / PAL */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Mức độ hoạt động *
        </label>
        <div className="space-y-1.5">
          {PAL_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors",
                member.nghe_nghiep_pal === opt.value
                  ? "border-brand-400 bg-brand-50 dark:bg-brand-900/20"
                  : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                name={`pal_${index}`}
                value={opt.value}
                checked={member.nghe_nghiep_pal === opt.value}
                onChange={() => onChange("nghe_nghiep_pal", opt.value)}
                className="mt-0.5 accent-brand-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {opt.label}
                </div>
                <div className="text-xs text-gray-400">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2Members({
  onNext,
}: {
  onNext: (members: MemberForm[]) => void;
}) {
  const [members, setMembers] = useState<MemberForm[]>([{ ...EMPTY_MEMBER }]);
  const [error, setError] = useState("");

  function updateMember(index: number, field: keyof MemberForm, value: string) {
    setMembers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setError("");
  }

  function addMember() {
    setMembers((prev) => [...prev, { ...EMPTY_MEMBER }]);
  }

  function removeMember(index: number) {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): string | null {
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.ten.trim()) return `Người ${i + 1}: Vui lòng nhập họ tên`;
      const age = parseInt(m.tuoi, 10);
      if (!m.tuoi || isNaN(age) || age < 1 || age > 120)
        return `Người ${i + 1}: Tuổi không hợp lệ (1–120)`;
    }
    return null;
  }

  function handleNext() {
    const err = validate();
    if (err) { setError(err); return; }
    onNext(members);
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thêm thành viên</h2>
        <p className="text-sm text-gray-500 mt-1">
          Thêm tất cả thành viên trong gia đình để tính đúng nhu cầu dinh dưỡng
        </p>
      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {members.map((m, i) => (
          <MemberCard
            key={i}
            member={m}
            index={i}
            total={members.length}
            onChange={(field, val) => updateMember(i, field, val)}
            onRemove={() => removeMember(i)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addMember}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-brand-300 dark:border-brand-700 text-brand-600 dark:text-brand-400 text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
      >
        + Thêm người khác
      </button>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button onClick={handleNext} className="btn-primary w-full py-3 text-base">
        Tạo thực đơn →
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Generate menu
// ---------------------------------------------------------------------------

function Step3Generate({
  familyId,
  members,
}: {
  familyId: string;
  members: MemberForm[];
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"saving" | "generating" | "done" | "error">("saving");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // 1. Save all members sequentially
        setPhase("saving");
        for (const m of members) {
          const res = await fetch("/api/family", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              family_id: familyId,
              action: "add_member",
              ten: m.ten.trim(),
              tuoi: parseInt(m.tuoi, 10),
              gioi_tinh: m.gioi_tinh,
              nghe_nghiep: m.nghe_nghiep_pal,
              nghe_nghiep_pal: m.nghe_nghiep_pal,
              di_ung: [],
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? `Lỗi khi lưu thành viên: ${m.ten}`);
          }
          if (cancelled) return;
        }

        // 2. Generate menu
        setPhase("generating");
        const menuRes = await fetch("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ family_id: familyId }),
        });
        if (!menuRes.ok) {
          const data = await menuRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Không tạo được thực đơn");
        }

        if (cancelled) return;
        setPhase("done");
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : "Lỗi không xác định");
          setPhase("error");
        }
      }
    }

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center text-center gap-5 py-4">
      {phase === "saving" && (
        <>
          <div className="w-16 h-16 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Đang lưu thành viên...</h2>
            <p className="text-sm text-gray-500 mt-1">Lưu hồ sơ {members.length} thành viên</p>
          </div>
        </>
      )}

      {phase === "generating" && (
        <>
          <div className="w-16 h-16 rounded-full bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-accent-300 border-t-accent-600 rounded-full animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Đang tạo thực đơn...</h2>
            <p className="text-sm text-gray-500 mt-1">
              Tính toán dinh dưỡng và chọn món phù hợp cho gia đình
            </p>
          </div>
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-accent-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </>
      )}

      {phase === "done" && (
        <>
          <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-3xl">
            🎉
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Xong rồi!</h2>
            <p className="text-sm text-gray-500 mt-1">
              Thực đơn 7 ngày đã sẵn sàng cho gia đình bạn
            </p>
          </div>
          <button
            onClick={() => router.push("/menu")}
            className="btn-primary text-base py-3 px-8 mt-2"
          >
            Xem thực đơn →
          </button>
        </>
      )}

      {phase === "error" && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Có lỗi xảy ra</h2>
            <p className="text-sm text-red-500 mt-1">{errorMsg}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-secondary mt-2"
          >
            Về trang chủ
          </button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberForm[]>([]);

  useEffect(() => {
    const id = localStorage.getItem("family_id");
    if (!id) {
      router.replace("/");
      return;
    }
    setFamilyId(id);

    // If family already has members, skip onboarding
    fetch(`/api/family?id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.members) && data.members.length > 0) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        // ignore — let user proceed
      });
  }, [router]);

  function handleStep2Done(submittedMembers: MemberForm[]) {
    setMembers(submittedMembers);
    setStep(3);
  }

  if (!familyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-accent-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Step label */}
        <p className="text-center text-xs text-gray-400 font-medium mb-3 uppercase tracking-widest">
          Bước {step} / 3
        </p>

        {/* Progress dots */}
        <StepDots current={step} total={3} />

        {/* Card */}
        <div className="card">
          {step === 1 && (
            <Step1Welcome
              familyCode={familyId}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <Step2Members onNext={handleStep2Done} />
          )}
          {step === 3 && (
            <Step3Generate familyId={familyId} members={members} />
          )}
        </div>

        {/* Skip link (step 2 only) */}
        {step === 2 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Bạn có thể thêm thành viên sau tại trang{" "}
            <button
              onClick={() => router.push("/family")}
              className="underline hover:text-gray-600 transition-colors"
            >
              Gia đình
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
