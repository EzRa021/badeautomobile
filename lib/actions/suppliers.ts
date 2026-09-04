"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validation/contacts";
import type { ActionState } from "@/lib/validation/shared";

export async function saveSupplier(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "").trim();

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    tin: formData.get("tin"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  let error;
  if (id) {
    ({ error } = await supabase.from("suppliers").update(parsed.data).eq("id", id));
  } else {
    ({ error } = await supabase
      .from("suppliers")
      .insert({ ...parsed.data, created_by: user.id }));
  }
  if (error) return { error: error.message };

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function deleteSupplier(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("suppliers").delete().eq("id", id);
  revalidatePath("/suppliers");
  redirect("/suppliers");
}
