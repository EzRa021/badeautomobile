"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";
import { invoiceSchema } from "@/lib/validation/documents";
import { bumpDocumentCounter } from "@/lib/db/numbering";
import { amountToWords } from "@/lib/utils/number-to-words";
import { round2 } from "@/lib/utils/money";
import type { ActionState } from "@/lib/validation/shared";

function parseItems(raw: FormDataEntryValue | null): unknown[] {
  try {
    const arr = JSON.parse(String(raw ?? "[]"));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function saveInvoice(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "").trim();

  const parsed = invoiceSchema.safeParse({
    invoice_no: formData.get("invoice_no"),
    invoice_date: formData.get("invoice_date"),
    customer_id: formData.get("customer_id"),
    customer_name: formData.get("customer_name"),
    customer_address: formData.get("customer_address"),
    customer_number: formData.get("customer_number"),
    po_no: formData.get("po_no"),
    vat_rate: formData.get("vat_rate"),
    status: formData.get("status") || "unpaid",
    quotation_id: formData.get("quotation_id"),
    notes: formData.get("notes"),
    items: parseItems(formData.get("items")),
  });
  if (!parsed.success) {
    const fe = parsed.error.flatten();
    return { fieldErrors: fe.fieldErrors as Record<string, string[]>, error: fe.formErrors[0] };
  }

  const data = parsed.data;
  const rate = data.vat_rate;

  const computedItems = data.items.map((it, i) => {
    const net = round2(it.qty * it.unit_price);
    const vat = round2((net * rate) / 100);
    const gross = round2(net + vat);
    return {
      sort_order: i,
      item_code: it.item_code,
      description: it.description,
      qty: it.qty,
      unit_price: it.unit_price,
      net_amount: net,
      vat_rate: rate,
      vat_amount: vat,
      gross_amount: gross,
    };
  });

  const subtotal = round2(computedItems.reduce((s, it) => s + it.net_amount, 0));
  const vat_total = round2(computedItems.reduce((s, it) => s + it.vat_amount, 0));
  const total = round2(computedItems.reduce((s, it) => s + it.gross_amount, 0));
  const amount_in_words = amountToWords(total);

  const parent = {
    invoice_no: data.invoice_no,
    invoice_date: data.invoice_date,
    customer_id: data.customer_id,
    customer_name: data.customer_name,
    customer_address: data.customer_address,
    customer_number: data.customer_number,
    po_no: data.po_no,
    vat_rate: rate,
    subtotal,
    vat_total,
    total,
    amount_in_words,
    status: data.status,
    quotation_id: data.quotation_id,
    notes: data.notes,
  };

  const supabase = await createClient();
  let invoiceId = id;

  if (id) {
    const { error } = await supabase.from("invoices").update(parent).eq("id", id);
    if (error) return { error: mapDbError(error.message) };
    await supabase.from("invoice_items").delete().eq("invoice_id", id);
  } else {
    const { data: created, error } = await supabase
      .from("invoices")
      .insert({ ...parent, created_by: user.id })
      .select("id")
      .single();
    if (error || !created) return { error: mapDbError(error?.message) };
    invoiceId = created.id;
  }

  const { error: itemsError } = await supabase
    .from("invoice_items")
    .insert(computedItems.map((it) => ({ ...it, invoice_id: invoiceId })));
  if (itemsError) return { error: itemsError.message };

  await bumpDocumentCounter("invoice", data.invoice_no);

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  redirect(`/invoices/${invoiceId}`);
}

export async function deleteInvoice(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("invoices").delete().eq("id", id);
  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function setInvoiceStatus(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const supabase = await createClient();
  await supabase.from("invoices").update({ status }).eq("id", id);
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

function mapDbError(msg: string | undefined): string {
  if (msg && /duplicate key|unique/i.test(msg)) {
    return "That invoice number is already in use. Choose another number.";
  }
  return msg ?? "Could not save. Please try again.";
}
