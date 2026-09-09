"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";
import { jobDeliverySchema } from "@/lib/validation/documents";
import { bumpDocumentCounter } from "@/lib/db/numbering";
import { resolveVehicle } from "@/lib/db/vehicles";
import type { ActionState } from "@/lib/validation/shared";

export async function saveJobDelivery(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "").trim();

  const parsed = jobDeliverySchema.safeParse({
    jd_no: formData.get("jd_no"),
    delivery_date: formData.get("delivery_date"),
    grn_no: formData.get("grn_no"),
    po_no: formData.get("po_no"),
    customer_id: formData.get("customer_id"),
    customer_name: formData.get("customer_name"),
    customer_address: formData.get("customer_address"),
    vehicle_id: formData.get("vehicle_id"),
    work_done: formData.get("work_done"),
    vehicle: formData.get("vehicle"),
    vehicle_reg_no: formData.get("vehicle_reg_no"),
    items_changed: formData.get("items_changed"),
    note: formData.get("note"),
    next_service: formData.get("next_service"),
    accessories_found: formData.get("accessories_found"),
    accessories_returned: formData.get("accessories_returned"),
    date_in: formData.get("date_in"),
    date_out: formData.get("date_out"),
    driver_name: formData.get("driver_name"),
    coordinator_sign: formData.get("coordinator_sign"),
    inspector_sign: formData.get("inspector_sign"),
    status: formData.get("status") || "draft",
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    const fe = parsed.error.flatten();
    return { fieldErrors: fe.fieldErrors as Record<string, string[]>, error: fe.formErrors[0] };
  }

  // `vehicle_reg_no` feeds the registry lookup; it is not a column on this table.
  const { vehicle_reg_no, ...data } = parsed.data;

  // Register the vehicle (or link the existing one) so it gains a history.
  const vehicle = await resolveVehicle(
    {
      id: data.vehicle_id,
      label: data.vehicle,
      reg_no: vehicle_reg_no,
      customer_id: data.customer_id,
    },
    user.id,
  );

  const parent = {
    ...data,
    vehicle_id: vehicle.id,
    vehicle: vehicle.label ?? data.vehicle,
  };

  const supabase = await createClient();
  let jdId = id;

  if (id) {
    const { error } = await supabase.from("job_deliveries").update(parent).eq("id", id);
    if (error) return { error: mapDbError(error.message) };
  } else {
    const { data: created, error } = await supabase
      .from("job_deliveries")
      .insert({ ...parent, created_by: user.id })
      .select("id")
      .single();
    if (error || !created) return { error: mapDbError(error?.message) };
    jdId = created.id;
  }

  await bumpDocumentCounter("job_delivery", data.jd_no);

  revalidatePath("/job-deliveries");
  revalidatePath(`/job-deliveries/${jdId}`);
  redirect(`/job-deliveries/${jdId}`);
}

export async function deleteJobDelivery(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("job_deliveries").delete().eq("id", id);
  revalidatePath("/job-deliveries");
  redirect("/job-deliveries");
}

export async function setJobDeliveryStatus(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const supabase = await createClient();
  await supabase.from("job_deliveries").update({ status }).eq("id", id);
  revalidatePath(`/job-deliveries/${id}`);
  revalidatePath("/job-deliveries");
}

function mapDbError(msg: string | undefined): string {
  if (msg && /duplicate key|unique/i.test(msg)) {
    return "That document number is already in use. Choose another number.";
  }
  return msg ?? "Could not save. Please try again.";
}
