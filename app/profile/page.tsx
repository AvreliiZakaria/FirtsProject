import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { getUserProfile, getUserGenerations } from "@/lib/db";
import { ProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

/**
 * User profile ("Мой кабинет") — auth-gated.
 *
 * Loads the profile (balance, email, total generated) + generation history,
 * then hands them to the client component which owns logout / delete actions.
 */
export default async function ProfilePage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const [profile, generations] = await Promise.all([
    getUserProfile(),
    getUserGenerations(60),
  ]);

  return (
    <ProfileClient
      email={profile?.email ?? user.email ?? ""}
      balance={profile?.coins_balance ?? 0}
      totalGenerated={profile?.total_generated ?? 0}
      generations={generations}
    />
  );
}
