import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import type { Activity, Deal } from "./constants";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "crm.db");

function open() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_FILE);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS deals (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      title          TEXT NOT NULL,
      contact_name   TEXT NOT NULL DEFAULT '',
      email          TEXT NOT NULL DEFAULT '',
      phone          TEXT NOT NULL DEFAULT '',
      company        TEXT NOT NULL DEFAULT '',
      service        TEXT NOT NULL DEFAULT '',
      value          REAL NOT NULL DEFAULT 0,
      stage          TEXT NOT NULL DEFAULT 'lead',
      source         TEXT NOT NULL DEFAULT '',
      expected_close TEXT NOT NULL DEFAULT '',
      notes          TEXT NOT NULL DEFAULT '',
      position       INTEGER NOT NULL DEFAULT 0,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deal_activities (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      deal_id    INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
      kind       TEXT NOT NULL,
      body       TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
    CREATE INDEX IF NOT EXISTS idx_activities_deal ON deal_activities(deal_id);
  `);
  return db;
}

// Reuse one connection across hot reloads in dev.
const g = globalThis as unknown as { crmDb?: DatabaseSync };
export const db = g.crmDb ?? open();
if (process.env.NODE_ENV !== "production") g.crmDb = db;

// node:sqlite returns null-prototype rows, which React can't pass to client components.
function plain<T>(row: unknown): T {
  return { ...(row as object) } as T;
}

export function listDeals(search = ""): Deal[] {
  const q = `%${search.trim()}%`;
  return db
    .prepare(
      `SELECT * FROM deals
       WHERE title LIKE ? OR contact_name LIKE ? OR company LIKE ? OR email LIKE ?
       ORDER BY position ASC, updated_at DESC`,
    )
    .all(q, q, q, q)
    .map((r) => plain<Deal>(r));
}

export function getDeal(id: number): Deal | undefined {
  const row = db.prepare("SELECT * FROM deals WHERE id = ?").get(id);
  return row ? plain<Deal>(row) : undefined;
}

export function listActivities(dealId: number): Activity[] {
  return db
    .prepare(
      "SELECT * FROM deal_activities WHERE deal_id = ? ORDER BY created_at DESC, id DESC",
    )
    .all(dealId)
    .map((r) => plain<Activity>(r));
}

export function logActivity(dealId: number, kind: Activity["kind"], body: string) {
  db.prepare(
    "INSERT INTO deal_activities (deal_id, kind, body) VALUES (?, ?, ?)",
  ).run(dealId, kind, body);
}
