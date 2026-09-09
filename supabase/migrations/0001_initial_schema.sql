-- =============================================================================
-- Bade Automobile Ltd — Document Management System
-- Initial schema: company profile, contacts (customers/suppliers/vehicles),
-- and the four document types (quotation, invoice, purchase order, job delivery)
-- plus their line items and an atomic document-numbering helper.
--
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- Single-tenant / internal tool: every authenticated user has full access (RLS).
-- =============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- updated_at trigger helper
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- COMPANY SETTINGS (singleton row)
-- Editable letterhead contact details + document defaults. The visual
-- letterhead (logo + watermark) is a fixed image asset, not stored here.
-- =============================================================================
create table if not exists public.company_settings (
  id            uuid primary key default gen_random_uuid(),
  name          text not null default 'BADE AUTOMOBILE LTD',
  address       text not null default '17, Akindeko Akinbamidele Street, Off Emerald Road, Opp. Deeper Life Camp, Ogun State.',
  phone         text not null default '08122264086, 09136292232, 08179739999',
  email         text not null default 'badejotaofeek1@gmail.com',
  tin           text not null default '20724729-001',
  vat_rate      numeric(6,3) not null default 7.5,
  currency      text not null default 'NGN',
  bank_details  text,
  updated_at    timestamptz not null default now()
);

create trigger trg_company_settings_updated
  before update on public.company_settings
  for each row execute function public.set_updated_at();

-- Seed the singleton
insert into public.company_settings (name) values ('BADE AUTOMOBILE LTD')
on conflict do nothing;

-- =============================================================================
-- DOCUMENT NUMBER COUNTERS  (atomic auto-numbering)
-- =============================================================================
create table if not exists public.document_counters (
  doc_type    text primary key,          -- 'quotation' | 'invoice' | 'purchase_order' | 'job_delivery'
  prefix      text not null default '',
  next_value  integer not null default 1,
  padding     integer not null default 6
);

insert into public.document_counters (doc_type, prefix, next_value, padding) values
  ('quotation',      'BAD/',  1,   5),
  ('invoice',        '',      159, 6),
  ('purchase_order', 'PO/',   1,   5),
  ('job_delivery',   '',      160, 6)
on conflict (doc_type) do nothing;

-- Returns the next formatted document number and advances the counter atomically.
create or replace function public.next_document_number(p_doc_type text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix  text;
  v_value   integer;
  v_padding integer;
begin
  update public.document_counters
     set next_value = next_value + 1
   where doc_type = p_doc_type
   returning prefix, next_value - 1, padding
     into v_prefix, v_value, v_padding;

  if not found then
    raise exception 'Unknown document type: %', p_doc_type;
  end if;

  return v_prefix || lpad(v_value::text, v_padding, '0');
end;
$$;

-- Peek the next number WITHOUT advancing (used to pre-fill the "new document" form).
create or replace function public.peek_document_number(p_doc_type text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select prefix || lpad(next_value::text, padding, '0')
  from public.document_counters
  where doc_type = p_doc_type;
$$;

-- After a document is saved, advance the counter past the used numeric value.
create or replace function public.bump_document_counter(p_doc_type text, p_used integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.document_counters
     set next_value = greatest(next_value, p_used + 1)
   where doc_type = p_doc_type;
$$;

-- =============================================================================
-- CONTACTS
-- =============================================================================
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,               -- multi-line
  tin         text,
  phone       text,
  email       text,
  notes       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_customers_updated before update on public.customers
  for each row execute function public.set_updated_at();
create index if not exists idx_customers_name on public.customers (lower(name));

create table if not exists public.suppliers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  tin         text,
  phone       text,
  email       text,
  notes       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_suppliers_updated before update on public.suppliers
  for each row execute function public.set_updated_at();
create index if not exists idx_suppliers_name on public.suppliers (lower(name));

-- Lightweight vehicle registry (a workshop repeatedly services the same vehicles)
create table if not exists public.vehicles (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid references public.customers(id) on delete set null,
  description  text not null,      -- e.g. "Toyota Prado AGL 58EW"
  reg_no       text,              -- plate number
  make         text,
  model        text,
  notes        text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_vehicles_updated before update on public.vehicles
  for each row execute function public.set_updated_at();
create index if not exists idx_vehicles_customer on public.vehicles (customer_id);

-- =============================================================================
-- QUOTATION
-- =============================================================================
create table if not exists public.quotations (
  id                uuid primary key default gen_random_uuid(),
  ref_no            text not null unique,
  quote_date        date not null default current_date,
  customer_id       uuid references public.customers(id) on delete set null,
  customer_name     text not null,          -- snapshot for the document
  customer_address  text,                   -- snapshot
  vehicle_id        uuid references public.vehicles(id) on delete set null,
  job_title         text,                   -- the banner row, e.g. "CARRY OUT REPAIRS ON ..."
  subtotal          numeric(14,2) not null default 0,
  total             numeric(14,2) not null default 0,
  amount_in_words   text,
  status            text not null default 'draft'
                    check (status in ('draft','sent','accepted','rejected','invoiced')),
  notes             text,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_quotations_updated before update on public.quotations
  for each row execute function public.set_updated_at();
create index if not exists idx_quotations_customer on public.quotations (customer_id);
create index if not exists idx_quotations_date on public.quotations (quote_date desc);

create table if not exists public.quotation_items (
  id            uuid primary key default gen_random_uuid(),
  quotation_id  uuid not null references public.quotations(id) on delete cascade,
  sort_order    integer not null default 0,
  description   text not null,
  qty           numeric(12,2) not null default 1,
  unit          text,                        -- Pcs / Set / Pc / Lot
  rate          numeric(14,2),              -- nullable (e.g. Labour lot)
  amount        numeric(14,2) not null default 0
);
create index if not exists idx_quotation_items_parent on public.quotation_items (quotation_id, sort_order);

-- =============================================================================
-- INVOICE  (VAT @ 7.5% per line, as in the template)
-- =============================================================================
create table if not exists public.invoices (
  id                uuid primary key default gen_random_uuid(),
  invoice_no        text not null unique,
  invoice_date      date not null default current_date,
  customer_id       uuid references public.customers(id) on delete set null,
  customer_name     text not null,
  customer_address  text,
  customer_number   text,                   -- "Customer's Number" on the template
  po_no             text,                   -- customer's purchase-order reference
  vat_rate          numeric(6,3) not null default 7.5,
  subtotal          numeric(14,2) not null default 0,   -- sum of net amounts
  vat_total         numeric(14,2) not null default 0,
  total             numeric(14,2) not null default 0,   -- incl. tax
  amount_in_words   text,
  status            text not null default 'unpaid'
                    check (status in ('unpaid','partial','paid','cancelled')),
  quotation_id      uuid references public.quotations(id) on delete set null,  -- if converted from a quote
  notes             text,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_invoices_updated before update on public.invoices
  for each row execute function public.set_updated_at();
create index if not exists idx_invoices_customer on public.invoices (customer_id);
create index if not exists idx_invoices_date on public.invoices (invoice_date desc);

create table if not exists public.invoice_items (
  id            uuid primary key default gen_random_uuid(),
  invoice_id    uuid not null references public.invoices(id) on delete cascade,
  sort_order    integer not null default 0,
  item_code     text,                        -- material / customer number, e.g. 90072381
  description   text not null,
  qty           numeric(12,2) not null default 1,
  unit_price    numeric(14,2) not null default 0,
  net_amount    numeric(14,2) not null default 0,   -- qty * unit_price
  vat_rate      numeric(6,3) not null default 7.5,
  vat_amount    numeric(14,2) not null default 0,
  gross_amount  numeric(14,2) not null default 0
);
create index if not exists idx_invoice_items_parent on public.invoice_items (invoice_id, sort_order);

-- =============================================================================
-- PURCHASE ORDER  (Bade -> supplier, e.g. ordering parts)
-- No original template existed; rendered on the same Bade letterhead.
-- =============================================================================
create table if not exists public.purchase_orders (
  id                uuid primary key default gen_random_uuid(),
  po_no             text not null unique,
  po_date           date not null default current_date,
  supplier_id       uuid references public.suppliers(id) on delete set null,
  supplier_name     text not null,
  supplier_address  text,
  deliver_to        text,                   -- delivery address / note
  vehicle_ref       text,                   -- optional vehicle/job this PO relates to
  vat_rate          numeric(6,3) not null default 0,   -- POs often net; default off
  subtotal          numeric(14,2) not null default 0,
  vat_total         numeric(14,2) not null default 0,
  total             numeric(14,2) not null default 0,
  amount_in_words   text,
  status            text not null default 'draft'
                    check (status in ('draft','sent','received','cancelled')),
  expected_date     date,
  notes             text,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_purchase_orders_updated before update on public.purchase_orders
  for each row execute function public.set_updated_at();
create index if not exists idx_po_supplier on public.purchase_orders (supplier_id);
create index if not exists idx_po_date on public.purchase_orders (po_date desc);

create table if not exists public.purchase_order_items (
  id                 uuid primary key default gen_random_uuid(),
  purchase_order_id  uuid not null references public.purchase_orders(id) on delete cascade,
  sort_order         integer not null default 0,
  description        text not null,
  qty                numeric(12,2) not null default 1,
  unit               text,
  unit_price         numeric(14,2) not null default 0,
  amount             numeric(14,2) not null default 0
);
create index if not exists idx_po_items_parent on public.purchase_order_items (purchase_order_id, sort_order);

-- =============================================================================
-- JOB DELIVERY REPORT
-- =============================================================================
create table if not exists public.job_deliveries (
  id                    uuid primary key default gen_random_uuid(),
  jd_no                 text not null unique,     -- shown as "Invoice No" on the template
  delivery_date         date not null default current_date,
  grn_no                text,                     -- goods received note reference
  po_no                 text,                     -- customer's PO reference
  customer_id           uuid references public.customers(id) on delete set null,
  customer_name         text not null,
  customer_address      text,
  vehicle_id            uuid references public.vehicles(id) on delete set null,
  work_done             text,                     -- "<work_done> has been carried out on <vehicle>"
  vehicle               text,
  items_changed         text,
  note                  text,
  next_service          text,                     -- e.g. mileage 178724
  accessories_found     text,
  accessories_returned  text,
  date_in               timestamptz,
  date_out              timestamptz,
  driver_name           text,                     -- "Mr. Francis (In), Mr. Asisi (Out)"
  coordinator_sign      text,
  inspector_sign        text,
  status                text not null default 'draft'
                        check (status in ('draft','completed')),
  invoice_id            uuid references public.invoices(id) on delete set null,
  notes                 text,
  created_by            uuid references auth.users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger trg_job_deliveries_updated before update on public.job_deliveries
  for each row execute function public.set_updated_at();
create index if not exists idx_jd_customer on public.job_deliveries (customer_id);
create index if not exists idx_jd_date on public.job_deliveries (delivery_date desc);

-- =============================================================================
-- ROW LEVEL SECURITY
-- Single-tenant internal tool: any authenticated user may read/write everything.
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'company_settings','document_counters','customers','suppliers','vehicles',
    'quotations','quotation_items','invoices','invoice_items',
    'purchase_orders','purchase_order_items','job_deliveries'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($p$
      create policy "authenticated full access" on public.%I
        for all to authenticated using (true) with check (true);
    $p$, t);
  end loop;
end $$;
