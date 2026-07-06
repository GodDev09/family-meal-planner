import { generateId } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FamilyMember {
  id: string;
  ten: string;
  tuoi: number;
  gioi_tinh: "nam" | "nu";
  can_nang_kg?: number;
  nghe_nghiep: string;
  nghe_nghiep_pal: "van_phong" | "trung_binh" | "nang" | "hoc_sinh" | "tre_nho";
  tinh_trang_dac_biet?: "mang_thai_1" | "mang_thai_2" | "mang_thai_3" | "cho_con_bu" | null;
  di_ung: string[];
  avatar_color: string;
}

export interface WeeklyMenuData {
  id: string;
  week_start: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menu_data: any;
  created_at: string;
}

export interface ChatLog {
  id: string;
  timestamp: string;
  user_message: string;
  ai_response: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  changes_applied: any | null;
}

export interface FamilySettings {
  vung_mien_uu_tien: Array<"bac" | "trung" | "nam">;
  budget_level: "thap" | "trung" | "cao";
  locked_dishes: Array<{ date: string; meal_slot: string; dish_id: string }>;
}

export interface FamilyData {
  family_id: string;
  created_at: string;
  members: FamilyMember[];
  weekly_menus: WeeklyMenuData[];
  ai_chat_logs: ChatLog[];
  settings: FamilySettings;
}

// ---------------------------------------------------------------------------
// Avatar color palette
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  "#4ade80", "#60a5fa", "#f97316", "#a78bfa",
  "#fb7185", "#34d399", "#fbbf24", "#38bdf8",
];

let _colorIndex = 0;
function nextAvatarColor(): string {
  return AVATAR_COLORS[_colorIndex++ % AVATAR_COLORS.length];
}

// ---------------------------------------------------------------------------
// In-memory store (module-level Map — survives hot-reload in dev)
// ---------------------------------------------------------------------------

const _store: Map<string, FamilyData> =
  // @ts-expect-error attach to global for HMR persistence in dev
  (globalThis.__familyStore ??= new Map<string, FamilyData>());

function defaultSettings(): FamilySettings {
  return { vung_mien_uu_tien: ["bac", "trung", "nam"], budget_level: "trung", locked_dishes: [] };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getFamily(familyId: string): FamilyData | null {
  return _store.get(familyId) ?? null;
}

export function createFamily(familyId: string): FamilyData {
  const data: FamilyData = {
    family_id: familyId,
    created_at: new Date().toISOString(),
    members: [],
    weekly_menus: [],
    ai_chat_logs: [],
    settings: defaultSettings(),
  };
  _store.set(familyId, data);
  return data;
}

export function updateFamily(
  familyId: string,
  updater: (data: FamilyData) => FamilyData
): FamilyData | null {
  const existing = _store.get(familyId);
  if (!existing) return null;
  const updated = updater(structuredClone(existing));
  _store.set(familyId, updated);
  return updated;
}

export function addMember(
  familyId: string,
  member: Omit<FamilyMember, "id" | "avatar_color">
): FamilyMember | null {
  const family = _store.get(familyId);
  if (!family) return null;
  const newMember: FamilyMember = {
    ...member,
    id: generateId("mem"),
    avatar_color: nextAvatarColor(),
  };
  family.members.push(newMember);
  return newMember;
}

export function updateMember(
  familyId: string,
  memberId: string,
  updates: Partial<Omit<FamilyMember, "id" | "avatar_color">>
): FamilyMember | null {
  const family = _store.get(familyId);
  if (!family) return null;
  const idx = family.members.findIndex((m) => m.id === memberId);
  if (idx === -1) return null;
  family.members[idx] = { ...family.members[idx], ...updates };
  return family.members[idx];
}

export function removeMember(familyId: string, memberId: string): boolean {
  const family = _store.get(familyId);
  if (!family) return false;
  const before = family.members.length;
  family.members = family.members.filter((m) => m.id !== memberId);
  return family.members.length < before;
}

export function saveWeeklyMenu(familyId: string, menu: Omit<WeeklyMenuData, "id" | "created_at">): WeeklyMenuData | null {
  const family = _store.get(familyId);
  if (!family) return null;
  const entry: WeeklyMenuData = {
    ...menu,
    id: generateId("menu"),
    created_at: new Date().toISOString(),
  };
  // Replace if same week_start exists
  const idx = family.weekly_menus.findIndex((m) => m.week_start === menu.week_start);
  if (idx !== -1) family.weekly_menus[idx] = entry;
  else family.weekly_menus.push(entry);
  return entry;
}

export function addChatLog(
  familyId: string,
  log: Omit<ChatLog, "id" | "timestamp">
): ChatLog | null {
  const family = _store.get(familyId);
  if (!family) return null;
  const entry: ChatLog = { ...log, id: generateId("chat"), timestamp: new Date().toISOString() };
  family.ai_chat_logs.push(entry);
  // Keep last 100 logs
  if (family.ai_chat_logs.length > 100) family.ai_chat_logs = family.ai_chat_logs.slice(-100);
  return entry;
}

export function updateSettings(
  familyId: string,
  settings: Partial<FamilySettings>
): FamilySettings | null {
  const family = _store.get(familyId);
  if (!family) return null;
  family.settings = { ...family.settings, ...settings };
  return family.settings;
}
