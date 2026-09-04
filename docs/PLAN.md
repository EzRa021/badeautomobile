# Implementation Plan

Build order. Each phase leaves the app in a runnable state.

> **Status:** Phases 0–8 implemented. `npm run build` passes cleanly; TypeScript and ESLint
> are green; all four PDF templates were rendered and verified against `/templates`. Remaining
> work is **user setup** (Phase 9 verification against a live Supabase project): apply the
> migration, set `.env.local`, create the first user, then smoke-test CRUD/PDF end-to-end.
> Enhancements shipped: quotation → invoice / job-delivery conversion, dashboard KPIs + chart,
> vehicle registry, company settings.

## Phase 0 — Foundations
- [x] Analyse templates; extract letterhead/signature/logo → `public/brand/`
- [x] Author instruction/planning docs (`docs/`, `CLAUDE.md`, skill)
- [x] Write DB schema (`supabase/migrations/0001_initial_schema.sql`)
- [ ] Install deps: `@supabase/supabase-js @supabase/ssr @react-pdf/renderer react-hook-form zod @hookform/resolvers lucide-react class-variance-authority tailwind-merge clsx date-fns recharts`
- [ ] Bundle Carlito fonts → `public/fonts/`
- [ ] `.env.local` from `.env.local.example`; Tailwind theme tokens in `globals.css`
- [ ] shadcn/ui setup (`components.json`, `lib/utils/cn.ts`) + base primitives

## Phase 1 — Supabase + Auth
- [ ] `lib/supabase/{server,client,middleware}.ts`; root `middleware.ts` guarding `(app)`
- [ ] `lib/types.ts` (DB row types)
- [ ] `(auth)/login` page + `signIn`/`signOut` actions

## Phase 2 — App shell
- [ ] `(app)/layout.tsx`: sidebar + topbar, responsive, active states, user menu
- [ ] Brand tokens, StatusBadge, empty/loading states

## Phase 3 — Shared building blocks
- [ ] `lib/utils/{money,number-to-words,dates}.ts`
- [ ] `lib/validation/*` zod schemas
- [ ] `lib/db/queries.ts`, `lib/actions/*`
- [ ] Reusable `DataTable`/list toolbar (search + filters via searchParams), `LineItemsEditor`

## Phase 4 — Contacts
- [ ] Customers: list/new/edit/delete + search
- [ ] Suppliers: list/new/edit/delete + search
- [ ] Vehicles: list/new/edit/delete (linked to customer)

## Phase 5 — Documents (CRUD: list • new • view • edit • delete • search/filter)
- [ ] Quotations (banner job title, line items, total, words, status)
- [ ] Invoices (per-line VAT 7.5%, totals, words, status)
- [ ] Purchase Orders (supplier, items, optional VAT)
- [ ] Job Deliveries (form fields, dates in/out)

## Phase 6 — PDF
- [ ] `lib/pdf/fonts.ts`, `Letterhead.tsx`, four `templates/*.tsx`
- [ ] Four `api/<type>/[id]/pdf/route.ts`; download + print buttons on detail pages

## Phase 7 — Dashboard
- [ ] KPI cards (counts + totals: quoted, invoiced, outstanding), recent documents,
      simple revenue chart, quick-create actions

## Phase 8 — Enhancements (justified by workflow)
- [ ] "Create Invoice from Quotation" / "Create Job Delivery from Quotation"
- [ ] Duplicate document
- [ ] Company settings page
- [ ] Optional seed script mirroring the sample documents

## Phase 9 — Verify
- [ ] `npm run build` clean; lint clean
- [ ] Render each document type; compare to `/templates`
- [ ] Manual pass: auth guard, CRUD, search/filter, PDF download/print

## Notes / decisions
- Third document = **Invoice (from template) + Purchase Order (new, same letterhead)** — per user.
- Auth: **email/password** (Supabase). No public sign-up.
- Keep every document's contact + totals **snapshotted** for stable reprints.
