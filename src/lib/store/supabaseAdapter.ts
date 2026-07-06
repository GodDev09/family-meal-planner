/**
 * Supabase DB adapter — drop-in replacement for in-memory familyStore.
 * Activated when SUPABASE_URL + SUPABASE_ANON_KEY are set in environment.
 *
 * SQL schema (run once in Supabase SQL editor):
 *
 * CREATE TABLE families (
 *   family_id TEXT PRIMARY KEY,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   settings JSONB DEFAULT '{}'
 * );
 *
 * CREATE TABLE family_members (
 *   id TEXT PRIMARY KEY,
 *   family_id TEXT REFERENCES families(family_id) ON DELETE CASCADE,
 *   ten TEXT NOT NULL,
 *   tuoi REAL NOT NULL,
 *   gioi_tinh TEXT NOT NULL,
 *   can_nang_kg REAL,
 *   nghe_nghiep TEXT,
 *   nghe_nghiep_pal TEXT NOT NULL,
 *   tinh_trang_dac_biet TEXT,
 *   di_ung TEXT[] DEFAULT '{}',
 *   avatar_color TEXT NOT NULL
 * );
 *
 * CREATE TABLE weekly_menus (
 *   id TEXT PRIMARY KEY,
 *   family_id TEXT REFERENCES families(family_id) ON DELETE CASCADE,
 *   week_start DATE NOT NULL,
 *   menu_data JSONB NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   UNIQUE(family_id, week_start)
 * );
 *
 * CREATE TABLE ai_chat_logs (
 *   id TEXT PRIMARY KEY,
 *   family_id TEXT REFERENCES families(family_id) ON DELETE CASCADE,
 *   timestamp TIMESTAMPTZ DEFAULT NOW(),
 *   user_message TEXT NOT NULL,
 *   ai_response TEXT NOT NULL,
 *   changes_applied JSONB
 * );
 *
 * -- Enable Row Level Security (recommended for production)
 * ALTER TABLE families ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE weekly_menus ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE ai_chat_logs ENABLE ROW LEVEL SECURITY;
 */

import { generateId } from "@/lib/utils";
import type {
  FamilyData,
  FamilyMember,
  WeeklyMenuData,
  ChatLog,
  FamilySettings,
} from "./familyStore";

// Lazy-initialise client once
let _client: ReturnType<typeof createSupabaseClient> | null = null;

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
  // Dynamic import so supabase-js is tree-shaken when not configured
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, key);
}

function getClient() {
  if (!_client) _client = createSupabaseClient();
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

const DEFAULT_SETTINGS: FamilySettings = {
  vung_mien_uu_tien: ["bac", "trung", "nam"],
  budget_level: "trung",
  locked_dishes: [],
};

async function buildFamilyData(familyId: string): Promise<FamilyData | null> {
  const db = getClient();

  const { data: family, error: famErr } = await db
    .from("families")
    .select("*")
    .eq("family_id", familyId)
    .single();
  if (famErr || !family) return null;

  const { data: members } = await db
    .from("family_members")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: true });

  const { data: menus } = await db
    .from("weekly_menus")
    .select("*")
    .eq("family_id", familyId)
    .order("week_start", { ascending: false })
    .limit(10);

  const { data: logs } = await db
    .from("ai_chat_logs")
    .select("*")
    .eq("family_id", familyId)
    .order("timestamp", { ascending: false })
    .limit(50);

  return {
    family_id: familyId,
    created_at: family.created_at,
    members: (members ?? []) as FamilyMember[],
    weekly_menus: ((menus ?? []) as WeeklyMenuData[]).reverse(),
    ai_chat_logs: ((logs ?? []) as ChatLog[]).reverse(),
    settings: (family.settings as FamilySettings) ?? DEFAULT_SETTINGS,
  };
}

export async function getFamily(familyId: string): Promise<FamilyData | null> {
  return buildFamilyData(familyId);
}

export async function createFamily(familyId: string): Promise<FamilyData> {
  const db = getClient();
  await db.from("families").insert({ family_id: familyId, settings: DEFAULT_SETTINGS });
  return {
    family_id: familyId,
    created_at: new Date().toISOString(),
    members: [],
    weekly_menus: [],
    ai_chat_logs: [],
    settings: DEFAULT_SETTINGS,
  };
}

export async function addMember(
  familyId: string,
  member: Omit<FamilyMember, "id" | "avatar_color">
): Promise<FamilyMember | null> {
  const db = getClient();
  const COLORS = ["#4ade80","#60a5fa","#f97316","#a78bfa","#fb7185","#34d399","#fbbf24","#38bdf8"];
  const { data: existing } = await db.from("family_members").select("id").eq("family_id", familyId);
  const avatar_color = COLORS[(existing?.length ?? 0) % COLORS.length];
  const newMember: FamilyMember = { ...member, id: generateId("mem"), avatar_color };
  const { error } = await db.from("family_members").insert({ ...newMember, family_id: familyId });
  if (error) return null;
  return newMember;
}

export async function updateMember(
  familyId: string,
  memberId: string,
  updates: Partial<Omit<FamilyMember, "id" | "avatar_color">>
): Promise<FamilyMember | null> {
  const db = getClient();
  const { data, error } = await db
    .from("family_members")
    .update(updates)
    .eq("id", memberId)
    .eq("family_id", familyId)
    .select()
    .single();
  if (error) return null;
  return data as FamilyMember;
}

export async function removeMember(familyId: string, memberId: string): Promise<boolean> {
  const db = getClient();
  const { error } = await db
    .from("family_members")
    .delete()
    .eq("id", memberId)
    .eq("family_id", familyId);
  return !error;
}

export async function saveWeeklyMenu(
  familyId: string,
  menu: Omit<WeeklyMenuData, "id" | "created_at">
): Promise<WeeklyMenuData | null> {
  const db = getClient();
  const id = generateId("menu");
  const { data, error } = await db
    .from("weekly_menus")
    .upsert(
      { id, family_id: familyId, week_start: menu.week_start, menu_data: menu.menu_data },
      { onConflict: "family_id,week_start" }
    )
    .select()
    .single();
  if (error) return null;
  return { id: data.id, week_start: data.week_start, menu_data: data.menu_data, created_at: data.created_at };
}

export async function addChatLog(
  familyId: string,
  log: Omit<ChatLog, "id" | "timestamp">
): Promise<ChatLog | null> {
  const db = getClient();
  const entry = { ...log, id: generateId("chat"), family_id: familyId };
  const { data, error } = await db.from("ai_chat_logs").insert(entry).select().single();
  if (error) return null;
  return { id: data.id, timestamp: data.timestamp, user_message: data.user_message, ai_response: data.ai_response, changes_applied: data.changes_applied };
}

export async function updateSettings(
  familyId: string,
  settings: Partial<FamilySettings>
): Promise<FamilySettings | null> {
  const db = getClient();
  const { data: current } = await db.from("families").select("settings").eq("family_id", familyId).single();
  if (!current) return null;
  const merged = { ...(current.settings ?? DEFAULT_SETTINGS), ...settings };
  const { error } = await db.from("families").update({ settings: merged }).eq("family_id", familyId);
  if (error) return null;
  return merged as FamilySettings;
}
