import { createAdminClient } from "@/lib/supabase/admin";

export interface StaffUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

/** List auth users via the admin API. `configured` is false when the service key is missing. */
export async function listStaffUsers(): Promise<{ configured: boolean; users: StaffUser[] }> {
  const admin = createAdminClient();
  if (!admin) return { configured: false, users: [] };

  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const users: StaffUser[] = (data?.users ?? [])
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      full_name: (u.user_metadata?.full_name as string | undefined) ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return { configured: true, users };
}
