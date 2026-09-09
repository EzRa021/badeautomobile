"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";
import { quotationSchema } from "@/lib/validation/documents";
import { bumpDocumentCounter } from "@/lib/db/numbering";
import { resolveVehicle } from "@/lib/db/vehicles";
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

export async function saveQuotation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "").trim();

  const parsed = quotationSchema.safeParse({
    ref_no: formData.get("ref_no"),
    quote_date: formData.get("quote_date"),
    customer_id: formData.get("customer_id"),
    customer_name: formData.get("customer_name"),
    customer_address: formData.get("customer_address"),
    vehicle_id: formData.get("vehicle_id"),
    vehicle_label: formData.get("vehicle_label"),
    vehicle_reg_no: formData.get("vehicle_reg_no"),
    job_title: formData.get("job_title"),
    status: formData.get("status") || "draft",
    notes: formData.get("notes"),
    fairmarkit: formData.get("fairmarkit"),
    items: parseItems(formData.get("items")),
  });
  if (!parsed.success) {
    const fe = parsed.error.flatten();
    return {
      fieldErrors: fe.fieldErrors as Record<string, string[]>,
      error: fe.formErrors[0],
    };
  }

  const data = parsed.data;

  // Register the vehicle (or link the existing one) so it gains a history.
  const vehicle = await resolveVehicle(
    {
      id: data.vehicle_id,
      label: data.vehicle_label,
      reg_no: data.vehicle_reg_no,
      customer_id: data.customer_id,
    },
    user.id,
  );

  const subtotal = round2(data.items.reduce((s, it) => s + it.amount, 0));
  const total = subtotal;
  const amount_in_words = amountToWords(total, { uppercase: true });

  const parent = {
    ref_no: data.ref_no,
    quote_date: data.quote_date,
    customer_id: data.customer_id,
    customer_name: data.customer_name,
    customer_address: data.customer_address,
    vehicle_id: vehicle.id,
    vehicle_label: vehicle.label,
    job_title: data.job_title,
    subtotal,
    total,
    amount_in_words,
    status: data.status,
    notes: data.notes,
    fairmarkit: data.fairmarkit,
  };

  const supabase = await createClient();
  let quotationId = id;

  if (id) {
    const { error } = await supabase.from("quotations").update(parent).eq("id", id);
    if (error) return { error: mapDbError(error.message, "ref_no") };
    await supabase.from("quotation_items").delete().eq("quotation_id", id);
  } else {
    const { data: created, error } = await supabase
      .from("quotations")
      .insert({ ...parent, created_by: user.id })
      .select("id")
      .single();
    if (error || !created) return { error: mapDbError(error?.message, "ref_no") };
    quotationId = created.id;
  }

  const items = data.items.map((it, i) => ({
    quotation_id: quotationId,
    sort_order: i,
    description: it.description,
    qty: it.qty,
    unit: it.unit,
    rate: it.rate,
    amount: it.amount,
  }));
  const { error: itemsError } = await supabase.from("quotation_items").insert(items);
  if (itemsError) return { error: itemsError.message };

  await bumpDocumentCounter("quotation", data.ref_no);

  revalidatePath("/quotations");
  revalidatePath(`/quotations/${quotationId}`);
  redirect(`/quotations/${quotationId}`);
}

export async function deleteQuotation(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("quotations").delete().eq("id", id);
  revalidatePath("/quotations");
  redirect("/quotations");
}

export async function setQuotationStatus(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const supabase = await createClient();
  await supabase.from("quotations").update({ status }).eq("id", id);
  revalidatePath(`/quotations/${id}`);
  revalidatePath("/quotations");
}

function mapDbError(msg: string | undefined, uniqueField: string): string {
  if (msg && /duplicate key|unique/i.test(msg)) {
    return `That ${uniqueField.replace("_", " ")} is already in use. Choose another number.`;
  }
  return msg ?? "Could not save. Please try again.";
}
