-- Vehicle service history
-- ---------------------------------------------------------------------------
-- A workshop services the same vehicles again and again, so every document
-- should be attributable to one. Before this migration only quotations and job
-- deliveries carried `vehicle_id`; purchase orders had a free-text
-- `vehicle_ref` and invoices had nothing at all, which made a per-vehicle
-- history impossible to assemble.
--
-- This adds the missing links plus a printed-text snapshot alongside each one
-- (same rule as customer/supplier: the document must read correctly even if the
-- vehicle is later renamed or deleted).

-- --------------------------------------------------------------- vehicles
-- Normalised plate ("LSD 656 HD" / "lsd-656hd" → "LSD656HD") so a vehicle typed
-- on a document can be matched to the registry instead of creating a duplicate.
alter table public.vehicles
  add column if not exists reg_no_key text
  generated always as (
    nullif(upper(regexp_replace(coalesce(reg_no, ''), '[^A-Za-z0-9]', '', 'g')), '')
  ) stored;

-- Deliberately not unique: existing registries may already hold duplicate
-- plates, and a failed migration is worse than a duplicate. Lookups pick the
-- earliest-created match.
create index if not exists idx_vehicles_reg_no_key
  on public.vehicles (reg_no_key) where reg_no_key is not null;

create index if not exists idx_vehicles_description
  on public.vehicles (lower(description));

-- ------------------------------------------------------------- quotations
alter table public.quotations
  add column if not exists vehicle_label text;

comment on column public.quotations.vehicle_label is
  'Vehicle description snapshotted at save time (stable if the registry changes).';

create index if not exists idx_quotations_vehicle
  on public.quotations (vehicle_id) where vehicle_id is not null;

-- --------------------------------------------------------------- invoices
alter table public.invoices
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null;
alter table public.invoices
  add column if not exists vehicle_label text;

create index if not exists idx_invoices_vehicle
  on public.invoices (vehicle_id) where vehicle_id is not null;

-- -------------------------------------------------------- purchase orders
-- `vehicle_ref` stays: it is what the PO prints. `vehicle_id` is the link.
alter table public.purchase_orders
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null;

create index if not exists idx_purchase_orders_vehicle
  on public.purchase_orders (vehicle_id) where vehicle_id is not null;

-- ---------------------------------------------------------- job deliveries
-- Already has `vehicle_id` + printed `vehicle`; it only needs the index.
create index if not exists idx_job_deliveries_vehicle
  on public.job_deliveries (vehicle_id) where vehicle_id is not null;

-- ---------------------------------------------------------------- backfill
-- Snapshot the label for quotations already linked to a vehicle.
update public.quotations q
   set vehicle_label = v.description
  from public.vehicles v
 where q.vehicle_id = v.id
   and q.vehicle_label is null;

-- Link job deliveries whose printed vehicle text matches the registry. A
-- correlated subquery is used deliberately: an UPDATE's FROM clause (LATERAL
-- included) cannot reference the table being updated.
update public.job_deliveries jd
   set vehicle_id = (
     select v.id
       from public.vehicles v
      where (v.reg_no_key is not null
              and upper(regexp_replace(jd.vehicle, '[^A-Za-z0-9]', '', 'g'))
                  like '%' || v.reg_no_key || '%')
         or lower(btrim(jd.vehicle)) = lower(btrim(v.description))
      order by v.created_at
      limit 1
   )
 where jd.vehicle_id is null
   and jd.vehicle is not null;

-- Same for purchase orders written against a vehicle by name/plate.
update public.purchase_orders po
   set vehicle_id = (
     select v.id
       from public.vehicles v
      where (v.reg_no_key is not null
              and upper(regexp_replace(po.vehicle_ref, '[^A-Za-z0-9]', '', 'g'))
                  like '%' || v.reg_no_key || '%')
         or lower(btrim(po.vehicle_ref)) = lower(btrim(v.description))
      order by v.created_at
      limit 1
   )
 where po.vehicle_id is null
   and po.vehicle_ref is not null;
