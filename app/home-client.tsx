"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import type { Trend, CategoryOption } from "@/lib/trends";

export function HomeClient({ trends, categories }: { trends: Trend[]; categories: CategoryOption[] }) {
  const [active, setActive] = useState("all");
  const visible = useMemo(() => active === "all" ? trends : trends.filter((t) => t.categorySlug === active || t.categorySlug === "any"), [active, trends]);

  return (
    <main className="flex-1 animate-fade-in px-4 pb-12 pt-6 md:px-8 md:pt-9 lg:px-12">
      <div className="mx-auto w-full max-w-content">
        <section className="mb-7 flex flex-col justify-between gap-6 border-b border-base-line pb-7 md:mb-9 md:flex-row md:items-end md:gap-10 md:pb-9">
          <div className="max-w-[620px]">
            <p className="eyebrow">AI фотосессии</p>
            <h1 className="mt-3 max-w-[650px] text-[clamp(2rem,4vw,3.65rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-ink">Фото как после съёмки.</h1>
            <p className="mt-3 max-w-[48ch] text-[14px] leading-6 text-ink-muted md:text-[15px]">Выбери образ, загрузи селфи и получи готовый портрет за минуту.</p>
          </div>
          <a href="#trends" className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-ink px-5 py-3 text-[13px] font-semibold text-base transition hover:bg-ink-muted active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/70 md:self-auto">Выбрать образ<ArrowDown size={15} strokeWidth={2.4} className="transition group-hover:translate-y-0.5" /></a>
        </section>

        <section className="mb-7" aria-label="Категории трендов">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
            {categories.map((c) => {
              const isActive = active === c.slug;
              return <button key={c.slug} type="button" onClick={() => setActive(c.slug)} className={`min-h-10 shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 ${isActive ? "border-ink bg-ink text-base" : "border-base-line bg-base-raised text-ink-muted hover:border-ink-faint/50 hover:text-ink"}`}>{c.label}</button>;
            })}
          </div>
        </section>

        <section id="trends" className="scroll-mt-24">
          <div className="mb-4 flex items-end justify-between"><div><p className="eyebrow">Начни здесь</p><h2 className="mt-1.5 text-[20px] font-semibold tracking-tight text-ink">Выбери свой образ</h2></div><span className="text-[12px] tabular-nums text-ink-faint">{visible.length} стилей</span></div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {visible.map((t, i) => <Link key={t.slug} href={`/trend/${t.slug}`} className="group surface-line relative flex flex-col overflow-hidden rounded-2xl border border-base-line bg-base-raised transition duration-300 hover:-translate-y-1 hover:border-ink-faint/60 active:scale-[0.98] animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="relative overflow-hidden bg-base-hover"><img src={t.image} alt={t.name} className="block aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-[1.04]" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" /><span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-ink backdrop-blur">{t.price} 🪙</span><div className="absolute inset-x-0 bottom-0 p-3"><p className="text-[14px] font-semibold leading-tight text-ink">{t.name}</p><p className="mt-0.5 line-clamp-1 text-[11px] text-ink-muted">{t.subtitle}</p></div></div>
              <div className="flex items-center justify-between px-3 py-3"><span className="text-[12px] font-medium text-ink">Попробовать</span><span className="flex h-7 w-7 items-center justify-center rounded-full bg-base-hover text-ink-muted transition group-hover:bg-ink group-hover:text-base"><ArrowRight size={13} strokeWidth={2.2} /></span></div>
            </Link>)}
          </div>
          {visible.length === 0 && <div className="mt-2 rounded-2xl border border-dashed border-base-line px-6 py-12 text-center"><Sparkles size={20} className="mx-auto text-ink-faint" strokeWidth={1.6} /><p className="mt-3 text-[13px] text-ink-muted">В этой категории пока нет трендов.</p></div>}
        </section>
      </div>
    </main>
  );
}
