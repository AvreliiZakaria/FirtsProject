import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTrendBySlug, getTrends } from "@/lib/trends";
import { TrendClient } from "./trend-client";

/**
 * ISR: pages are cached and revalidated every 60s, so trends added via the
 * admin panel appear on their own URL without a full rebuild.
 */
export const revalidate = 60;

/** Pre-render pages for currently-known trends; others render on demand. */
export async function generateStaticParams() {
  const trends = await getTrends();
  return trends.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const trend = await getTrendBySlug(params.slug);
  if (!trend) return { title: "Тренд — Studio" };
  return {
    title: `${trend.name} — Studio`,
    description: trend.subtitle,
  };
}

export default async function TrendPage({
  params,
}: {
  params: { slug: string };
}) {
  const trend = await getTrendBySlug(params.slug);
  if (!trend) notFound();
  return <TrendClient trend={trend} />;
}
