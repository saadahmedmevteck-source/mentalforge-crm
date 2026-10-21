import type { Activity, Company, Contact, ContactOption, Deal, Task } from "./constants";
import { query, queryOne } from "./sql";

export { query, queryOne };

export type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member";
  active: boolean;
  created_at: string;
};

// ---- Companies & contacts used by deal forms ----

export async function findCompanyId(name: string) {
  return (await queryOne<{ id: number }>("SELECT id FROM companies WHERE lower(name) = lower($1)", [name]))?.id;
}

export async function findOrCreateCompany(name: string): Promise<number> {
  const existing = await findCompanyId(name);
  if (existing) return existing;
  const row = await queryOne<{ id: number }>(
    `INSERT INTO companies (name) VALUES ($1)
     ON CONFLICT ((lower(name))) DO UPDATE SET name = companies.name
     RETURNING id`,
    [name],
  );
  return row!.id;
}

/**
 * Finds a contact by name (at the same company, or with no company on either side)
 * and fills in any details given; creates the contact when there is no match.
 */
export async function upsertContact(c: {
  name: string;
  email: string;
  phone: string;
  companyId: number | null;
}): Promise<number> {
  const row = await queryOne<{ id: number }>(
    `SELECT id FROM contacts
     WHERE lower(name) = lower($1)
       AND (company_id IS NOT DISTINCT FROM $2::int OR company_id IS NULL OR $2::int IS NULL)
     ORDER BY CASE WHEN company_id IS NOT DISTINCT FROM $2::int THEN 0 ELSE 1 END, id
     LIMIT 1`,
    [c.name, c.companyId],
  );
  if (!row) {
    const created = await queryOne<{ id: number }>(
      "INSERT INTO contacts (name, email, phone, company_id) VALUES ($1, $2, $3, $4) RETURNING id",
      [c.name, c.email, c.phone, c.companyId],
    );
    return created!.id;
  }
  await query(
    `UPDATE contacts SET
       email = CASE WHEN $1 <> '' THEN $1 ELSE email END,
       phone = CASE WHEN $2 <> '' THEN $2 ELSE phone END,
       company_id = COALESCE(company_id, $3::int),
       updated_at = now()
     WHERE id = $4`,
    [c.email, c.phone, c.companyId, row.id],
  );
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

export function listDeals(search = ""): Promise<Deal[]> {
  return query<Deal>(
    `${DEAL_SELECT}
     WHERE d.title ILIKE $1 OR c.name ILIKE $1 OR co.name ILIKE $1 OR c.email ILIKE $1
     ORDER BY d.position ASC, d.updated_at DESC`,
    [`%${search.trim()}%`],
  );
}

export function listDealsFor(field: "contact_id" | "company_id", id: number): Promise<Deal[]> {
  return query<Deal>(`${DEAL_SELECT} WHERE d.${field} = $1 ORDER BY d.updated_at DESC`, [id]);
}

export function getDeal(id: number): Promise<Deal | undefined> {
  return queryOne<Deal>(`${DEAL_SELECT} WHERE d.id = $1`, [id]);
}

export function listActivities(dealId: number): Promise<Activity[]> {
  return query<Activity>(
    `SELECT a.*, COALESCE(u.name, '') AS user_name
     FROM deal_activities a LEFT JOIN users u ON u.id = a.user_id
     WHERE a.deal_id = $1 ORDER BY a.created_at DESC, a.id DESC`,
    [dealId],
  );
}

export async function logActivity(dealId: number, kind: Activity["kind"], body: string, userId: number | null) {
  await query("INSERT INTO deal_activities (deal_id, kind, body, user_id) VALUES ($1, $2, $3, $4)", [
    dealId,
    kind,
    body,
    userId,
  ]);
}

// ---- Contacts ----

const CONTACT_SELECT = `
  SELECT c.*,
    COALESCE(co.name, '') AS company_name,
    (SELECT COUNT(*)::int FROM deals d WHERE d.contact_id = c.id) AS deal_count,
    (SELECT COALESCE(SUM(d.value), 0) FROM deals d
      WHERE d.contact_id = c.id AND d.stage NOT IN ('won', 'lost')) AS open_value
  FROM contacts c
  LEFT JOIN companies co ON co.id = c.company_id`;

export function listContacts(search = ""): Promise<Contact[]> {
  return query<Contact>(
    `${CONTACT_SELECT}
     WHERE c.name ILIKE $1 OR c.email ILIKE $1 OR c.phone ILIKE $1 OR co.name ILIKE $1
     ORDER BY c.updated_at DESC`,
    [`%${search.trim()}%`],
  );
}

export function listContactsForCompany(companyId: number): Promise<Contact[]> {
  return query<Contact>(`${CONTACT_SELECT} WHERE c.company_id = $1 ORDER BY c.name`, [companyId]);
}

export function getContact(id: number): Promise<Contact | undefined> {
  return queryOne<Contact>(`${CONTACT_SELECT} WHERE c.id = $1`, [id]);
}

export function contactOptions(): Promise<ContactOption[]> {
  return query<ContactOption>(
    `SELECT c.name, c.email, c.phone, COALESCE(co.name, '') AS company_name
     FROM contacts c LEFT JOIN companies co ON co.id = c.company_id
     ORDER BY c.name`,
  );
}

export function contactChoices() {
  return query<{ id: number; name: string; company_name: string }>(
    `SELECT c.id, c.name, COALESCE(co.name, '') AS company_name
     FROM contacts c LEFT JOIN companies co ON co.id = c.company_id
     ORDER BY c.name`,
  );
}

// ---- Companies ----

const COMPANY_SELECT = `
  SELECT co.*,
    (SELECT COUNT(*)::int FROM contacts c WHERE c.company_id = co.id) AS contact_count,
    (SELECT COUNT(*)::int FROM deals d WHERE d.company_id = co.id) AS deal_count,
    (SELECT COALESCE(SUM(d.value), 0) FROM deals d
      WHERE d.company_id = co.id AND d.stage NOT IN ('won', 'lost')) AS open_value
  FROM companies co`;

export function listCompanies(search = ""): Promise<Company[]> {
  return query<Company>(
    `${COMPANY_SELECT}
     WHERE co.name ILIKE $1 OR co.domain ILIKE $1 OR co.industry ILIKE $1 OR co.city ILIKE $1
     ORDER BY lower(co.name)`,
    [`%${search.trim()}%`],
  );
}

export function getCompany(id: number): Promise<Company | undefined> {
  return queryOne<Company>(`${COMPANY_SELECT} WHERE co.id = $1`, [id]);
}

export async function companyNames(): Promise<string[]> {
  return (await query<{ name: string }>("SELECT name FROM companies ORDER BY lower(name)")).map((r) => r.name);
}

export function dealChoices() {
  return query<{ id: number; title: string; contact_id: number | null }>(
    `SELECT id, title, contact_id FROM deals
     ORDER BY CASE WHEN stage IN ('won', 'lost') THEN 1 ELSE 0 END, updated_at DESC`,
  );
}

// ---- Dashboard deal lists ----

export function dealsClosingBy(until: string): Promise<Deal[]> {
  return query<Deal>(
    `${DEAL_SELECT}
     WHERE d.stage NOT IN ('won', 'lost') AND d.expected_close <> '' AND d.expected_close <= $1
     ORDER BY d.expected_close LIMIT 8`,
    [until],
  );
}

/** Open deals with no open task: nothing scheduled to move them forward. */
export function dealsWithoutNextStep(): Promise<Deal[]> {
  return query<Deal>(
    `${DEAL_SELECT}
     WHERE d.stage NOT IN ('won', 'lost')
       AND NOT EXISTS (SELECT 1 FROM tasks t WHERE t.deal_id = d.id AND t.status = 'open')
     ORDER BY d.updated_at ASC LIMIT 8`,
  );
}

// ---- Tasks ----

const TASK_SELECT = `
  SELECT t.*,
    COALESCE(d.title, '') AS deal_title,
    COALESCE(c.name, '')  AS contact_name
  FROM tasks t
  LEFT JOIN deals d    ON d.id = t.deal_id
  LEFT JOIN contacts c ON c.id = t.contact_id`;

// Dated before undated, then by time (untimed last), then priority.
const TASK_ORDER = `
  CASE WHEN t.due_date = '' THEN 1 ELSE 0 END, t.due_date,
  CASE WHEN t.due_time = '' THEN 1 ELSE 0 END, t.due_time,
  CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, t.id`;

export type TaskView = "overdue" | "today" | "upcoming" | "open" | "done";

export function listTasks(view: TaskView, today: string, until?: string): Promise<Task[]> {
  const where: Record<TaskView, [string, string[]]> = {
    overdue: ["t.status = 'open' AND t.due_date <> '' AND t.due_date < $1", [today]],
    today: ["t.status = 'open' AND t.due_date = $1", [today]],
    upcoming: until
      ? ["t.status = 'open' AND t.due_date > $1 AND t.due_date <= $2", [today, until]]
      : ["t.status = 'open' AND t.due_date > $1", [today]],
    open: ["t.status = 'open'", []],
    done: ["t.status = 'done'", []],
  };
  const [clause, params] = where[view];
  const order = view === "done" ? "t.done_at DESC LIMIT 200" : TASK_ORDER;
  return query<Task>(`${TASK_SELECT} WHERE ${clause} ORDER BY ${order}`, params);
}

export function listTasksFor(field: "deal_id" | "contact_id", id: number): Promise<Task[]> {
  return query<Task>(
    `${TASK_SELECT} WHERE t.${field} = $1
     ORDER BY CASE WHEN t.status = 'open' THEN 0 ELSE 1 END, ${TASK_ORDER}`,
    [id],
  );
}

export function getTask(id: number): Promise<Task | undefined> {
  return queryOne<Task>(`${TASK_SELECT} WHERE t.id = $1`, [id]);
}

export async function taskCounts(today: string, until: string) {
  const row = await queryOne<{ overdue: number; today: number; upcoming: number; open: number }>(
    `SELECT
       COUNT(*) FILTER (WHERE due_date <> '' AND due_date < $1)::int AS overdue,
       COUNT(*) FILTER (WHERE due_date = $1)::int AS today,
       COUNT(*) FILTER (WHERE due_date > $1 AND due_date <= $2)::int AS upcoming,
       COUNT(*)::int AS open
     FROM tasks WHERE status = 'open'`,
    [today, until],
  );
  return row!;
}

/** Open tasks due today whose time has arrived; these trigger reminders. */
export function tasksDueNow(today: string, hhmm: string): Promise<Task[]> {
  return query<Task>(
    `${TASK_SELECT}
     WHERE t.status = 'open' AND t.due_date = $1 AND t.due_time <> '' AND t.due_time <= $2
     ORDER BY t.due_time`,
    [today, hhmm],
  );
}

// ---- Users ----

export function countUsers() {
  return queryOne<{ n: number }>("SELECT COUNT(*)::int AS n FROM users").then((r) => r!.n);
}

export function listUsers(): Promise<User[]> {
  return query<User>(
    "SELECT id, name, email, role, active, created_at FROM users ORDER BY active DESC, lower(name)",
  );
}

export function getUserForLogin(email: string) {
  return queryOne<User & { password_hash: string }>(
    "SELECT * FROM users WHERE lower(email) = lower($1)",
    [email],
  );
}
