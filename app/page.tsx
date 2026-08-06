import { Header } from "@/components/Header";
import { HomeClient } from "@/app/home-client";
import { getTrends, getCategories } from "@/lib/trends";

// Revalidate every 60s so newly added admin trends appear without a rebuild.
export const revalidate = 60;

/**
 * Home page — server component.
 *
 * Pulls published trends + categories from the database and passes them down
 * to the client component, which owns the category-filter state.
 */
export default async function HomePage() {
  const [trends, categories] = await Promise.all([getTrends(), getCategories()]);

  return (
    <>
      <Header />
      <HomeClient trends={trends} categories={categories} />
    </>
  );
}
