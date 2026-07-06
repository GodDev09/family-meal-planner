/**
 * SQLite store — drop-in replacement for familyStore.ts (in-memory).
 * Uses better-sqlite3 (synchronous API). DB file: ./data/buacom.db
 *
 * All functions have identical signatures to familyStore.ts so API routes
 * only need to change their import path.
 */

import { db } from "@/lib/db/client";
import { generateId } from "@/lib/utils";
import type {
  FamilyData,
  FamilyMember,
  WeeklyMenuData,
  ChatLog,
  FamilySettings,
} from "./familyStore";

// Re-export types so callers can `import type { FamilyMember } from "@/lib/store/sqliteStore"`
export type { FamilyData, FamilyMember, WeeklyMenuData, ChatLog, FamilySettings };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  "#4ade80", "#60a5fa", "#f97316", "#a78bfa",
  "#fb7185", "#34d399", "#fbbf24", "#38bdf8",
];

const DEFAULT_SETTINGS: FamilySettings = {
  vung_mien_uu_tien: ["bac", "trung", "nam"],
  budget_level: "trung",
  locked_dishes: [],
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function buildFamilyData(familyId: string): FamilyData | null {
  const row = db.prepare("SELECT * FROM families WHERE family_id = ?").get(familyId) as
    { family_id: string; created_at: string; settings: string } | undefined;
  if (!row) return null;

  const members = (db.prepare(
    "SELECT * FROM family_members WHERE family_id = ? ORDER BY created_at ASC"
  ).all(familyId) as Array<Record<string, unknown>>).map(rowToMember);

  const menus = (db.prepare(
    "SELECT id, family_id, week_start, menu_data, created_at FROM weekly_menus WHERE family_id = ? ORDER BY week_start DESC LIMIT 10"
  ).all(familyId) as Array<{ id: string; week_start: string; menu_data: string; created_at: string }>)
    .map((r) => ({ id: r.id, week_start: r.week_start, menu_data: parseJson(r.menu_data, {}), created_at: r.created_at }))
    .reverse();

  const logs = (db.prepare(
    "SELECT * FROM ai_chat_logs WHERE family_id = ? ORDER BY timestamp DESC LIMIT 50"
  ).all(familyId) as Array<{ id: string; timestamp: string; user_message: string; ai_response: string; changes_applied: string | null }>)
    .map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      user_message: r.user_message,
      ai_response: r.ai_response,
      changes_applied: parseJson(r.changes_applied, null),
    }))
    .reverse();

  return {
    family_id: familyId,
    created_at: row.created_at,
    members,
    weekly_menus: menus as WeeklyMenuData[],
    ai_chat_logs: logs,
    settings: parseJson<FamilySettings>(row.settings, DEFAULT_SETTINGS),
  };
}

function rowToMember(r: Record<string, unknown>): FamilyMember {
  return {
    id: r.id as string,
    ten: r.ten as string,
    tuoi: r.tuoi as number,
    gioi_tinh: r.gioi_tinh as "nam" | "nu",
    can_nang_kg: r.can_nang_kg as number | undefined,
    nghe_nghiep: r.nghe_nghiep as string,
    nghe_nghiep_pal: r.nghe_nghiep_pal as "van_phong" | "trung_binh" | "nang",
    tinh_trang_dac_biet: (r.tinh_trang_dac_biet as string | null) as FamilyMember["tinh_trang_dac_biet"],
    di_ung: parseJson<string[]>(r.di_ung as string, []),
    avatar_color: r.avatar_color as string,
  };
}

// ---------------------------------------------------------------------------
// Public API (matches familyStore.ts exactly)
// ---------------------------------------------------------------------------

export function getFamily(familyId: string): FamilyData | null {
  return buildFamilyData(familyId);
}

export function createFamily(familyId: string): FamilyData {
  db.prepare("INSERT INTO families (family_id, settings) VALUES (?, ?)")
    .run(familyId, JSON.stringify(DEFAULT_SETTINGS));
  return buildFamilyData(familyId)!;
}

export function updateFamily(
  familyId: string,
  updater: (data: FamilyData) => FamilyData
): FamilyData | null {
  const existing = buildFamilyData(familyId);
  if (!existing) return null;
  // updater may change settings — persist that
  const updated = updater(existing);
  db.prepare("UPDATE families SET settings = ? WHERE family_id = ?")
    .run(JSON.stringify(updated.settings), familyId);
  return buildFamilyData(familyId);
}

export function addMember(
  familyId: string,
  member: Omit<FamilyMember, "id" | "avatar_color">
): FamilyMember | null {
  const family = db.prepare("SELECT family_id FROM families WHERE family_id = ?").get(familyId);
  if (!family) return null;

  const count = (db.prepare("SELECT COUNT(*) as c FROM family_members WHERE family_id = ?").get(familyId) as { c: number }).c;
  const avatar_color = AVATAR_COLORS[count % AVATAR_COLORS.length];
  const id = generateId("mem");

  db.prepare(`
    INSERT INTO family_members
      (id, family_id, ten, tuoi, gioi_tinh, can_nang_kg, nghe_nghiep, nghe_nghiep_pal, tinh_trang_dac_biet, di_ung, avatar_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, familyId, member.ten, member.tuoi, member.gioi_tinh,
    member.can_nang_kg ?? null, member.nghe_nghiep ?? null,
    member.nghe_nghiep_pal, member.tinh_trang_dac_biet ?? null,
    JSON.stringify(member.di_ung), avatar_color
  );

  return rowToMember(db.prepare("SELECT * FROM family_members WHERE id = ?").get(id) as Record<string, unknown>);
}

export function updateMember(
  familyId: string,
  memberId: string,
  updates: Partial<Omit<FamilyMember, "id" | "avatar_color">>
): FamilyMember | null {
  const existing = db.prepare("SELECT * FROM family_members WHERE id = ? AND family_id = ?").get(memberId, familyId) as Record<string, unknown> | undefined;
  if (!existing) return null;

  const merged = { ...rowToMember(existing), ...updates };
  db.prepare(`
    UPDATE family_members SET
      ten = ?, tuoi = ?, gioi_tinh = ?, can_nang_kg = ?,
      nghe_nghiep = ?, nghe_nghiep_pal = ?, tinh_trang_dac_biet = ?, di_ung = ?
    WHERE id = ? AND family_id = ?
  `).run(
    merged.ten, merged.tuoi, merged.gioi_tinh, merged.can_nang_kg ?? null,
    merged.nghe_nghiep ?? null, merged.nghe_nghiep_pal,
    merged.tinh_trang_dac_biet ?? null, JSON.stringify(merged.di_ung),
    memberId, familyId
  );

  return rowToMember(db.prepare("SELECT * FROM family_members WHERE id = ?").get(memberId) as Record<string, unknown>);
}

export function removeMember(familyId: string, memberId: string): boolean {
  const result = db.prepare("DELETE FROM family_members WHERE id = ? AND family_id = ?").run(memberId, familyId);
  return result.changes > 0;
}

export function saveWeeklyMenu(
  familyId: string,
  menu: Omit<WeeklyMenuData, "id" | "created_at">
): WeeklyMenuData | null {
  const family = db.prepare("SELECT family_id FROM families WHERE family_id = ?").get(familyId);
  if (!family) return null;

  const id = generateId("menu");
  db.prepare(`
    INSERT INTO weekly_menus (id, family_id, week_start, menu_data)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(family_id, week_start) DO UPDATE SET menu_data = excluded.menu_data, id = excluded.id
  `).run(id, familyId, menu.week_start, JSON.stringify(menu.menu_data));

  const row = db.prepare("SELECT * FROM weekly_menus WHERE family_id = ? AND week_start = ?")
    .get(familyId, menu.week_start) as { id: string; week_start: string; menu_data: string; created_at: string };

  return { id: row.id, week_start: row.week_start, menu_data: parseJson(row.menu_data, {}), created_at: row.created_at };
}

export function addChatLog(
  familyId: string,
  log: Omit<ChatLog, "id" | "timestamp">
): ChatLog | null {
  const family = db.prepare("SELECT family_id FROM families WHERE family_id = ?").get(familyId);
  if (!family) return null;

  const id = generateId("chat");
  const timestamp = new Date().toISOString();
  db.prepare(`
    INSERT INTO ai_chat_logs (id, family_id, timestamp, user_message, ai_response, changes_applied)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, familyId, timestamp, log.user_message, log.ai_response,
    log.changes_applied != null ? JSON.stringify(log.changes_applied) : null);

  // Keep last 100 logs
  db.prepare(`
    DELETE FROM ai_chat_logs WHERE family_id = ? AND id NOT IN (
      SELECT id FROM ai_chat_logs WHERE family_id = ? ORDER BY timestamp DESC LIMIT 100
    )
  `).run(familyId, familyId);

  return { id, timestamp, user_message: log.user_message, ai_response: log.ai_response, changes_applied: log.changes_applied };
}

export function updateSettings(
  familyId: string,
  settings: Partial<FamilySettings>
): FamilySettings | null {
  const row = db.prepare("SELECT settings FROM families WHERE family_id = ?").get(familyId) as { settings: string } | undefined;
  if (!row) return null;
  const current = parseJson<FamilySettings>(row.settings, DEFAULT_SETTINGS);
  const merged = { ...current, ...settings };
  db.prepare("UPDATE families SET settings = ? WHERE family_id = ?").run(JSON.stringify(merged), familyId);
  return merged;
}
