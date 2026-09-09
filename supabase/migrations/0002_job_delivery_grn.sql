-- =============================================================================
-- 0002 — Job Delivery: GRN (Goods Received Note) reference
--
-- Prints above "PO No" in the top-right header block of the Job Delivery Report.
-- Idempotent: databases created from the updated 0001 already have the column.
-- =============================================================================

alter table public.job_deliveries
  add column if not exists grn_no text;

comment on column public.job_deliveries.grn_no is 'Goods received note reference';
