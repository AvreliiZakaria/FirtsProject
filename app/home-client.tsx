"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Trend, CategoryOption } from "@/lib/trends";

export function HomeClient({ trends, categories }: { trends: Trend[]; categories: CategoryOption[] }) {
  const [active, setActive] = useState("all");
  const visible = useMemo(() => active === "all" ? trends : trends.filter((t) => t.categorySlug === active || t.categorySlug === "any"), [active, trends]);

  return (
    <main className="flex-1 animate-fade-in px-4 pb-12 pt-8 md:px-8 md:pt-14 lg:px-12">
      <div className="mx-auto w-full max-w-content">
        <section className="mb-10 border-b border-base-line pb-10 md:mb-14 md:pb-14">
          <div className="flex max-w-3xl flex-col gap-5">
            <p className="eyebrow">Lumo / AI фотосессии</p>
            <h1 className="max-w-[780px] text-[clamp(2.3rem,6vw,5.5rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-ink">
              Твоя лучшая версия уже здесь.
            </h1>
            <p className="max-w-[48ch] text-[15px] leading-7 text-ink-muted md:text-[17px]">
              Загрузи несколько селфи, выбери образ и получи снимок, который выглядит как настоящая съёмка.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[12px] text-ink-faint">
              <span className="rounded-full border border-base-line bg-base-raised px-3 py-2">Без студии</span>
              <span className="rounded-full border border-base-line bg-base-raised px-3 py-2">Без фотографа</span>
              <span className="rounded-full border border-base-line bg-base-raised px-3 py-2">От 5 монет</span>
            </div>
          </div>
        </section>

        <section className="mb-9">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
            {categories.map((c) => {
              const isActive = active === c.slug;
              return <button key={c.slug} type="button" onClick={() => setActive(c.slug)} className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 ${isActive ? "border-ink bg-ink text-base" : "border-base-line bg-base-raised text-ink-muted hover:border-ink-faint/50 hover:text-ink"}`}>{c.label}</button>;
            })}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <div><p className="eyebrow">Выбор редакции</p><h2 className="mt-2 text-[22px] font-semibold tracking-tight text-ink">Тренды</h2></div>
            <span className="text-[12px] tabular-nums text-ink-faint">{visible.length} стилей</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {visible.map((t, i) => <Link key={t.slug} href={`/trend/${t.slug}`} className="group surface-line relative flex flex-col overflow-hidden rounded-2xl border border-base-line bg-base-raised transition duration-300 hover:-translate-y-1 hover:border-ink-faint/60 active:scale-[0.98] animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="relative overflow-hidden bg-base-hover"><img src={t.image} alt={t.name} className="block w-full transition duration-700 group-hover:scale-[1.04]" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" /><span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-ink backdrop-blur">{t.price} 🪙</span><div className="absolute inset-x-0 bottom-0 p-3"><p className="text-[14px] font-semibold leading-tight text-ink">{t.name}</p><p className="mt-0.5 line-clamp-1 text-[11px] text-ink-muted">{t.subtitle}</p></div></div>
              <div className="flex items-center justify-between px-3 py-3"><span className="text-[12px] font-medium text-ink">Попробовать</span><span className="flex h-7 w-7 items-center justify-center rounded-full bg-base-hover text-ink-muted transition group-hover:bg-ink group-hover:text-base"><ArrowRight size={13} strokeWidth={2.2} /></span></div>
            </Link>)}
          </div>
          {visible.length === 0 && <div className="mt-2 rounded-2xl border border-dashed border-base-line px-6 py-12 text-center"><Sparkles size={20} className="mx-auto text-ink-faint" strokeWidth={1.6} /><p className="mt-3 text-[13px] text-ink-muted">В этой категории пока нет трендов.</p></div>}
        </section>
      </div>
    </main>
  );
}
