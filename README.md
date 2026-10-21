# Mental Forge CRM

Deals pipeline, contacts, companies, tasks and reminders for [Mental Forge](https://mentalforge.ai).
Built with Next.js 15 and Postgres.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no `DATABASE_URL` set, the app uses an embedded Postgres
(PGlite) stored in `./data/pglite`, so nothing else needs to be installed.

On the very first visit you'll be sent to **/setup** to create the admin account. After that,
admins add team members from **Team** in the top menu.

## Configuration

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | In production | Postgres connection string (Neon or Supabase). Use the **pooled** URL. |
| `NEXT_PUBLIC_CRM_TIMEZONE` | No | IANA time zone for due dates and reminders. Default `America/Chicago`. |

The database tables are created automatically the first time the app connects.

## Deploy to Vercel

### 1. Create the database (pick one)

**Neon (easiest with Vercel)**
1. In Vercel, open your project → **Storage** → **Create Database** → **Neon**.
2. Vercel adds `DATABASE_URL` to the project for you.

**Supabase**
1. Create a project at supabase.com.
2. **Project Settings → Database → Connection string → Transaction pooler** (port `6543`).
3. Copy it, put your database password in it, and use it as `DATABASE_URL`.

### 2. Put the code on GitHub

```bash
git remote add origin https://github.com/<your-account>/mentalforge-crm.git
git push -u origin master
```

### 3. Import into Vercel

1. vercel.com → **Add New… → Project** → import the GitHub repository.
2. Framework preset: **Next.js** (detected automatically). No build settings to change.
3. **Environment Variables**: add `DATABASE_URL` (skip if Neon added it) and optionally
   `NEXT_PUBLIC_CRM_TIMEZONE`.
4. **Deploy**.

### 4. First sign-in

Open the deployed URL. You'll land on **/setup**; create the admin account, then add the team
from **Team**.

### 5. Custom domain (optional)

Vercel → Project → **Settings → Domains** → add e.g. `crm.mentalforge.ai`, then add the CNAME
record Vercel shows at your DNS provider.

## Notes

- Sessions last 30 days. Deactivating a user or resetting their password signs them out everywhere.
- Passwords are hashed with scrypt; session tokens are stored only as SHA-256 hashes.
- Reminders show while the CRM is open in a browser tab (in-app toast, plus desktop
  notifications once enabled from the dashboard).
- Search engines are told not to index the site.
