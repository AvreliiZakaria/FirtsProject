import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { getUserProfile, getUserGenerations, getUserTransactions } from "@/lib/db";
import { ProfileClient } from "./profile-client";
export const dynamic="force-dynamic";
export default async function ProfilePage(){const user=await getServerUser();if(!user)redirect("/login");const [profile,generations,transactions]=await Promise.all([getUserProfile(),getUserGenerations(60),getUserTransactions(60)]);return <ProfileClient email={profile?.email??user.email??""} balance={profile?.coins_balance??0} totalGenerated={profile?.total_generated??0} generations={generations} transactions={transactions}/>;}
