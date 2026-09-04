import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the SERVICE ROLE key. Bypasses RLS and can
 * manage auth users. NEVER import this into a Client Component — the key must
 * stay on the server. Returns null when the key is not configured.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
