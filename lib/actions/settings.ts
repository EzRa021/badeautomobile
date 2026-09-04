"use server";

import { revalidatePath } from "next/cache";
import { createClient, requireUser } from "@/lib/supabase/server";
import { settingsSchema } from "@/lib/validation/documents";
import type { ActionState } from "@/lib/validation/shared";

export async function saveSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const id = String(formData.get("id") ?? "").trim();

  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    tin: formData.get("tin"),
    vat_rate: formData.get("vat_rate"),
    bank_details: formData.get("bank_details"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const supabase = await createClient();
  let error;
  if (id) {
    ({ error } = await supabase.from("company_settings").update(parsed.data).eq("id", id));
  } else {
    ({ error } = await supabase.from("company_settings").insert(parsed.data));
  }
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}
