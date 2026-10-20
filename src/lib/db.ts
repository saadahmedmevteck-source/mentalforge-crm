import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import type { Activity, Company, Contact, ContactOption, Deal } from "./constants";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "crm.db");

function open() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_FILE);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS companies (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL COLLATE NOCASE UNIQUE,
      domain     TEXT NOT NULL DEFAULT '',
      industry   TEXT NOT NULL DEFAULT '',
      size       TEXT NOT NULL DEFAULT '',
      phone      TEXT NOT NULL DEFAULT '',
      city       TEXT NOT NULL DEFAULT '',
      notes      TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL COLLATE NOCASE,
      email      TEXT NOT NULL DEFAULT '',
      phone      TEXT NOT NULL DEFAULT '',
      job_title  TEXT NOT NULL DEFAULT '',
      company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
      lifecycle  TEXT NOT NULL DEFAULT 'Lead',
      source     TEXT NOT NULL DEFAULT '',
      notes      TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deals (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      title          TEXT NOT NULL,
      contact_id     INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
      company_id     INTEGER REFERENCES companies(id) ON DELETE SET NULL,
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
  `);
  migrateLegacyDeals(db);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
    CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id);
    CREATE INDEX IF NOT EXISTS idx_deals_company ON deals(company_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
    CREATE INDEX IF NOT EXISTS idx_activities_deal ON deal_activities(deal_id);
  `);
  return db;
}

// v1 stored the contact and company as free text on each deal; move them into their own tables.
function migrateLegacyDeals(conn: DatabaseSync) {
  const cols = (conn.prepare("PRAGMA table_info(deals)").all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes("contact_name")) return;
  conn.exec("BEGIN");
  try {
    if (!cols.includes("contact_id")) {
      conn.exec(`
        ALTER TABLE deals ADD COLUMN contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL;
        ALTER TABLE deals ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL;
      `);
    }
    const rows = conn
      .prepare("SELECT id, contact_name, email, phone, company FROM deals")
      .all() as { id: number; contact_name: string; email: string; phone: string; company: string }[];
    for (const r of rows) {
      const companyId = r.company ? findOrCreateCompany(r.company, conn) : null;
      const contactId = r.contact_name
        ? upsertContact({ name: r.contact_name, email: r.email, phone: r.phone, companyId }, conn)
        : null;
      conn.prepare("UPDATE deals SET contact_id = ?, company_id = ? WHERE id = ?").run(contactId, companyId, r.id);
    }
    conn.exec(`
      ALTER TABLE deals DROP COLUMN contact_name;
      ALTER TABLE deals DROP COLUMN email;
      ALTER TABLE deals DROP COLUMN phone;
      ALTER TABLE deals DROP COLUMN company;
    `);
    conn.exec("COMMIT");
  } catch (e) {
    conn.exec("ROLLBACK");
    throw e;
  }
}

// Reuse one connection across hot reloads in dev.
const g = globalThis as unknown as { crmDb?: DatabaseSync };
export const db = g.crmDb ?? open();
if (process.env.NODE_ENV !== "production") g.crmDb = db;

// node:sqlite returns null-prototype rows, which React can't pass to client components.
function plain<T>(row: unknown): T {
  return { ...(row as object) } as T;
}

// ---- Companies & contacts used by deal forms ----

export function findOrCreateCompany(name: string, conn: DatabaseSync = db): number {
  const row = conn.prepare("SELECT id FROM companies WHERE name = ?").get(name) as { id: number } | undefined;
  if (row) return row.id;
  return Number(conn.prepare("INSERT INTO companies (name) VALUES (?)").run(name).lastInsertRowid);
}

/**
 * Finds a contact by name (at the same company, or with no company on either side)
 * and fills in any details given; creates the contact when there is no match.
 */
export function upsertContact(
  c: { name: string; email: string; phone: string; companyId: number | null },
  conn: DatabaseSync = db,
): number {
  const row = conn
    .prepare(
      `SELECT id FROM contacts
       WHERE name = ? AND (company_id IS ? OR company_id IS NULL OR ? IS NULL)
       ORDER BY CASE WHEN company_id IS ? THEN 0 ELSE 1 END, id
       LIMIT 1`,
    )
    .get(c.name, c.companyId, c.companyId, c.companyId) as { id: number } | undefined;
  if (!row) {
    return Number(
      conn
        .prepare("INSERT INTO contacts (name, email, phone, company_id) VALUES (?, ?, ?, ?)")
        .run(c.name, c.email, c.phone, c.companyId).lastInsertRowid,
    );
  }
  conn.prepare(
    `UPDATE contacts SET
       email = CASE WHEN ? <> '' THEN ? ELSE email END,
       phone = CASE WHEN ? <> '' THEN ? ELSE phone END,
       company_id = COALESCE(company_id, ?),
       updated_at = datetime('now')
     WHERE id = ?`,
  ).run(c.email, c.email, c.phone, c.phone, c.companyId, row.id);
  return row.id;
}

// ---- Deals ----

const DEAL_SELECT = `
  SELECT d.*,
    COALESCE(c.name, '')  AS contact_name,
    COALESCE(c.email, '') AS contact_email,
    COALESCE(c.phone, '') AS contact_phone,
    COALESCE(co.name, '') AS company_name
  FROM deals d
  LEFT JOIN contacts c   ON c.id = d.contact_id
  LEFT JOIN companies co ON co.id = d.company_id`;

export function listDeals(search = ""): Deal[] {
  const q = `%${search.trim()}%`;
  return db
    .prepare(
      `${DEAL_SELECT}
       WHERE d.title LIKE ? OR c.name LIKE ? OR co.name LIKE ? OR c.email LIKE ?
       ORDER BY d.position ASC, d.updated_at DESC`,
    )
    .all(q, q, q, q)
    .map((r) => plain<Deal>(r));
}

export function listDealsFor(field: "contact_id" | "company_id", id: number): Deal[] {
  return db
    .prepare(`${DEAL_SELECT} WHERE d.${field} = ? ORDER BY d.updated_at DESC`)
    .all(id)
    .map((r) => plain<Deal>(r));
}

export function getDeal(id: number): Deal | undefined {
  const row = db.prepare(`${DEAL_SELECT} WHERE d.id = ?`).get(id);
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

// ---- Contacts ----

const CONTACT_SELECT = `
  SELECT c.*,
    COALESCE(co.name, '') AS company_name,
    (SELECT COUNT(*) FROM deals d WHERE d.contact_id = c.id) AS deal_count,
    (SELECT COALESCE(SUM(d.value), 0) FROM deals d
      WHERE d.contact_id = c.id AND d.stage NOT IN ('won', 'lost')) AS open_value
  FROM contacts c
  LEFT JOIN companies co ON co.id = c.company_id`;

export function listContacts(search = ""): Contact[] {
  const q = `%${search.trim()}%`;
  return db
    .prepare(
      `${CONTACT_SELECT}
       WHERE c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR co.name LIKE ?
       ORDER BY c.updated_at DESC`,
    )
    .all(q, q, q, q)
    .map((r) => plain<Contact>(r));
}

export function listContactsForCompany(companyId: number): Contact[] {
  return db
    .prepare(`${CONTACT_SELECT} WHERE c.company_id = ? ORDER BY c.name`)
    .all(companyId)
    .map((r) => plain<Contact>(r));
}

export function getContact(id: number): Contact | undefined {
  const row = db.prepare(`${CONTACT_SELECT} WHERE c.id = ?`).get(id);
  return row ? plain<Contact>(row) : undefined;
}

export function contactOptions(): ContactOption[] {
  return db
    .prepare(
      `SELECT c.name, c.email, c.phone, COALESCE(co.name, '') AS company_name
       FROM contacts c LEFT JOIN companies co ON co.id = c.company_id
       ORDER BY c.name`,
    )
    .all()
    .map((r) => plain<ContactOption>(r));
}

// ---- Companies ----

const COMPANY_SELECT = `
  SELECT co.*,
    (SELECT COUNT(*) FROM contacts c WHERE c.company_id = co.id) AS contact_count,
    (SELECT COUNT(*) FROM deals d WHERE d.company_id = co.id) AS deal_count,
    (SELECT COALESCE(SUM(d.value), 0) FROM deals d
      WHERE d.company_id = co.id AND d.stage NOT IN ('won', 'lost')) AS open_value
  FROM companies co`;

export function listCompanies(search = ""): Company[] {
  const q = `%${search.trim()}%`;
  return db
    .prepare(
      `${COMPANY_SELECT}
       WHERE co.name LIKE ? OR co.domain LIKE ? OR co.industry LIKE ? OR co.city LIKE ?
       ORDER BY co.name`,
    )
    .all(q, q, q, q)
    .map((r) => plain<Company>(r));
}

export function getCompany(id: number): Company | undefined {
  const row = db.prepare(`${COMPANY_SELECT} WHERE co.id = ?`).get(id);
  return row ? plain<Company>(row) : undefined;
}

export function companyNames(): string[] {
  return (db.prepare("SELECT name FROM companies ORDER BY name").all() as { name: string }[]).map(
    (r) => r.name,
  );
}
