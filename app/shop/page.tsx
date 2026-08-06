import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/db";
import { PACKAGES } from "@/lib/packages";
import { Shop } from "./shop";

/**
 * Shop page — auth-gated.
 *
 * Server component: redirect logged-out users to login. Otherwise render the
 * client shop with the current balance so the header chip can update live.
 */
export default async function ShopPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile();
  const balance = profile?.coins_balance ?? 0;

  return <Shop packages={PACKAGES} balance={balance} />;
}
