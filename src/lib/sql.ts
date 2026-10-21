import path from "node:path";

type Row = Record<string, unknown>;

type Driver = {
  query(text: string, params: unknown[]): Promise<Row[]>;
  /** Runs the multi-statement SQL in one transaction. */
  transaction(text: string): Promise<void>;
};

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'member',
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (lower(email));

  CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS companies (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    domain     TEXT NOT NULL DEFAULT '',
    industry   TEXT NOT NULL DEFAULT '',
    size       TEXT NOT NULL DEFAULT '',
    phone      TEXT NOT NULL DEFAULT '',
    city       TEXT NOT NULL DEFAULT '',
    notes      TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS companies_name_key ON companies (lower(name));

  CREATE TABLE IF NOT EXISTS contacts (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL DEFAULT '',
    phone      TEXT NOT NULL DEFAULT '',
    job_title  TEXT NOT NULL DEFAULT '',
    company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    lifecycle  TEXT NOT NULL DEFAULT 'Lead',
    source     TEXT NOT NULL DEFAULT '',
    notes      TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts (lower(name));
  CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts (company_id);

  CREATE TABLE IF NOT EXISTS deals (
    id             SERIAL PRIMARY KEY,
    title          TEXT NOT NULL,
    contact_id     INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    company_id     INTEGER REFERENCES companies(id) ON DELETE SET NULL,
    service        TEXT NOT NULL DEFAULT '',
    value          DOUBLE PRECISION NOT NULL DEFAULT 0,
    stage          TEXT NOT NULL DEFAULT 'lead',
    source         TEXT NOT NULL DEFAULT '',
    expected_close TEXT NOT NULL DEFAULT '',
    notes          TEXT NOT NULL DEFAULT '',
    position       INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals (stage);
  CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals (contact_id);
  CREATE INDEX IF NOT EXISTS idx_deals_company ON deals (company_id);

  CREATE TABLE IF NOT EXISTS tasks (
    id         SERIAL PRIMARY KEY,
    title      TEXT NOT NULL,
    type       TEXT NOT NULL DEFAULT 'To-do',
    priority   TEXT NOT NULL DEFAULT 'normal',
    due_date   TEXT NOT NULL DEFAULT '',
    due_time   TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL DEFAULT 'open',
    deal_id    INTEGER REFERENCES deals(id) ON DELETE SET NULL,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    notes      TEXT NOT NULL DEFAULT '',
    done_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks (status, due_date);
  CREATE INDEX IF NOT EXISTS idx_tasks_deal ON tasks (deal_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_contact ON tasks (contact_id);

  CREATE TABLE IF NOT EXISTS deal_activities (
    id         SERIAL PRIMARY KEY,
    deal_id    INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    kind       TEXT NOT NULL,
    body       TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_activities_deal ON deal_activities (deal_id);
`;

/**
 * DATABASE_URL set (Neon, Supabase, any Postgres): use it.
 * Not set: an embedded Postgres (PGlite) stored in ./data/pglite, for local development.
 */
async function createDriver(): Promise<Driver> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    // postgres.js sends unknown URL options to the server as settings. Neon's URLs include the
    // libpq-only channel_binding option, which the server would reject, so drop it.
    const connectionUrl = new URL(url);
    connectionUrl.searchParams.delete("channel_binding");
    // prepare: false keeps it compatible with transaction-mode poolers (Supabase, Neon pooled URLs).
    const sql = postgres(connectionUrl.toString(), {
      prepare: false,
      max: process.env.VERCEL ? 1 : 5,
      idle_timeout: 20,
      // Skip "relation already exists" notices from the CREATE ... IF NOT EXISTS schema on every cold start.
      onnotice: () => {},
    });
    return {
      query: async (text, params) => [...(await sql.unsafe(text, params as never[]))] as Row[],
      // postgres.js refuses BEGIN/COMMIT inside a pooled query; sql.begin pins one connection.
      transaction: async (text) => {
        await sql.begin((tx) => tx.unsafe(text).simple());
      },
    };
  }
  if (process.env.VERCEL) throw new Error("DATABASE_URL is not set. Add it in the Vercel project settings.");
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(path.join(process.cwd(), "data", "pglite"));
  return {
    query: async (text, params) => (await db.query<Row>(text, params)).rows,
    transaction: async (text) => {
      await db.transaction((tx) => tx.exec(text));
    },
  };
}

async function connect() {
  const driver = await createDriver();
  // The advisory lock keeps two cold starts from creating the schema at the same moment.
  await driver.transaction(`SELECT pg_advisory_xact_lock(727274); ${SCHEMA}`);
  return driver;
}

// One connection per server process (kept across hot reloads in dev).
const g = globalThis as unknown as { crmDriver?: Promise<Driver> };
function driver() {
  g.crmDriver ??= connect().catch((e) => {
    g.crmDriver = undefined;
    throw e;
  });
  return g.crmDriver;
}

// Dates become ISO strings so rows can be passed straight to client components.
function normalize(row: Row) {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) out[k] = v instanceof Date ? v.toISOString() : v;
  return out;
}

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const rows = await (await driver()).query(text, params);
  return rows.map(normalize) as T[];
}

export async function queryOne<T>(text: string, params: unknown[] = []): Promise<T | undefined> {
  return (await query<T>(text, params))[0];
}
