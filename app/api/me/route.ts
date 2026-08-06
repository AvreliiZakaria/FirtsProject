import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // never cache a per-user response

/**
 * Returns the authenticated user's profile (email + coin balance), or a null
 * user when logged out. This is the client's source of truth for the header
 * balance chip and the "logged in?" gate.
 */
export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ user: null, balance: null }, { status: 200 });
  }

  const profile = await getUserProfile();
  if (!profile) {
    // Auth account exists but the profile row is missing — treat as logged in
    // with a zero balance. (Shouldn't happen: the signup trigger creates it.)
    return NextResponse.json(
      { user: { email: user.email }, balance: 0 },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      user: { email: profile.email },
      balance: profile.coins_balance,
      totalGenerated: profile.total_generated,
    },
    { status: 200 }
  );
}
