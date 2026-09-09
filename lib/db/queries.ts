import { createClient } from "@/lib/supabase/server";
import {
  escapeLike,
  resolvePaging,
  resolveSort,
  toPaged,
  type ListOptions,
  type Paged,
  type SortMap,
} from "./list";
import type {
  CompanySettings,
  Customer,
  Supplier,
  Vehicle,
  Quotation,
  QuotationWithItems,
  Invoice,
  InvoiceWithItems,
  PurchaseOrder,
  PurchaseOrderWithItems,
  JobDelivery,
} from "@/lib/types";

// ------------------------------------------------------------------ Settings
export async function getCompanySettings(): Promise<CompanySettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("company_settings")
    .select("*")
    .order("updated_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data as CompanySettings | null;
}


// ------------------------------------------------------------- List plumbing
/**
 * Shape a list query the same way everywhere: search, status, an inclusive date
 * range on the table's own date column, an allowlisted sort with a stable
 * tiebreaker, and a counted page.
 */
async function pagedList<T>(
  table: string,
  opts: ListOptions,
  config: {
    /** Columns the free-text search covers. */
    search: string[];
    /** Column the `from`/`to` range applies to. */
    dateColumn: string;
    sorts: SortMap;
    defaultSort: string;
    select?: string;
  },
): Promise<Paged<T>> {
  const supabase = await createClient();
  const sort = resolveSort(config.sorts, config.defaultSort, opts.sort, opts.dir);
  const paging = resolvePaging(opts);

  let query = supabase.from(table).select(config.select ?? "*", { count: "exact" });

  const term = opts.q ? escapeLike(opts.q) : "";
  if (term) {
    query = query.or(config.search.map((column) => `${column}.ilike.%${term}%`).join(","));
  }
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.from) query = query.gte(config.dateColumn, opts.from);
  if (opts.to) query = query.lte(config.dateColumn, opts.to);

  const ordered = query
    .order(sort.column, { ascending: sort.ascending })
    // Keeps paging stable when many rows share the sorted value.
    .order("id", { ascending: true });

  const { data, count } = await ordered.range(paging.offset, paging.limit);
  const result = toPaged((data as T[]) ?? [], count ?? null, paging);

  // A hand-edited `?page=` (or rows deleted since the link was made) can land
  // past the end. Fetch the clamped page so the table and pager agree.
  if (result.rows.length === 0 && result.total > 0 && paging.page > result.page) {
    const clamped = resolvePaging({ ...opts, page: result.page });
    const { data: retry } = await ordered.range(clamped.offset, clamped.limit);
    return toPaged((retry as T[]) ?? [], count ?? null, clamped);
  }

  return result;
}

// ------------------------------------------------------------------ Customers
export async function listCustomers(q?: string): Promise<Customer[]> {
  const supabase = await createClient();
  let query = supabase.from("customers").select("*").order("name");
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,tin.ilike.%${q}%`);
  const { data } = await query;
  return (data as Customer[]) ?? [];
}

export const CONTACT_SORTS: SortMap = {
  name: "asc",
  phone: "asc",
  email: "asc",
  tin: "asc",
  created_at: "desc",
};

/** Paged view for the customers list page (the unpaged `listCustomers` feeds form pickers). */
export function pagedCustomers(opts: ListOptions = {}): Promise<Paged<Customer>> {
  return pagedList<Customer>("customers", opts, {
    search: ["name", "phone", "email", "tin"],
    dateColumn: "created_at",
    sorts: CONTACT_SORTS,
    defaultSort: "name",
  });
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  return data as Customer | null;
}

// ------------------------------------------------------------------ Suppliers
export async function listSuppliers(q?: string): Promise<Supplier[]> {
  const supabase = await createClient();
  let query = supabase.from("suppliers").select("*").order("name");
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,tin.ilike.%${q}%`);
  const { data } = await query;
  return (data as Supplier[]) ?? [];
}

/** Paged view for the suppliers list page. */
export function pagedSuppliers(opts: ListOptions = {}): Promise<Paged<Supplier>> {
  return pagedList<Supplier>("suppliers", opts, {
    search: ["name", "phone", "email", "tin"],
    dateColumn: "created_at",
    sorts: CONTACT_SORTS,
    defaultSort: "name",
  });
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("suppliers").select("*").eq("id", id).maybeSingle();
  return data as Supplier | null;
}

// ------------------------------------------------------------------- Vehicles
export async function listVehicles(q?: string): Promise<(Vehicle & { customer?: { name: string } | null })[]> {
  const supabase = await createClient();
  let query = supabase
    .from("vehicles")
    .select("*, customer:customers(name)")
    .order("created_at", { ascending: false });
  if (q) query = query.or(`description.ilike.%${q}%,reg_no.ilike.%${q}%,make.ilike.%${q}%,model.ilike.%${q}%`);
  const { data } = await query;
  return (data as (Vehicle & { customer?: { name: string } | null })[]) ?? [];
}

export type VehicleRow = Vehicle & { customer?: { name: string } | null };

export const VEHICLE_SORTS: SortMap = {
  description: "asc",
  reg_no: "asc",
  make: "asc",
  model: "asc",
  created_at: "desc",
};

/** Paged view for the vehicles list page. */
export function pagedVehicles(opts: ListOptions = {}): Promise<Paged<VehicleRow>> {
  return pagedList<VehicleRow>("vehicles", opts, {
    search: ["description", "reg_no", "make", "model"],
    dateColumn: "created_at",
    sorts: VEHICLE_SORTS,
    defaultSort: "description",
    select: "*, customer:customers(name)",
  });
}

export type VehicleWithOwner = Vehicle & { customer?: { id: string; name: string } | null };

/** A single vehicle, with its owner joined for the history header. */
export async function getVehicleWithOwner(id: string): Promise<VehicleWithOwner | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("*, customer:customers(id, name)")
    .eq("id", id)
    .maybeSingle();
  return (data as VehicleWithOwner) ?? null;
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("vehicles").select("*").eq("id", id).maybeSingle();
  return data as Vehicle | null;
}

export async function vehiclesForCustomer(customerId: string): Promise<Vehicle[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .eq("customer_id", customerId)
    .order("description");
  return (data as Vehicle[]) ?? [];
}

// ----------------------------------------------------------------- Quotations
export const QUOTATION_SORTS: SortMap = {
  ref_no: "asc",
  quote_date: "desc",
  customer_name: "asc",
  vehicle_label: "asc",
  total: "desc",
  status: "asc",
};

export function listQuotations(opts: ListOptions = {}): Promise<Paged<Quotation>> {
  return pagedList<Quotation>("quotations", opts, {
    search: ["ref_no", "customer_name", "job_title", "vehicle_label"],
    dateColumn: "quote_date",
    sorts: QUOTATION_SORTS,
    defaultSort: "quote_date",
  });
}

export async function getQuotation(id: string): Promise<QuotationWithItems | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotations")
    .select("*, items:quotation_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const doc = data as QuotationWithItems;
  doc.items = (doc.items ?? []).sort((a, b) => a.sort_order - b.sort_order);
  return doc;
}

// ------------------------------------------------------------------- Invoices
export const INVOICE_SORTS: SortMap = {
  invoice_no: "asc",
  invoice_date: "desc",
  customer_name: "asc",
  po_no: "asc",
  total: "desc",
  status: "asc",
};

export function listInvoices(opts: ListOptions = {}): Promise<Paged<Invoice>> {
  return pagedList<Invoice>("invoices", opts, {
    search: ["invoice_no", "customer_name", "po_no", "vehicle_label"],
    dateColumn: "invoice_date",
    sorts: INVOICE_SORTS,
    defaultSort: "invoice_date",
  });
}

export async function getInvoice(id: string): Promise<InvoiceWithItems | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, items:invoice_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const doc = data as InvoiceWithItems;
  doc.items = (doc.items ?? []).sort((a, b) => a.sort_order - b.sort_order);
  return doc;
}

// ------------------------------------------------------------- Purchase Orders
export const PURCHASE_ORDER_SORTS: SortMap = {
  po_no: "asc",
  po_date: "desc",
  supplier_name: "asc",
  vehicle_ref: "asc",
  total: "desc",
  status: "asc",
  expected_date: "desc",
};

export function listPurchaseOrders(opts: ListOptions = {}): Promise<Paged<PurchaseOrder>> {
  return pagedList<PurchaseOrder>("purchase_orders", opts, {
    search: ["po_no", "supplier_name", "vehicle_ref"],
    dateColumn: "po_date",
    sorts: PURCHASE_ORDER_SORTS,
    defaultSort: "po_date",
  });
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrderWithItems | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_orders")
    .select("*, items:purchase_order_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const doc = data as PurchaseOrderWithItems;
  doc.items = (doc.items ?? []).sort((a, b) => a.sort_order - b.sort_order);
  return doc;
}

// ------------------------------------------------------------- Job Deliveries
export const JOB_DELIVERY_SORTS: SortMap = {
  jd_no: "asc",
  delivery_date: "desc",
  customer_name: "asc",
  vehicle: "asc",
  grn_no: "asc",
  status: "asc",
};

export function listJobDeliveries(opts: ListOptions = {}): Promise<Paged<JobDelivery>> {
  return pagedList<JobDelivery>("job_deliveries", opts, {
    search: ["jd_no", "customer_name", "grn_no", "po_no", "vehicle"],
    dateColumn: "delivery_date",
    sorts: JOB_DELIVERY_SORTS,
    defaultSort: "delivery_date",
  });
}

export async function getJobDelivery(id: string): Promise<JobDelivery | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("job_deliveries").select("*").eq("id", id).maybeSingle();
  return data as JobDelivery | null;
}
