"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Coins, Loader2, Sparkles, Zap } from "lucide-react";
import type { Package } from "@/lib/packages";
import { coinsFor } from "@/lib/packages";
import { useBalance } from "@/components/Providers";

/**
 * Shop UI. Buying hits the mock `/api/checkout` endpoint, which credits coins
 * instantly. On success we update the BalanceContext so the header chip and
 * the trend page reflect the new balance immediately.
 */
export function Shop({
  packages,
  balance,
}: {
  packages: Package[];
  balance: number;
}) {
  const { setBalance } = useBalance();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successGen, setSuccessGen] = useState<number | null>(null);

  async function buy(pkg: Package) {
    setError(null);
    setSuccessGen(null);
    setBusyId(pkg.id);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Не удалось оформить покупку.");
        return;
      }
      setBalance(data.balance);
      setSuccessGen(pkg.generations);
    } catch {
      setError("Сетевая ошибка. Попробуйте ещё раз.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-base-line/70 bg-base/80 px-3 py-3 backdrop-blur-xl md:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-content items-center gap-2">
        <Link
          href="/"
          aria-label="Назад"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-base-raised active:scale-95"
        >
          <ArrowLeft size={20} strokeWidth={1.8} />
        </Link>
        <p className="text-[15px] font-semibold tracking-tight text-ink">Магазин</p>
        </div>
      </header>

      <main className="flex-1 animate-fade-in px-4 pb-12 pt-6 md:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-content">
        {/* Balance + intro */}
        <div className="mb-6 flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-base-line bg-base-raised px-3.5 py-2 text-[13px] font-medium text-ink">
            <Coins size={15} strokeWidth={2} />
            {balance} монет
          </span>
        </div>

        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-ink">
          Пакеты генераций
        </h1>
        <p className="mt-2 max-w-[36ch] text-[14px] leading-relaxed text-ink-muted">
          Каждая генерация — 5 монет. Покупка зачисляется мгновенно.
        </p>

        {/* Success toast */}
        {successGen !== null && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-base-line bg-base-raised px-4 py-3.5 animate-fade-in">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-base">
              <Check size={16} strokeWidth={2.4} />
            </span>
            <p className="text-[14px] text-ink">
              Начислено {successGen} генераций. Приятной съёмки!
            </p>
          </div>
        )}

        {error && <p className="mt-5 text-[13px] text-red-400">{error}</p>}

        {/* Package cards */}
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {packages.map((pkg) => {
            const coins = coinsFor(pkg);
            const busy = busyId === pkg.id;
            return (
              <div
                key={pkg.id}
                className={`relative overflow-hidden rounded-3xl border p-5 transition ${
                  pkg.popular
                    ? "border-ink/30 bg-base-raised shadow-glow"
                    : "border-base-line bg-base-raised"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-base">
                    <Zap size={11} strokeWidth={2.5} /> Хит
                  </span>
                )}

                <div className="flex items-baseline gap-2">
                  <span className="text-[34px] font-bold leading-none text-ink">
                    {pkg.generations}
                  </span>
                  <span className="text-[14px] text-ink-muted">
                    {pkg.generations === 1 ? "генерация" : "генераций"}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-faint">
                  <Coins size={13} strokeWidth={2} />
                  {coins} монет
                </div>

                <div className="mt-4 flex items-end gap-2">
                  <span className="text-[20px] font-bold text-ink">
                    {pkg.price} ₽
                  </span>
                  {pkg.oldPrice && (
                    <span className="text-[14px] text-ink-faint line-through">
                      {pkg.oldPrice} ₽
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => buy(pkg)}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold transition active:scale-[0.99] ${
                    pkg.popular
                      ? "bg-ink text-base hover:bg-white"
                      : "border border-base-line bg-base text-ink hover:bg-base-hover"
                  } disabled:opacity-60`}
                >
                  {busy ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={16} strokeWidth={1.8} />
                      Купить
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[12px] text-ink-faint">
          Демо-режим: оплата не списывается, монеты начисляются сразу.
        </p>
        </div>
      </main>
    </>
  );
}
