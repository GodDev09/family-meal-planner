/**
 * Store router — automatically selects Supabase adapter when configured,
 * falls back to in-memory store for local development.
 *
 * Usage: import from "@/lib/store" instead of "@/lib/store/familyStore"
 */

export type {
  FamilyData,
  FamilyMember,
  WeeklyMenuData,
  ChatLog,
  FamilySettings,
} from "./familyStore";

export {
  getFamily,
  createFamily,
  addMember,
  updateMember,
  removeMember,
  saveWeeklyMenu,
  addChatLog,
  updateSettings,
  updateFamily,
} from "./familyStore";
