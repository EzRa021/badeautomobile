# Database (Supabase / Postgres)

Full DDL: `supabase/migrations/0001_initial_schema.sql`, followed by the numbered
migrations alongside it. Apply them in order in the Supabase SQL editor, or with
`supabase db push`. This file is the human-readable summary.

## Tables
| Table | Purpose | Key columns |
|---|---|---|
| `company_settings` | Singleton letterhead/contact + defaults | name, address, phone, email, tin, vat_rate, currency |
| `document_counters` | Atomic per-type numbering | doc_type (pk), prefix, next_value, padding |
| `customers` | Client registry (snapshotted onto docs) | name, address, tin, phone, email |
| `suppliers` | Vendor registry (for POs) | name, address, tin, phone, email |
| `vehicles` | Serviced-vehicle registry | customer_id, description, reg_no, make, model |
| `quotations` / `quotation_items` | Quotation + lines | ref_no, quote_date, job_title, subtotal, total, status, fairmarkit |
| `invoices` / `invoice_items` | Invoice + per-line VAT | invoice_no, po_no, vat_rate, subtotal, vat_total, total, status |
| `purchase_orders` / `purchase_order_items` | PO (Bade→supplier) + lines | po_no, supplier, subtotal, vat_total, total, status |
| `job_deliveries` | Job delivery report (form) | jd_no, grn_no, po_no, work_done, vehicle, items_changed, accessories_*, date_in/out |

## Conventions
- PKs are `uuid default gen_random_uuid()`. Every table has `created_at`, `updated_at`
  (auto via `set_updated_at()` trigger) and `created_by → auth.users`.
- Money `numeric(14,2)`, quantities `numeric(12,2)`, VAT rate `numeric(6,3)`.
- Parent documents store **computed snapshots** (subtotal/vat_total/total, amount_in_words)
  and **contact snapshots** (customer/supplier name + address) so printed documents are stable.
- `status` columns use `text` + `CHECK` constraints (see DDL) rather than PG enums.
- Every document links to a vehicle (`vehicle_id`) **and** snapshots what it prints:
  `vehicle_label` on quotations/invoices, `vehicle_ref` on POs, `vehicle` on job
  deliveries. `vehicles.reg_no_key` is a generated column (plate upper-cased, punctuation
  stripped) used to match a typed plate to the registry. See `docs/VEHICLES.md`.
- `quotations.fairmarkit` (`jsonb`, nullable) snapshots the source Fairmarkit RFQ sheet
  when a quote was imported from one, so the bid workbook can be rebuilt on export.
  Null for ordinary quotations. See `docs/FAIRMARKIT.md`.

## Numbering
`select public.next_document_number('invoice');` → advances the counter and returns e.g.
`000159`. Called by the "new document" flow to pre-fill an editable, unique number.
Seed starting points: quotation `BAD/00001`, invoice `000159`, PO `PO/00001`,
job_delivery `000160` (continuing the sample sequence).

## Security (RLS)
RLS is enabled on every table with a single policy: **authenticated users have full
access** (`using (true) with check (true)`). This is an internal single-tenant tool.
To lock down further later, replace with per-user/ownership policies on `created_by`.

## First user
No public sign-up. Create staff accounts in Supabase → Authentication → Users (or enable
email sign-ups temporarily). Then log in at `/login`.
