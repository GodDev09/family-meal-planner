import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "buacom.db");

// Ensure data dir exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Singleton connection (survive Next.js HMR in dev)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _global = globalThis as any;
if (!_global.__sqliteDb) {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  _global.__sqliteDb = db;
}

export const db: Database.Database = _global.__sqliteDb;

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS families (
      family_id   TEXT PRIMARY KEY,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      settings    TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS family_members (
      id                   TEXT PRIMARY KEY,
      family_id            TEXT NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
      ten                  TEXT NOT NULL,
      tuoi                 REAL NOT NULL,
      gioi_tinh            TEXT NOT NULL,
      can_nang_kg          REAL,
      nghe_nghiep          TEXT,
      nghe_nghiep_pal      TEXT NOT NULL,
      tinh_trang_dac_biet  TEXT,
      di_ung               TEXT NOT NULL DEFAULT '[]',
      avatar_color         TEXT NOT NULL,
      created_at           TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS weekly_menus (
      id          TEXT PRIMARY KEY,
      family_id   TEXT NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
      week_start  TEXT NOT NULL,
      menu_data   TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(family_id, week_start)
    );

    CREATE TABLE IF NOT EXISTS ai_chat_logs (
      id               TEXT PRIMARY KEY,
      family_id        TEXT NOT NULL REFERENCES families(family_id) ON DELETE CASCADE,
      timestamp        TEXT NOT NULL DEFAULT (datetime('now')),
      user_message     TEXT NOT NULL,
      ai_response      TEXT NOT NULL,
      changes_applied  TEXT
    );
  `);

  // Seed admin family for quick access — mã: FAM-ADMN2222
  const adminCode = "FAM-ADMN2222";
  const defaultSettings = JSON.stringify({
    vung_mien_uu_tien: ["bac", "trung", "nam"],
    budget_level: "trung",
    locked_dishes: [],
  });
  const exists = db.prepare("SELECT 1 FROM families WHERE family_id = ?").get(adminCode);
  if (!exists) {
    db.prepare("INSERT INTO families (family_id, settings) VALUES (?, ?)").run(adminCode, defaultSettings);
    console.log("[DB] Admin family seeded: FAM-ADMN2222");
  }
}
