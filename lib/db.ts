import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Server-side database helpers.
 *
 * Thin wrappers around Supabase queries so route handlers stay readable.
 * All functions run with the requesting user's session (RLS-enforced),
 * EXCEPT the service-role client used only for refunds where we must act
 * outside of a request's auth context if needed.
 *
 * Design rule: the client NEVER mutates coins directly. spendCoins() is the
 * single atomic deduction path; addCoins() the single top-up/refund path.
 */

export interface UserProfile {
  id: string;
  email: string | null;
  username: string | null;
  coins_balance: number;
  total_generated: number;
}

/** Loads the authenticated user's profile, or null if not logged in / no row. */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, email, username, coins_balance, total_generated")
    .eq("id", user.id)
    .single();

  return (data as UserProfile | null) ?? null;
}

/**
 * Atomically deducts coins for a generation. Returns the new balance on
 * success, or null if the user can't afford it.
 *
 * Delegates to the `spend_coins()` Postgres function (SECURITY DEFINER) which
 * performs `UPDATE ... WHERE coins_balance >= amount` in one statement —
 * immune to race conditions between concurrent requests.
 */
export async function spendCoins(
  amount: number,
  ref: string
): Promise<number | null> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("spend_coins", {
    p_amount: amount,
    p_ref: ref,
  });

  if (error || data !== 1) return null;

  // Read back the updated balance for the response.
  const { data: profile } = await supabase
    .from("users")
    .select("coins_balance")
    .eq("id", user.id)
    .single();

  return profile?.coins_balance ?? null;
}

/**
 * Credits coins (purchase or refund). Used by the checkout (mock payment) and
 * by the generate route when refunding after an upstream failure.
 *
 * Writes the profile update + transaction row. Runs under the user's RLS.
 */
export async function addCoins(
  amount: number,
  reason: "purchase" | "refund",
  ref?: string
): Promise<number | null> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: updated, error } = await supabase
    .from("users")
    .update({ coins_balance: (await getBalance(user.id)) + amount })
    .eq("id", user.id)
    .select("coins_balance")
    .single();

  if (error || !updated) return null;

  await supabase.from("transactions").insert({
    user_id: user.id,
    delta: amount,
    reason,
    ref: ref ?? null,
  });

  return updated.coins_balance;
}

/** Helper: read current balance for addCoins' increment. */
async function getBalance(userId: string): Promise<number> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("users")
    .select("coins_balance")
    .eq("id", userId)
    .single();
  return data?.coins_balance ?? 0;
}

/** A past generation, for the profile history. */
export interface Generation {
  id: number;
  image: string;
  trend_slug: string | null;
  trend_name: string | null;
  created_at: string;
}

/**
 * Returns the current user's generations, newest first.
 * `limit` caps the query (default 60) to keep the profile page light.
 */
export async function getUserGenerations(
  limit = 60
): Promise<Generation[]> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("generations")
    .select("id, image, trend_slug, trend_name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as Generation[] | null) ?? [];
}

/** Deletes one of the current user's generations (by id). */
export async function deleteGeneration(id: number): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("generations")
    .delete()
    .eq("id", id);
  return !error;
}
