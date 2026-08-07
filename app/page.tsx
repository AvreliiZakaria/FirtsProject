import { Header } from "@/components/Header";
import { HomeClient } from "@/app/home-client";
import { SiteFooter } from "@/components/SiteFooter";
import { getTrends, getCategories } from "@/lib/trends";
export const revalidate = 60;
export default async function HomePage() {
  const [trends, categories] = await Promise.all([getTrends(), getCategories()]);
  return <><Header /><HomeClient trends={trends} categories={categories} /><SiteFooter /></>;
}
