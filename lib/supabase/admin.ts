import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client.
 *
 * Bypasses Row-Level Security. Used ONLY server-side by admin API routes and
 * statistics queries that must read/write data across all users (e.g. totals).
 * NEVER import this into a Client Component or prefix its env var with
 * NEXT_PUBLIC_ — the service role key grants full DB access.
 *
 * Guard every usage with `requireAdmin()` so a logged-out user can never reach
 * a call that uses this client.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY — server not configured.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
