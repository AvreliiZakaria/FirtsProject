"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Trend, CategoryOption } from "@/lib/trends";

/**
 * Client portion of the home page. Receives trends + categories from the
 * server component and owns the category-filter state.
 *
 * Filtering: "all" shows everything; any other slug shows trends whose
 * categorySlug matches OR whose categorySlug is "any" (the "any" trends are
 * relevant to every audience).
 */
export function HomeClient({
  trends,
  categories,
}: {
  trends: Trend[];
  categories: CategoryOption[];
}) {
  const [active, setActive] = useState<string>("all");

  const visible = useMemo(() => {
    if (active === "all") return trends;
    return trends.filter(
      (t) => t.categorySlug === active || t.categorySlug === "any"
    );
  }, [active, trends]);

  return (
    <main className="flex-1 animate-fade-in px-4 pb-10 pt-6 md:px-8 md:pt-10 lg:px-12">
      <div className="mx-auto w-full max-w-content">
        {/* Greeting / hero copy */}
        <section className="mb-7 md:mb-10">
          <p className="eyebrow">AI фотосессии</p>
          <h1 className="mt-3 text-[28px] font-bold leading-[1.1] tracking-tight text-ink md:text-[40px] md:leading-[1.05]">
            Стань звездой.
            <br />
            <span className="text-ink-muted">Фото, которым хочется делиться.</span>
          </h1>
          <p className="mt-3 max-w-[42ch] text-[14px] leading-relaxed text-ink-muted md:mt-4 md:text-[15px]">
            Загрузи селфи, выбери тренд — получи студийный снимок в любой точке
            мира за минуту.
          </p>
        </section>

        {/* Categories — scroll rail on mobile, wrapping pills on desktop */}
        <section className="mb-8">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
            {categories.map((c) => {
              const isActive = active === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setActive(c.slug)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition active:scale-[0.97] ${
                    isActive
                      ? "border-ink bg-ink text-base"
                      : "border-base-line bg-base-raised text-ink-muted hover:text-ink"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </section>

      {/* Trend grid */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold tracking-tight text-ink">
            Тренды
          </h2>
          <span className="text-[12px] text-ink-faint">{visible.length} стиля</span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {visible.map((t, i) => (
            <Link
              key={t.slug}
              href={`/trend/${t.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-base-line bg-base-raised shadow-soft transition hover:border-ink-faint/50 active:scale-[0.98] animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Preview — full image, natural aspect (no crop) */}
              <div className="relative overflow-hidden bg-base-hover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.image}
                  alt={t.name}
                  className="block w-full transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                {/* Price tag */}
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-ink backdrop-blur">
                  {t.price} 🪙
                </span>
                {/* Caption */}
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-[14px] font-semibold leading-tight text-ink">
                    {t.name}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-muted">
                    {t.subtitle}
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-[12px] font-medium text-ink">Попробовать</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-base-hover text-ink-muted transition group-hover:bg-ink group-hover:text-base">
                  <ArrowRight size={13} strokeWidth={2.2} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state when a filter yields nothing */}
        {visible.length === 0 && (
          <div className="mt-2 rounded-2xl border border-dashed border-base-line px-6 py-10 text-center">
            <Sparkles size={20} className="mx-auto text-ink-faint" strokeWidth={1.6} />
            <p className="mt-3 text-[13px] text-ink-muted">
              В этой категории пока нет трендов.
            </p>
          </div>
        )}
      </section>
      </div>
    </main>
  );
}
