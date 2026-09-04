"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { staffUserSchema } from "@/lib/validation/user";
import type { ActionState } from "@/lib/validation/shared";

const NO_ADMIN =
  "Staff management is unavailable: add SUPABASE_SERVICE_ROLE_KEY to .env.local, then restart the app.";

export async function createStaffUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const parsed = staffUserSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const admin = createAdminClient();
  if (!admin) return { error: NO_ADMIN };

  const { email, password, full_name } = parsed.data;
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // internal tool — skip the email verification step
    user_metadata: full_name ? { full_name } : {},
  });

  if (error) {
    if (/already been registered|already exists|duplicate/i.test(error.message)) {
      return { fieldErrors: { email: ["That email already has an account."] } };
    }
    return { error: error.message };
  }

  revalidatePath("/staff");
  return { ok: true };
}

export async function deleteStaffUser(formData: FormData) {
  const currentUser = await requireUser();
  const id = String(formData.get("id") ?? "");

  if (id === currentUser.id) {
    // Don't let someone remove their own access.
    return;
  }

  const admin = createAdminClient();
  if (!admin) return;

  await admin.auth.admin.deleteUser(id);
  revalidatePath("/staff");
}
