"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";
import { vehicleSchema } from "@/lib/validation/contacts";
import type { ActionState } from "@/lib/validation/shared";

export async function saveVehicle(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "").trim();

  const parsed = vehicleSchema.safeParse({
    description: formData.get("description"),
    reg_no: formData.get("reg_no"),
    make: formData.get("make"),
    model: formData.get("model"),
    customer_id: formData.get("customer_id"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  let error;
  if (id) {
    ({ error } = await supabase.from("vehicles").update(parsed.data).eq("id", id));
  } else {
    ({ error } = await supabase
      .from("vehicles")
      .insert({ ...parsed.data, created_by: user.id }));
  }
  if (error) return { error: error.message };

  revalidatePath("/vehicles");
  redirect("/vehicles");
}

export async function deleteVehicle(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("vehicles").delete().eq("id", id);
  revalidatePath("/vehicles");
  redirect("/vehicles");
}
