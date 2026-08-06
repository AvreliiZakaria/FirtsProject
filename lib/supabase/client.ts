import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components (browser).
 *
 * Uses the public anon key — safe to ship to the browser. Auth state is
 * persisted in cookies by @supabase/ssr, so the session survives reloads.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
