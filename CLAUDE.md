@AGENTS.md

# Bade Automobile — Document Management System

Internal web app for **Bade Automobile Ltd** (auto workshop, Ogun State, Nigeria) to
create, manage, and print business documents on the company letterhead.

**Documents:** Quotation · Job Delivery Report · Invoice · Purchase Order.
Each is created from form input and exported to a **PDF that matches the templates in
`/templates`**. Do not redesign the templates — reproduce them.

## Read first
- `AGENTS.md` — this is **Next.js 16**; read `node_modules/next/dist/docs/` before using
  unfamiliar APIs. `params`/`searchParams` are async.
- `docs/ARCHITECTURE.md` — stack, data flow, directory layout, conventions.
- `docs/TEMPLATES.md` — exact fields & geometry of every template.
- `docs/DATABASE.md` + `supabase/migrations/0001_initial_schema.sql` — schema.
- `docs/PDF.md` — how PDFs are generated and kept faithful.
- `docs/PLAN.md` — build order / checklist.

## Stack
Next.js 16 (App Router, RSC + Server Actions) · Supabase (Postgres + Auth via
`@supabase/ssr`) · Tailwind v4 · shadcn/ui · @react-pdf/renderer · react-hook-form + zod.

## Golden rules
1. **Templates are law.** The letterhead/watermark come from `public/brand/letterhead-bg.jpg`
   (extracted from the originals). Reproduce bodies from `docs/TEMPLATES.md`; verify PDF
   output against `/templates`. Never invent a different look.
2. **Reads in Server Components, writes in Server Actions.** No client-side Supabase writes.
   Every action re-checks auth and re-validates input with the shared zod schema.
3. **Snapshot for print stability.** Store customer/supplier name+address and computed
   totals + `amount_in_words` on the document row, not just foreign keys.
4. **Money** is `numeric(14,2)`; compute totals server-side; format with `lib/utils/money.ts`;
   generate words with `lib/utils/number-to-words.ts`.
5. **Numbers** via `next_document_number(doc_type)` RPC — editable, unique.
6. **UI:** consult the `frontend-design` skill (and `ui-ux-pro-max` if installed) before
   building or restyling UI. Professional, clean, dense-but-legible admin aesthetic; not a
   templated default. Reuse `components/ui` + `components/app`; don't hand-roll one-offs.
7. **Security:** never place personal data in URLs; validate on the server; keep the
   service-role key server-only.

## Commands
```bash
npm run dev      # local dev
npm run build    # production build (must stay clean)
npm run lint
```
Supabase: apply the migrations in `supabase/migrations/` in order, set `.env.local`
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), create the first user in the
Supabase dashboard, then log in at `/login`.

## Conventions
- Routes: `(auth)` public, `(app)` authenticated shell. Per entity: `list / new / [id] /
  [id]/edit`. PDFs at `api/<type>/[id]/pdf`.
- Server Actions return `{ ok, error?, fieldErrors? }`; `redirect()` + `revalidatePath()`
  on success.
- List/search/filter state lives in `searchParams` (server-side filtering).
- Keep `docs/PLAN.md` checkboxes current as phases complete.
