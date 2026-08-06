/**
 * Trend + category data access layer.
 *
 * Previously these were hardcoded arrays; they now read from Supabase so the
 * admin panel can manage the catalogue live. All functions are async.
 *
 * Types are kept compatible with the old shape so consumers (home, trend page,
 * generate route) need minimal changes. `negativePrompt` ↔ `negative_prompt`
 * and `price` are preserved.
 */

import { createPublicClient } from "@/lib/supabase/public";
import { createServiceClient } from "@/lib/supabase/admin";

export interface Category {
  id: number;
  slug: string;
  label: string;
}

/** A category row plus the synthetic "all" entry used by the home filter rail. */
export interface CategoryOption {
  slug: string;
  label: string;
}

export interface Trend {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  categorySlug: string | null;
  image: string;
  price: number;
  prompt: string;
  negativePrompt: string;
}

interface TrendRow {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  image: string;
  price: number;
  prompt: string;
  negative_prompt: string;
  is_published: boolean;
  // PostgREST returns a single OBJECT (not an array) for a many-to-one FK join.
  categories: { slug: string } | null;
}

function mapTrend(row: TrendRow): Trend {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    categorySlug: row.categories?.slug ?? null,
    image: row.image,
    price: row.price,
    prompt: row.prompt,
    negativePrompt: row.negative_prompt,
  };
}

/**
 * Returns all published trends, newest first, with their category slug joined.
 */
export async function getTrends(): Promise<Trend[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("trends")
    .select(
      "id, slug, name, subtitle, image, price, prompt, negative_prompt, is_published, categories(slug)"
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (data as TrendRow[] | null)?.map(mapTrend) ?? [];
}

/**
 * Returns category options for the home filter rail, ordered by sort_order.
 * A leading synthetic "all" entry is prepended (it filters to everything).
 */
export async function getCategories(): Promise<CategoryOption[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("slug, label")
    .order("sort_order", { ascending: true });

  const cats = (data as CategoryOption[] | null) ?? [];
  // Ensure the "all" entry is present and first, even if the DB row is missing.
  const withAll =
    cats.some((c) => c.slug === "all")
      ? cats
      : [{ slug: "all", label: "Все" }, ...cats];
  return withAll;
}

/**
 * Looks up a single trend by slug (published OR not). Used by the trend detail
 * page and the generate route. Returns undefined when not found.
 */
export async function getTrendBySlug(
  slug: string
): Promise<Trend | undefined> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("trends")
    .select(
      "id, slug, name, subtitle, image, price, prompt, negative_prompt, is_published, categories(slug)"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return undefined;
  return mapTrend(data as TrendRow);
}

// --- Admin read helpers (service-role: bypass RLS, include unpublished) -----
// Gate every caller with requireAdmin(); these read data the public can't see.

export interface AdminCategory extends Category {
  sort_order: number;
  trendCount: number;
}

export interface AdminTrend {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  categoryId: number | null;
  categoryLabel: string | null;
  image: string;
  price: number;
  prompt: string;
  negativePrompt: string;
  isPublished: boolean;
}

interface AdminTrendRow {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  image: string;
  price: number;
  prompt: string;
  negative_prompt: string;
  is_published: boolean;
  // PostgREST returns a single OBJECT (not an array) for a many-to-one FK join.
  categories: { id: number; label: string } | null;
}

/** All trends including unpublished, with their category id + label. */
export async function getAdminTrends(): Promise<AdminTrend[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("trends")
    .select(
      "id, slug, name, subtitle, image, price, prompt, negative_prompt, is_published, categories(id, label)"
    )
    .order("created_at", { ascending: false });

  // Cast via unknown: Supabase's generated types infer the FK join shape
  // differently from the runtime (object, not array) — the actual data is
  // correct, this just bypasses the type mismatch.
  return ((data as unknown as AdminTrendRow[] | null) ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    subtitle: r.subtitle,
    categoryId: r.categories?.id ?? null,
    categoryLabel: r.categories?.label ?? null,
    image: r.image,
    price: r.price,
    prompt: r.prompt,
    negativePrompt: r.negative_prompt,
    isPublished: r.is_published,
  }));
}

/** A single trend for the edit form (any publication state). */
export async function getAdminTrendById(
  id: number
): Promise<AdminTrend | undefined> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("trends")
    .select(
      "id, slug, name, subtitle, image, price, prompt, negative_prompt, is_published, categories(id, label)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return undefined;
  const r = data as unknown as AdminTrendRow;
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    subtitle: r.subtitle,
    categoryId: r.categories?.id ?? null,
    categoryLabel: r.categories?.label ?? null,
    image: r.image,
    price: r.price,
    prompt: r.prompt,
    negativePrompt: r.negative_prompt,
    isPublished: r.is_published,
  };
}

/** All categories with sort_order + how many trends reference each. */
export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = createServiceClient();
  const [{ data: cats }, { data: counts }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, label, sort_order")
      .order("sort_order", { ascending: true }),
    supabase.from("trends").select("category_id"),
  ]);

  const countMap = new Map<number, number>();
  for (const t of counts ?? []) {
    if (t.category_id != null) {
      countMap.set(t.category_id, (countMap.get(t.category_id) ?? 0) + 1);
    }
  }

  return ((cats as (Category & { sort_order: number })[] | null) ?? []).map(
    (c) => ({
      id: c.id,
      slug: c.slug,
      label: c.label,
      sort_order: c.sort_order,
      trendCount: countMap.get(c.id) ?? 0,
    })
  );
}
