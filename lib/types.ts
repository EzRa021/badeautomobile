// Row types mirroring supabase/migrations/0001_initial_schema.sql

export type DocType = "quotation" | "invoice" | "purchase_order" | "job_delivery";

export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "invoiced";
export type InvoiceStatus = "unpaid" | "partial" | "paid" | "cancelled";
export type PurchaseOrderStatus = "draft" | "sent" | "received" | "cancelled";
export type JobDeliveryStatus = "draft" | "completed";

export interface CompanySettings {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  tin: string;
  vat_rate: number;
  currency: string;
  bank_details: string | null;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string | null;
  tin: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  address: string | null;
  tin: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  customer_id: string | null;
  description: string;
  reg_no: string | null;
  make: string | null;
  model: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quotation {
  id: string;
  ref_no: string;
  quote_date: string;
  customer_id: string | null;
  customer_name: string;
  customer_address: string | null;
  vehicle_id: string | null;
  job_title: string | null;
  subtotal: number;
  total: number;
  amount_in_words: string | null;
  status: QuotationStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuotationItem {
  id: string;
  quotation_id: string;
  sort_order: number;
  description: string;
  qty: number;
  unit: string | null;
  rate: number | null;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  invoice_date: string;
  customer_id: string | null;
  customer_name: string;
  customer_address: string | null;
  customer_number: string | null;
  po_no: string | null;
  vat_rate: number;
  subtotal: number;
  vat_total: number;
  total: number;
  amount_in_words: string | null;
  status: InvoiceStatus;
  quotation_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  sort_order: number;
  item_code: string | null;
  description: string;
  qty: number;
  unit_price: number;
  net_amount: number;
  vat_rate: number;
  vat_amount: number;
  gross_amount: number;
}

export interface PurchaseOrder {
  id: string;
  po_no: string;
  po_date: string;
  supplier_id: string | null;
  supplier_name: string;
  supplier_address: string | null;
  deliver_to: string | null;
  vehicle_ref: string | null;
  vat_rate: number;
  subtotal: number;
  vat_total: number;
  total: number;
  amount_in_words: string | null;
  status: PurchaseOrderStatus;
  expected_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  sort_order: number;
  description: string;
  qty: number;
  unit: string | null;
  unit_price: number;
  amount: number;
}

export interface JobDelivery {
  id: string;
  jd_no: string;
  delivery_date: string;
  po_no: string | null;
  customer_id: string | null;
  customer_name: string;
  customer_address: string | null;
  vehicle_id: string | null;
  work_done: string | null;
  vehicle: string | null;
  items_changed: string | null;
  note: string | null;
  next_service: string | null;
  accessories_found: string | null;
  accessories_returned: string | null;
  date_in: string | null;
  date_out: string | null;
  driver_name: string | null;
  coordinator_sign: string | null;
  inspector_sign: string | null;
  status: JobDeliveryStatus;
  invoice_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Composite types (document + its line items)
export type QuotationWithItems = Quotation & { items: QuotationItem[] };
export type InvoiceWithItems = Invoice & { items: InvoiceItem[] };
export type PurchaseOrderWithItems = PurchaseOrder & { items: PurchaseOrderItem[] };
