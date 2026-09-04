# Bade Automobile — Document Management System

Internal web app for **Bade Automobile Ltd** to create, manage and print business
documents on the company letterhead:

- **Quotations** — price estimates before work begins
- **Job Delivery Reports** — handed over with a completed vehicle
- **Invoices** — bills with per-line VAT (7.5%)
- **Purchase Orders** — orders raised to parts suppliers

Every document generates a **PDF that matches the originals in `/templates`** (the exact
letterhead + watermark are reused; bodies are rebuilt from the measured layout). Includes a
dashboard, customer / supplier / vehicle registries, search & filtering, status tracking,
auto-numbering, amount-in-words, and one-click "convert quotation → invoice / job delivery".

## Stack
Next.js 16 (App Router) · Supabase (Postgres + Auth) · Tailwind v4 · shadcn/ui ·
@react-pdf/renderer. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Getting started

### 1. Install
```bash
npm install
```

### 2. Create a Supabase project
Create a project at [supabase.com](https://supabase.com), then open **SQL Editor** and run
the migration in [`supabase/migrations/0001_initial_schema.sql`](supabase/migrations/0001_initial_schema.sql).
It creates all tables, the numbering helpers, and row-level security.

### 3. Configure environment
Copy the example and fill in your Project **URL** and **anon key**
(Supabase → Project Settings → API):
```bash
cp .env.local.example .env.local
```
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 4. Create the first user
There is no public sign-up. Create the **first** account in Supabase →
**Authentication → Users → Add user** (set a password) to bootstrap. They sign in at `/login`.

After that, add and remove staff from inside the app at **Admin → Staff** — this requires
`SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (step 3). Without that key the Staff page shows a
notice and you continue adding users in the Supabase dashboard.

### 5. Run
```bash
npm run dev      # http://localhost:3000
```
```bash
npm run build && npm run start   # production
```

## How documents work
- Fill a form → totals, VAT and amount-in-words are computed on the server → saved to Supabase.
- Open a document → **Download PDF** or **Print** (opens the PDF inline).
- Contact name/address and totals are **snapshotted** onto each document, so a printed
  document never changes if a customer is later edited.
- Document numbers are pre-filled from an atomic counter and stay editable & unique.

## Project docs
- [`CLAUDE.md`](CLAUDE.md) — guidance for AI assistants working on this repo
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/DATABASE.md`](docs/DATABASE.md) ·
  [`docs/TEMPLATES.md`](docs/TEMPLATES.md) · [`docs/PDF.md`](docs/PDF.md) ·
  [`docs/PLAN.md`](docs/PLAN.md)
- [`.claude/skills/bade-documents/SKILL.md`](.claude/skills/bade-documents/SKILL.md) — the
  document/PDF workflow skill

## Notes
- Fonts: **Carlito** (OFL, metric-compatible with Calibri) in `public/fonts/`, so PDF text
  matches the templates. Letterhead/signature assets are in `public/brand/`.
- This is Next.js **16** — middleware is `proxy.ts`; `params`/`searchParams` are async.






git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/EzRa021/badeautomobile.git
git push -u origin main