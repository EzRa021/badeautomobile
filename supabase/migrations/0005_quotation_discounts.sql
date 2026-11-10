-- =============================================================================
-- 0005 — Quotation discounts
--
-- Two levels, both optional:
--   * per item        quotation_items.discount_*   (% of the line, or a fixed ₦ amount)
--   * whole quotation quotations.discount_*        (% of the sub-total, or a fixed ₦ amount)
--
-- For each level we keep what the user typed (discount_type + discount_value) AND the
-- computed ₦ figure (discount_amount) so printed documents stay stable even if the
-- maths ever changes.
--
-- Meaning of existing columns after this migration:
--   quotation_items.amount  = line NET (after the item discount).
--                             Gross = amount + discount_amount.
--   quotations.subtotal     = Σ item amounts (after item discounts, before the overall one).
--   quotations.total        = subtotal − quotations.discount_amount.
-- Rows created before this migration have no discount, so subtotal = total and every
-- amount is unchanged.
--
-- Idempotent.
-- =============================================================================

alter table public.quotation_items
  add column if not exists discount_type   text not null default 'percent',
  add column if not exists discount_value  numeric(14,2) not null default 0,
  add column if not exists discount_amount numeric(14,2) not null default 0;

alter table public.quotations
  add column if not exists discount_type   text not null default 'percent',
  add column if not exists discount_value  numeric(14,2) not null default 0,
  add column if not exists discount_amount numeric(14,2) not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quotation_items_discount_chk') then
    alter table public.quotation_items
      add constraint quotation_items_discount_chk
      check (discount_type in ('percent','amount')
             and discount_value >= 0
             and discount_amount >= 0
             and (discount_type <> 'percent' or discount_value <= 100));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'quotations_discount_chk') then
    alter table public.quotations
      add constraint quotations_discount_chk
      check (discount_type in ('percent','amount')
             and discount_value >= 0
             and discount_amount >= 0
             and (discount_type <> 'percent' or discount_value <= 100));
  end if;
end $$;

comment on column public.quotation_items.discount_type   is 'percent | amount — how discount_value is read';
comment on column public.quotation_items.discount_value  is 'What the user typed: a percentage (0–100) or a ₦ amount';
comment on column public.quotation_items.discount_amount is 'Computed ₦ taken off this line. amount (net) = gross − discount_amount';
comment on column public.quotations.discount_type   is 'percent | amount — how discount_value is read';
comment on column public.quotations.discount_value  is 'Whole-quotation discount as typed: a percentage (0–100) or a ₦ amount';
comment on column public.quotations.discount_amount is 'Computed ₦ taken off the sub-total. total = subtotal − discount_amount';
