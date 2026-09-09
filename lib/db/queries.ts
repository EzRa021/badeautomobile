import { createClient } from "@/lib/supabase/server";
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

// ------------------------------------------------------------------ Customers
export async function listCustomers(q?: string): Promise<Customer[]> {
  const supabase = await createClient();
  let query = supabase.from("customers").select("*").order("name");
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,tin.ilike.%${q}%`);
  const { data } = await query;
  return (data as Customer[]) ?? [];
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
export async function listQuotations(opts: { q?: string; status?: string } = {}): Promise<Quotation[]> {
  const supabase = await createClient();
  let query = supabase.from("quotations").select("*").order("quote_date", { ascending: false });
  if (opts.q) query = query.or(`ref_no.ilike.%${opts.q}%,customer_name.ilike.%${opts.q}%,job_title.ilike.%${opts.q}%`);
  if (opts.status) query = query.eq("status", opts.status);
  const { data } = await query;
  return (data as Quotation[]) ?? [];
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
export async function listInvoices(opts: { q?: string; status?: string } = {}): Promise<Invoice[]> {
  const supabase = await createClient();
  let query = supabase.from("invoices").select("*").order("invoice_date", { ascending: false });
  if (opts.q) query = query.or(`invoice_no.ilike.%${opts.q}%,customer_name.ilike.%${opts.q}%,po_no.ilike.%${opts.q}%`);
  if (opts.status) query = query.eq("status", opts.status);
  const { data } = await query;
  return (data as Invoice[]) ?? [];
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
export async function listPurchaseOrders(opts: { q?: string; status?: string } = {}): Promise<PurchaseOrder[]> {
  const supabase = await createClient();
  let query = supabase.from("purchase_orders").select("*").order("po_date", { ascending: false });
  if (opts.q) query = query.or(`po_no.ilike.%${opts.q}%,supplier_name.ilike.%${opts.q}%,vehicle_ref.ilike.%${opts.q}%`);
  if (opts.status) query = query.eq("status", opts.status);
  const { data } = await query;
  return (data as PurchaseOrder[]) ?? [];
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
export async function listJobDeliveries(opts: { q?: string; status?: string } = {}): Promise<JobDelivery[]> {
  const supabase = await createClient();
  let query = supabase.from("job_deliveries").select("*").order("delivery_date", { ascending: false });
  if (opts.q) query = query.or(`jd_no.ilike.%${opts.q}%,customer_name.ilike.%${opts.q}%,grn_no.ilike.%${opts.q}%,po_no.ilike.%${opts.q}%,vehicle.ilike.%${opts.q}%`);
  if (opts.status) query = query.eq("status", opts.status);
  const { data } = await query;
  return (data as JobDelivery[]) ?? [];
}

export async function getJobDelivery(id: string): Promise<JobDelivery | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("job_deliveries").select("*").eq("id", id).maybeSingle();
  return data as JobDelivery | null;
}
