# Database (Supabase / Postgres)

Full DDL: `supabase/migrations/0001_initial_schema.sql`. Apply it in the Supabase SQL
editor or with `supabase db push`. This file is the human-readable summary.

## Tables
| Table | Purpose | Key columns |
|---|---|---|
| `company_settings` | Singleton letterhead/contact + defaults | name, address, phone, email, tin, vat_rate, currency |
| `document_counters` | Atomic per-type numbering | doc_type (pk), prefix, next_value, padding |
| `customers` | Client registry (snapshotted onto docs) | name, address, tin, phone, email |
| `suppliers` | Vendor registry (for POs) | name, address, tin, phone, email |
| `vehicles` | Serviced-vehicle registry | customer_id, description, reg_no, make, model |
| `quotations` / `quotation_items` | Quotation + lines | ref_no, quote_date, job_title, subtotal, total, status |
| `invoices` / `invoice_items` | Invoice + per-line VAT | invoice_no, po_no, vat_rate, subtotal, vat_total, total, status |
| `purchase_orders` / `purchase_order_items` | PO (Bade→supplier) + lines | po_no, supplier, subtotal, vat_total, total, status |
| `job_deliveries` | Job delivery report (form) | jd_no, po_no, work_done, vehicle, items_changed, accessories_*, date_in/out |

## Conventions
- PKs are `uuid default gen_random_uuid()`. Every table has `created_at`, `updated_at`
  (auto via `set_updated_at()` trigger) and `created_by → auth.users`.
- Money `numeric(14,2)`, quantities `numeric(12,2)`, VAT rate `numeric(6,3)`.
- Parent documents store **computed snapshots** (subtotal/vat_total/total, amount_in_words)
  and **contact snapshots** (customer/supplier name + address) so printed documents are stable.
- `status` columns use `text` + `CHECK` constraints (see DDL) rather than PG enums.

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
