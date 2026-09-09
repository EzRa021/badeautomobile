import { z } from "zod";
import { fairmarkitSourceField } from "@/lib/fairmarkit/schema";
import {
  zMoney,
  zMoneyNullable,
  zQty,
  zOptText,
  zRequiredText,
  zDate,
} from "./shared";

const uuidNullable = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.string().uuid().nullable(),
);

const dateNullable = z.preprocess(
  (v) => (v === "" || v == null ? null : String(v)),
  z.string().nullable(),
);

// ---------------------------------------------------------------- Quotation
export const quotationItemSchema = z.object({
  description: zRequiredText("Item description"),
  qty: zQty,
  unit: zOptText,
  rate: zMoneyNullable,
  amount: zMoney,
});

export const quotationSchema = z.object({
  ref_no: zRequiredText("Reference"),
  quote_date: zDate,
  customer_id: uuidNullable,
  customer_name: zRequiredText("Customer"),
  customer_address: zOptText,
  vehicle_id: uuidNullable,
  vehicle_label: zOptText,
  vehicle_reg_no: zOptText,
  job_title: zOptText,
  status: z
    .enum(["draft", "sent", "accepted", "rejected", "invoiced"])
    .default("draft"),
  notes: zOptText,
  /** Source RFQ sheet when the quote was imported from Fairmarkit. */
  fairmarkit: fairmarkitSourceField.default(null),
  items: z.array(quotationItemSchema).min(1, "Add at least one item"),
});
export type QuotationInput = z.infer<typeof quotationSchema>;

// ------------------------------------------------------------------ Invoice
export const invoiceItemSchema = z.object({
  item_code: zOptText,
  description: zRequiredText("Item description"),
  qty: zQty,
  unit_price: zMoney,
});

export const invoiceSchema = z.object({
  invoice_no: zRequiredText("Invoice number"),
  invoice_date: zDate,
  customer_id: uuidNullable,
  customer_name: zRequiredText("Customer"),
  customer_address: zOptText,
  customer_number: zOptText,
  po_no: zOptText,
  vehicle_id: uuidNullable,
  vehicle_label: zOptText,
  vehicle_reg_no: zOptText,
  vat_rate: zMoney,
  status: z.enum(["unpaid", "partial", "paid", "cancelled"]).default("unpaid"),
  quotation_id: uuidNullable,
  notes: zOptText,
  items: z.array(invoiceItemSchema).min(1, "Add at least one item"),
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;

// ------------------------------------------------------------ Purchase Order
export const purchaseOrderItemSchema = z.object({
  description: zRequiredText("Item description"),
  qty: zQty,
  unit: zOptText,
  unit_price: zMoney,
  amount: zMoney,
});

export const purchaseOrderSchema = z.object({
  po_no: zRequiredText("PO number"),
  po_date: zDate,
  supplier_id: uuidNullable,
  supplier_name: zRequiredText("Supplier"),
  supplier_address: zOptText,
  deliver_to: zOptText,
  vehicle_id: uuidNullable,
  vehicle_ref: zOptText,
  vehicle_reg_no: zOptText,
  vat_rate: zMoney,
  expected_date: dateNullable,
  status: z.enum(["draft", "sent", "received", "cancelled"]).default("draft"),
  notes: zOptText,
  items: z.array(purchaseOrderItemSchema).min(1, "Add at least one item"),
});
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

// ------------------------------------------------------------- Job Delivery
export const jobDeliverySchema = z.object({
  jd_no: zRequiredText("Document number"),
  delivery_date: zDate,
  grn_no: zOptText,
  po_no: zOptText,
  customer_id: uuidNullable,
  customer_name: zRequiredText("Customer"),
  customer_address: zOptText,
  vehicle_id: uuidNullable,
  work_done: zOptText,
  vehicle: zOptText,
  vehicle_reg_no: zOptText,
  items_changed: zOptText,
  note: zOptText,
  next_service: zOptText,
  accessories_found: zOptText,
  accessories_returned: zOptText,
  date_in: dateNullable,
  date_out: dateNullable,
  driver_name: zOptText,
  coordinator_sign: zOptText,
  inspector_sign: zOptText,
  status: z.enum(["draft", "completed"]).default("draft"),
  notes: zOptText,
});
export type JobDeliveryInput = z.infer<typeof jobDeliverySchema>;

// ------------------------------------------------------------------ Settings
export const settingsSchema = z.object({
  name: zRequiredText("Company name"),
  address: zRequiredText("Address"),
  phone: zOptText,
  email: zOptText,
  tin: zOptText,
  vat_rate: zMoney,
  bank_details: zOptText,
});
export type SettingsInput = z.infer<typeof settingsSchema>;
