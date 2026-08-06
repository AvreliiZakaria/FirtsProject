import { createClient } from "@supabase/supabase-js";

/**
 * Plain Supabase client for PUBLIC, read-only catalogue access.
 *
 * Why a separate client (instead of the cookie-based server client)?
 *   - The server client calls `cookies()` to read the auth session. But
 *     `generateStaticParams` and ISR render OUTSIDE a request scope, where
 *     `cookies()` throws. The public catalogue doesn't need a session at all
 *     (RLS lets anyone SELECT published trends + categories), so this cookieless
 *     client is the right tool for those paths.
 *   - It uses the public anon key; RLS still applies, so it can't see
 *     unpublished trends or write anything.
 *
 * Use this for: getTrends(), getCategories(), getTrendBySlug() (the public
 * catalogue). Use the cookie client (lib/supabase/server) only when you need
 * the requesting user's session.
 */
let cached: ReturnType<typeof createClient> | null = null;

export function createPublicClient() {
  if (cached) return cached;
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  return cached;
}
