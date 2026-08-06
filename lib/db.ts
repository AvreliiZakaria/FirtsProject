import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface UserProfile {
  id: string;
  email: string | null;
  username: string | null;
  coins_balance: number;
  total_generated: number;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, email, username, coins_balance, total_generated")
    .eq("id", user.id)
    .single();

  return (data as UserProfile | null) ?? null;
}

/** Atomic deduction through the SECURITY DEFINER database function. */
export async function spendCoins(amount: number, ref: string): Promise<number | null> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !Number.isInteger(amount) || amount <= 0) return null;

  const { data, error } = await supabase.rpc("spend_coins", {
    p_amount: amount,
    p_ref: ref,
  });
  if (error || data !== 1) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("coins_balance")
    .eq("id", user.id)
    .single();
  return profile?.coins_balance ?? null;
}

/** Atomic purchase/refund through the SECURITY DEFINER database function. */
export async function addCoins(
  amount: number,
  reason: "purchase" | "refund",
  ref?: string
): Promise<number | null> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !Number.isInteger(amount) || amount <= 0) return null;

  const { data, error } = await supabase.rpc("add_coins", {
    p_amount: amount,
    p_reason: reason,
    p_ref: ref ?? null,
  });
  if (error || typeof data !== "number") return null;
  return data;
}

export interface Generation {
  id: number;
  image: string;
  trend_slug: string | null;
  trend_name: string | null;
  created_at: string;
}

export async function getUserGenerations(limit = 60): Promise<Generation[]> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("generations")
    .select("id, image, trend_slug, trend_name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Generation[] | null) ?? [];
}

export async function deleteGeneration(id: number): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("generations").delete().eq("id", id);
  return !error;
}
