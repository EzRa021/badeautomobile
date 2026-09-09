-- Fairmarkit RFQ round-trip
-- ---------------------------------------------------------------------------
-- A quotation can be created by importing the Excel bid sheet a supplier
-- downloads from a Fairmarkit RFQ. Fairmarkit's importer only accepts the sheet
-- it issued — columns A–M are the buyer's and are marked "do not modify" — so
-- the whole source sheet (header block, column headers and every buyer cell) is
-- snapshotted here and replayed on export with the supplier columns filled in
-- from the quotation's priced line items.
--
-- Null for quotations that did not come from Fairmarkit; those can still be
-- exported, using a synthesised sheet built from the quotation itself.

alter table public.quotations
  add column if not exists fairmarkit jsonb;

comment on column public.quotations.fairmarkit is
  'Snapshot of the source Fairmarkit RFQ sheet (headers, header block, buyer cells, RFQ metadata) used to rebuild an importable bid workbook.';

-- Lets the quotation list surface "imported from RFQ 3058650" without a scan.
create index if not exists idx_quotations_fairmarkit_rfq
  on public.quotations ((fairmarkit -> 'meta' ->> 'rfq_id'))
  where fairmarkit is not null;
