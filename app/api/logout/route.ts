import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Server-side sign-out: clears the session from the Supabase server client,
 * which removes the auth cookies set by @supabase/ssr. Returns JSON so the
 * client can do a hard navigation to / afterwards.
 */
export async function POST() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
