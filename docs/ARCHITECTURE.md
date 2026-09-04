# Architecture

## Stack
- **Next.js 16.3.4** (App Router, React 19, TypeScript, Server Components + Server Actions)
- **Supabase** — Postgres + Auth (email/password) via `@supabase/ssr` (cookie sessions)
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives, `cva`, `tailwind-merge`)
- **@react-pdf/renderer** — server-side PDF generation, Carlito fonts
- **react-hook-form + zod** — client forms + shared validation schemas
- **lucide-react** icons · **recharts** (dashboard) · **date-fns** (formatting)

> ⚠️ This is Next.js **16** — see `AGENTS.md`. Read `node_modules/next/dist/docs/`
> before using an unfamiliar API. `params`/`searchParams` are async (Promises).

## Rendering & data flow
```
Server Component (page)  ──reads──▶  Supabase server client (RLS as the signed-in user)
        │                                   ▲
        ▼                                   │
  Client form (RHF+zod)  ──submits──▶  Server Action ('use server')
                                            │  zod re-validate → write → revalidatePath → redirect
                                            ▼
                                     Supabase server client
PDF:  GET /api/<type>/[id]/pdf  ──▶  server client fetch  ──▶  @react-pdf renderToStream
```
- **Reads**: Server Components query Supabase directly (no client-side data fetching for lists/details).
- **Writes**: Server Actions only. Every action re-checks auth and re-validates with zod.
- **PDF**: Route Handlers stream `application/pdf`; `?download=1` sets a download filename.

## Directory layout
```
app/
  (auth)/login/                 # public auth
  (app)/                        # authenticated shell (sidebar layout)
    dashboard/
    quotations/  [id]/  [id]/edit/  new/
    invoices/    …
    purchase-orders/ …
    job-deliveries/ …
    customers/   suppliers/   vehicles/
    settings/
  api/
    quotations/[id]/pdf/route.ts
    invoices/[id]/pdf/route.ts
    purchase-orders/[id]/pdf/route.ts
    job-deliveries/[id]/pdf/route.ts
  layout.tsx  globals.css
lib/
  supabase/    server.ts  client.ts  middleware.ts
  db/          queries.ts        # typed read helpers (server)
  actions/     *.ts              # 'use server' mutations per entity
  validation/  *.ts              # zod schemas (shared client+server)
  pdf/         fonts.ts  Letterhead.tsx  templates/{quotation,invoice,po,job-delivery}.tsx
  utils/       money.ts  number-to-words.ts  dates.ts  cn.ts
  types.ts                       # DB row types
components/
  ui/                            # shadcn primitives
  app/                           # sidebar, topbar, data-table, line-items editor, status-badge …
middleware.ts                    # refreshes session, guards (app) routes
supabase/migrations/             # SQL
docs/                            # this folder
```

## Domain model
Four documents: **Quotation → (accepted) → Invoice / Job Delivery**; **Purchase Order**
is independent (Bade → supplier). Shared contacts: **customers**, **suppliers**,
**vehicles**. See `docs/DATABASE.md`.

Money is `numeric(14,2)`; all totals are computed server-side from line items and stored
as snapshots on the parent (subtotal/vat_total/total + `amount_in_words`) so a document
prints identically even if a contact is later edited. Customer/supplier name+address are
**snapshotted** onto each document for the same reason.

## Auth
`@supabase/ssr` cookie sessions. `middleware.ts` refreshes the session on every request
and redirects unauthenticated users from `(app)` routes to `/login`. RLS grants any
authenticated user full access (single-tenant). Create the first user in the Supabase
dashboard (Authentication → Users) — see `README`/`docs/PLAN.md`.

## Conventions
- Server Actions return `{ ok, error?, fieldErrors? }` and `redirect()` on success.
- Document numbers come from the `next_document_number(doc_type)` RPC (atomic), editable
  before save, unique-constrained.
- Amount-in-words via `lib/utils/number-to-words.ts` (Naira/Kobo), stored on save.
- List pages read filters from `searchParams` (server-side search/sort/status/date-range).
