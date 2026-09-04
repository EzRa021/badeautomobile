---
name: bade-documents
description: >-
  Workflow for building and maintaining Bade Automobile's business documents
  (Quotation, Invoice, Purchase Order, Job Delivery) and their faithful PDF
  output. Use whenever adding a document type, adding/renaming a document field,
  changing totals/VAT/amount-in-words logic, or adjusting a PDF layout so it keeps
  matching the templates in /templates.
---

# Bade Automobile — Documents & PDF workflow

Follow this when touching any document feature. The overriding rule: **generated
PDFs must match the sample templates in `/templates`.** Reproduce, never redesign.

## Anatomy of a document type
Each of the four types has the same shape across the codebase:

1. **DB** — parent table + (usually) an `*_items` child, in
   `supabase/migrations/0001_initial_schema.sql`. Parent stores computed snapshots
   (`subtotal`, `vat_total`, `total`, `amount_in_words`) and contact snapshots
   (name + address), plus a unique document number and a `status`.
2. **Types** — row types in `lib/types.ts`.
3. **Validation** — a zod schema in `lib/validation/<type>.ts` used by both the
   client form and the server action.
4. **Reads** — helpers in `lib/db/queries.ts` (Server Components only).
5. **Writes** — `lib/actions/<type>.ts` (`'use server'`): auth check → zod parse →
   compute totals + words → upsert parent + replace items → `revalidatePath` → `redirect`.
6. **Pages** — `app/(app)/<type>/` : `page.tsx` (list + search/filter), `new`,
   `[id]` (detail + PDF buttons), `[id]/edit`.
7. **PDF** — `lib/pdf/templates/<type>.tsx` (`@react-pdf/renderer` `<Document>`) +
   `app/api/<type>/[id]/pdf/route.ts`.

## Adding or changing a field
1. Migration: add the column (+ backfill/default). 2. `lib/types.ts`. 3. zod schema.
4. Form control in the `new`/`edit` page. 5. Server action mapping. 6. Detail page
display. 7. **PDF template** placement (check `docs/TEMPLATES.md` for where it belongs).
8. Re-render and compare against `/templates`.

## Totals, VAT, and words
- Compute on the **server** from line items; never trust client-sent totals.
- Invoice: per-line VAT at `vat_rate` (default **7.5%**); `net = qty*unit_price`,
  `vat = net*rate`, `gross = net+vat`; document total = Σ gross.
- Quotation / PO: total = Σ line amounts (PO VAT optional, default off).
- `amount_in_words` via `lib/utils/number-to-words.ts` (Naira + Kobo). Match the sample's
  casing: quotation UPPERCASE `… NAIRA ONLY`; invoice title-case `… Naira Only`.

## PDF fidelity checklist
- Uses `lib/pdf/Letterhead.tsx` (A4 + `public/brand/letterhead-bg.jpg` + signature footer).
- Font family `"Calibri"` (Carlito) via `lib/pdf/fonts.ts`; sizes per `docs/TEMPLATES.md`.
- Column x-bounds / row heights match the measured geometry; money right-aligned; ₦ glyph
  where the template shows it; banner job-title row on quotation; 4-line VAT block on invoice;
  dotted-underline form rows on job delivery.
- After any change: open the generated PDF next to the matching file in `/templates` and align.

## Numbering
Pre-fill new document numbers from the `next_document_number('<doc_type>')` RPC; keep them
editable and unique. Do not reuse a number across documents.

## Don'ts
- Don't fetch/write Supabase from Client Components.
- Don't change the letterhead art or template layouts for aesthetic reasons.
- Don't store money as float; don't recompute words on the client.
