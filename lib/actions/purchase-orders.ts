"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";
import { purchaseOrderSchema } from "@/lib/validation/documents";
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

export async function savePurchaseOrder(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "").trim();

  const parsed = purchaseOrderSchema.safeParse({
    po_no: formData.get("po_no"),
    po_date: formData.get("po_date"),
    supplier_id: formData.get("supplier_id"),
    supplier_name: formData.get("supplier_name"),
    supplier_address: formData.get("supplier_address"),
    deliver_to: formData.get("deliver_to"),
    vehicle_ref: formData.get("vehicle_ref"),
    vat_rate: formData.get("vat_rate"),
    expected_date: formData.get("expected_date"),
    status: formData.get("status") || "draft",
    notes: formData.get("notes"),
    items: parseItems(formData.get("items")),
  });
  if (!parsed.success) {
    const fe = parsed.error.flatten();
    return { fieldErrors: fe.fieldErrors as Record<string, string[]>, error: fe.formErrors[0] };
  }

  const data = parsed.data;
  const subtotal = round2(data.items.reduce((s, it) => s + it.amount, 0));
  const vat_total = round2((subtotal * data.vat_rate) / 100);
  const total = round2(subtotal + vat_total);
  const amount_in_words = amountToWords(total);

  const parent = {
    po_no: data.po_no,
    po_date: data.po_date,
    supplier_id: data.supplier_id,
    supplier_name: data.supplier_name,
    supplier_address: data.supplier_address,
    deliver_to: data.deliver_to,
    vehicle_ref: data.vehicle_ref,
    vat_rate: data.vat_rate,
    subtotal,
    vat_total,
    total,
    amount_in_words,
    expected_date: data.expected_date,
    status: data.status,
    notes: data.notes,
  };

  const supabase = await createClient();
  let poId = id;

  if (id) {
    const { error } = await supabase.from("purchase_orders").update(parent).eq("id", id);
    if (error) return { error: mapDbError(error.message) };
    await supabase.from("purchase_order_items").delete().eq("purchase_order_id", id);
  } else {
    const { data: created, error } = await supabase
      .from("purchase_orders")
      .insert({ ...parent, created_by: user.id })
      .select("id")
      .single();
    if (error || !created) return { error: mapDbError(error?.message) };
    poId = created.id;
  }

  const items = data.items.map((it, i) => ({
    purchase_order_id: poId,
    sort_order: i,
    description: it.description,
    qty: it.qty,
    unit: it.unit,
    unit_price: it.unit_price,
    amount: it.amount,
  }));
  const { error: itemsError } = await supabase.from("purchase_order_items").insert(items);
  if (itemsError) return { error: itemsError.message };

  await bumpDocumentCounter("purchase_order", data.po_no);

  revalidatePath("/purchase-orders");
  revalidatePath(`/purchase-orders/${poId}`);
  redirect(`/purchase-orders/${poId}`);
}

export async function deletePurchaseOrder(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("purchase_orders").delete().eq("id", id);
  revalidatePath("/purchase-orders");
  redirect("/purchase-orders");
}

export async function setPurchaseOrderStatus(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const supabase = await createClient();
  await supabase.from("purchase_orders").update({ status }).eq("id", id);
  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath("/purchase-orders");
}

function mapDbError(msg: string | undefined): string {
  if (msg && /duplicate key|unique/i.test(msg)) {
    return "That PO number is already in use. Choose another number.";
  }
  return msg ?? "Could not save. Please try again.";
}
