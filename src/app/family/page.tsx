"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav, SideNav } from "@/components/ui/Nav";
import { cn, getInitials } from "@/lib/utils";
import type { FamilyMember } from "@/lib/store/familyStore";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAL_LABELS: Record<string, string> = {
  tre_nho: "Trẻ nhỏ (mẫu giáo, ≤6 tuổi)",
  hoc_sinh: "Học sinh / Trẻ em đi học",
  van_phong: "Văn phòng / Nhẹ",
  trung_binh: "Trung bình (giáo viên, bán hàng)",
  nang: "Nặng (công nhân, nông dân)",
};

const SPECIAL_LABELS: Record<string, string> = {
  mang_thai_1: "Mang thai T1",
  mang_thai_2: "Mang thai T2",
  mang_thai_3: "Mang thai T3",
  cho_con_bu: "Cho con bú",
};

const DI_UNG_OPTIONS = [
  { value: "hai_san", label: "Hải sản" },
  { value: "dau_phong", label: "Đậu phộng" },
  { value: "gluten", label: "Gluten" },
  { value: "trung", label: "Trứng" },
  { value: "sua", label: "Sữa" },
];

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

interface MemberFormState {
  ten: string;
  tuoi: string;
  gioi_tinh: "nam" | "nu";
  can_nang_kg: string;
  nghe_nghiep: string;
  nghe_nghiep_pal: "van_phong" | "trung_binh" | "nang" | "hoc_sinh" | "tre_nho";
  tinh_trang_dac_biet: string;
  di_ung: string[];
}

const EMPTY_FORM: MemberFormState = {
  ten: "",
  tuoi: "",
  gioi_tinh: "nam",
  can_nang_kg: "",
  nghe_nghiep: "",
  nghe_nghiep_pal: "van_phong",
  tinh_trang_dac_biet: "",
  di_ung: [],
};

// ---------------------------------------------------------------------------
// Helper: stable avatar bg from member index / avatar_color string
// ---------------------------------------------------------------------------

function avatarBgFromColor(color: string, index: number): string {
  // avatar_color is a hex like "#4ade80" — map to a Tailwind bg class by index
  return AVATAR_BG_CLASSES[index % AVATAR_BG_CLASSES.length];
}

// ---------------------------------------------------------------------------
// MemberForm component
// ---------------------------------------------------------------------------

interface MemberFormProps {
  initial?: MemberFormState;
  onSubmit: (data: MemberFormState) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  mode: "add" | "edit";
}

function MemberForm({ initial = EMPTY_FORM, onSubmit, onCancel, submitting, mode }: MemberFormProps) {
  const [form, setForm] = useState<MemberFormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof MemberFormState, string>>>({});

  function set<K extends keyof MemberFormState>(key: K, value: MemberFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function toggleDiUng(val: string) {
    setForm((prev) => ({
      ...prev,
      di_ung: prev.di_ung.includes(val)
        ? prev.di_ung.filter((x) => x !== val)
        : [...prev.di_ung, val],
    }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof MemberFormState, string>> = {};
    if (!form.ten.trim()) errs.ten = "Vui lòng nhập tên";
    const age = Number(form.tuoi);
    if (!form.tuoi || isNaN(age) || age < 0 || age > 120) errs.tuoi = "Tuổi phải từ 0 đến 120";
    if (form.can_nang_kg) {
      const w = Number(form.can_nang_kg);
      if (isNaN(w) || w <= 0 || w > 500) errs.can_nang_kg = "Cân nặng không hợp lệ";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  }

  const isFemale = form.gioi_tinh === "nu";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tên */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tên <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.ten}
          onChange={(e) => set("ten", e.target.value)}
          placeholder="Nguyễn Văn A"
          className={cn(
            "w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white",
            errors.ten ? "border-red-400" : "border-gray-200"
          )}
        />
        {errors.ten && <p className="text-xs text-red-500 mt-1">{errors.ten}</p>}
      </div>

      {/* Tuổi + Giới tính */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tuổi <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={0}
            max={120}
            value={form.tuoi}
            onChange={(e) => {
              set("tuoi", e.target.value);
              const age = Number(e.target.value);
              if (age > 0 && age <= 6) setForm((f) => ({ ...f, tuoi: e.target.value, nghe_nghiep_pal: "tre_nho" }));
              else if (age > 6 && age <= 18) setForm((f) => ({ ...f, tuoi: e.target.value, nghe_nghiep_pal: "hoc_sinh" }));
              else if (age > 18) setForm((f) => ({ ...f, tuoi: e.target.value, nghe_nghiep_pal: f.nghe_nghiep_pal === "tre_nho" || f.nghe_nghiep_pal === "hoc_sinh" ? "van_phong" : f.nghe_nghiep_pal }));
            }}
            placeholder="30"
            className={cn(
              "w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white",
              errors.tuoi ? "border-red-400" : "border-gray-200"
            )}
          />
          {errors.tuoi && <p className="text-xs text-red-500 mt-1">{errors.tuoi}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Giới tính
          </label>
          <div className="flex gap-3 mt-2">
            {(["nam", "nu"] as const).map((g) => (
              <label key={g} className="flex items-center gap-1.5 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="gioi_tinh"
                  value={g}
                  checked={form.gioi_tinh === g}
                  onChange={() => {
                    set("gioi_tinh", g);
                    if (g === "nam") set("tinh_trang_dac_biet", "");
                  }}
                  className="accent-brand-500"
                />
                <span>{g === "nam" ? "♂ Nam" : "♀ Nữ"}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Cân nặng + Nghề nghiệp */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cân nặng (kg)
          </label>
          <input
            type="number"
            min={0}
            max={500}
            step={0.1}
            value={form.can_nang_kg}
            onChange={(e) => set("can_nang_kg", e.target.value)}
            placeholder="60"
            className={cn(
              "w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white",
              errors.can_nang_kg ? "border-red-400" : "border-gray-200"
            )}
          />
          {errors.can_nang_kg && <p className="text-xs text-red-500 mt-1">{errors.can_nang_kg}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nghề nghiệp
          </label>
          <input
            type="text"
            value={form.nghe_nghiep}
            onChange={(e) => set("nghe_nghiep", e.target.value)}
            placeholder="Kỹ sư, giáo viên..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Mức hoạt động */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Mức hoạt động / Đối tượng
        </label>
        <select
          value={form.nghe_nghiep_pal}
          onChange={(e) => set("nghe_nghiep_pal", e.target.value as MemberFormState["nghe_nghiep_pal"])}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <optgroup label="Trẻ em / Học sinh">
            <option value="tre_nho">Trẻ nhỏ ≤6 tuổi (mẫu giáo, ở nhà)</option>
            <option value="hoc_sinh">Học sinh đi học (7–18 tuổi)</option>
          </optgroup>
          <optgroup label="Người lớn">
            <option value="van_phong">Văn phòng / Nhẹ (lập trình, kế toán)</option>
            <option value="trung_binh">Trung bình (giáo viên, bán hàng, nội trợ)</option>
            <option value="nang">Nặng (công nhân, nông dân, bộ đội)</option>
          </optgroup>
        </select>
        {Number(form.tuoi) > 0 && Number(form.tuoi) < 7 && form.nghe_nghiep_pal !== "tre_nho" && (
          <p className="text-xs text-amber-600 mt-1">
            💡 Trẻ dưới 7 tuổi — nên chọn &quot;Trẻ nhỏ ≤6 tuổi&quot;
          </p>
        )}
        {Number(form.tuoi) >= 7 && Number(form.tuoi) <= 18 && !["hoc_sinh"].includes(form.nghe_nghiep_pal) && (
          <p className="text-xs text-amber-600 mt-1">
            💡 Trẻ 7–18 tuổi — nên chọn &quot;Học sinh đi học&quot;
          </p>
        )}
      </div>

      {/* Tình trạng đặc biệt — chỉ hiện với nữ */}
      {isFemale && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tình trạng đặc biệt
          </label>
          <select
            value={form.tinh_trang_dac_biet}
            onChange={(e) => set("tinh_trang_dac_biet", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="">Bình thường</option>
            <option value="mang_thai_1">Mang thai tam cá nguyệt 1</option>
            <option value="mang_thai_2">Mang thai tam cá nguyệt 2</option>
            <option value="mang_thai_3">Mang thai tam cá nguyệt 3</option>
            <option value="cho_con_bu">Cho con bú</option>
          </select>
        </div>
      )}

      {/* Dị ứng */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Dị ứng thực phẩm
        </label>
        <div className="flex flex-wrap gap-2">
          {DI_UNG_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors select-none",
                form.di_ung.includes(opt.value)
                  ? "bg-red-50 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-400"
              )}
            >
              <input
                type="checkbox"
                checked={form.di_ung.includes(opt.value)}
                onChange={() => toggleDiUng(opt.value)}
                className="sr-only"
              />
              {form.di_ung.includes(opt.value) && <span>⚠</span>}
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
        >
          {submitting ? "Đang lưu..." : mode === "add" ? "Thêm thành viên" : "Lưu thay đổi"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// MemberCard component
// ---------------------------------------------------------------------------

interface MemberCardProps {
  member: FamilyMember;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}

function MemberCard({ member, index, onEdit, onDelete, deleting }: MemberCardProps) {
  const bgClass = avatarBgFromColor(member.avatar_color, index);
  const initials = getInitials(member.ten);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Avatar */}
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0",
          bgClass
        )}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
              {member.ten}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {member.gioi_tinh === "nam" ? "♂" : "♀"} {member.tuoi} tuổi
              {member.can_nang_kg ? ` · ${member.can_nang_kg} kg` : ""}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="text-xs text-brand-600 hover:text-brand-800 font-medium px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors dark:hover:bg-brand-900/20"
            >
              Sửa
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 dark:hover:bg-red-900/20"
            >
              {deleting ? "..." : "Xoá"}
            </button>
          </div>
        </div>

        {/* Details row */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {member.nghe_nghiep && (
            <span className="inline-flex items-center text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
              💼 {member.nghe_nghiep}
            </span>
          )}
          <span className="inline-flex items-center text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
            {PAL_LABELS[member.nghe_nghiep_pal] ?? member.nghe_nghiep_pal}
          </span>
          {member.tinh_trang_dac_biet && (
            <span className="inline-flex items-center text-xs bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full">
              🌸 {SPECIAL_LABELS[member.tinh_trang_dac_biet]}
            </span>
          )}
        </div>

        {/* Allergies */}
        {member.di_ung.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {member.di_ung.map((a) => (
              <span
                key={a}
                className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-800"
              >
                ⚠ {DI_UNG_OPTIONS.find((o) => o.value === a)?.label ?? a}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers to convert form ↔ FamilyMember
// ---------------------------------------------------------------------------

function formToPayload(form: MemberFormState): Omit<FamilyMember, "id" | "avatar_color"> {
  return {
    ten: form.ten.trim(),
    tuoi: Number(form.tuoi),
    gioi_tinh: form.gioi_tinh,
    can_nang_kg: form.can_nang_kg ? Number(form.can_nang_kg) : undefined,
    nghe_nghiep: form.nghe_nghiep.trim(),
    nghe_nghiep_pal: form.nghe_nghiep_pal,
    tinh_trang_dac_biet: (form.tinh_trang_dac_biet || null) as FamilyMember["tinh_trang_dac_biet"],
    di_ung: form.di_ung,
  };
}

function memberToForm(member: FamilyMember): MemberFormState {
  return {
    ten: member.ten,
    tuoi: String(member.tuoi),
    gioi_tinh: member.gioi_tinh,
    can_nang_kg: member.can_nang_kg != null ? String(member.can_nang_kg) : "",
    nghe_nghiep: member.nghe_nghiep ?? "",
    nghe_nghiep_pal: member.nghe_nghiep_pal,
    tinh_trang_dac_biet: member.tinh_trang_dac_biet ?? "",
    di_ung: member.di_ung ?? [],
  };
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type UiMode =
  | { type: "list" }
  | { type: "add" }
  | { type: "edit"; memberId: string };

export default function FamilyPage() {
  const router = useRouter();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<UiMode>({ type: "list" });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load family data
  useEffect(() => {
    const id = localStorage.getItem("family_id");
    if (!id) {
      router.push("/");
      return;
    }
    setFamilyId(id);
    fetch(`/api/family?id=${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Không thể tải dữ liệu gia đình");
        return r.json();
      })
      .then((data) => {
        setMembers(data.members ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function handleAdd(form: MemberFormState) {
    if (!familyId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/family", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_id: familyId,
          action: "add_member",
          ...formToPayload(form),
        }),
      });
      if (!res.ok) throw new Error("Thêm thành viên thất bại");
      const newMember: FamilyMember = await res.json();
      setMembers((prev) => [...prev, newMember]);
      setMode({ type: "list" });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(memberId: string, form: MemberFormState) {
    if (!familyId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/family", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_id: familyId,
          action: "update_member",
          member_id: memberId,
          ...formToPayload(form),
        }),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      const updated: FamilyMember = await res.json();
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
      setMode({ type: "list" });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(memberId: string, name: string) {
    if (!familyId) return;
    if (!window.confirm(`Bạn có chắc muốn xoá "${name}" khỏi gia đình?`)) return;
    setDeletingId(memberId);
    try {
      const res = await fetch("/api/family", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family_id: familyId,
          action: "remove_member",
          member_id: memberId,
        }),
      });
      if (!res.ok) throw new Error("Xoá thất bại");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <p className="text-red-500 mb-3">{error}</p>
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

  const editingMember =
    mode.type === "edit" ? members.find((m) => m.id === mode.memberId) : undefined;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex max-w-6xl mx-auto">
        <SideNav />

        <main className="flex-1 p-4 pb-28 md:pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Thành viên gia đình</h1>
              <p className="text-xs text-gray-400 mt-0.5">{members.length} người</p>
            </div>
            {mode.type === "list" && (
              <button
                onClick={() => setMode({ type: "add" })}
                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                <span className="text-base leading-none">+</span>
                Thêm thành viên
              </button>
            )}
          </div>

          {/* Add form */}
          {mode.type === "add" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-brand-100 dark:border-brand-900 p-5 mb-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
                Thêm thành viên mới
              </h2>
              <MemberForm
                onSubmit={handleAdd}
                onCancel={() => setMode({ type: "list" })}
                submitting={submitting}
                mode="add"
              />
            </div>
          )}

          {/* Edit form */}
          {mode.type === "edit" && editingMember && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-brand-100 dark:border-brand-900 p-5 mb-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
                Chỉnh sửa: {editingMember.ten}
              </h2>
              <MemberForm
                initial={memberToForm(editingMember)}
                onSubmit={(form) => handleEdit(editingMember.id, form)}
                onCancel={() => setMode({ type: "list" })}
                submitting={submitting}
                mode="edit"
              />
            </div>
          )}

          {/* Empty state */}
          {members.length === 0 && mode.type === "list" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center shadow-sm">
              <div className="text-5xl mb-4">👨‍👩‍👧</div>
              <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Chưa có thành viên nào
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Thêm các thành viên trong gia đình để tính nhu cầu dinh dưỡng và lên thực đơn phù hợp.
              </p>
              <button
                onClick={() => setMode({ type: "add" })}
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                Thêm thành viên đầu tiên
              </button>
            </div>
          )}

          {/* Member list */}
          {members.length > 0 && (
            <div className="space-y-3">
              {members.map((member, idx) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  index={idx}
                  onEdit={() =>
                    setMode(
                      mode.type === "edit" && mode.memberId === member.id
                        ? { type: "list" }
                        : { type: "edit", memberId: member.id }
                    )
                  }
                  onDelete={() => handleDelete(member.id, member.ten)}
                  deleting={deletingId === member.id}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
