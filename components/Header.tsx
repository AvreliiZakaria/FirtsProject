"use client";

import Link from "next/link";
import { Coins, LogIn, User } from "lucide-react";
import { useBalance } from "@/components/Providers";

/**
 * App header: logo on the left, balance + profile on the right.
 *
 * Responsive: the inner row is capped at max-w-content (1024px) and centered,
 * with padding that grows on desktop so the bar breathes on wide screens.
 */
export function Header() {
  const { balance, loggedIn, loading } = useBalance();

  const right = loggedIn ? (
    <div className="flex items-center gap-2">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 rounded-full border border-base-line bg-base-raised px-3.5 py-2 text-[13px] font-medium text-ink transition hover:bg-base-hover active:scale-[0.97]"
      >
        <Coins size={15} strokeWidth={2} className="text-ink" />
        <span>{balance ?? 0} монет</span>
      </Link>
      <Link
        href="/profile"
        aria-label="Мой кабинет"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-base-line bg-base-raised text-ink transition hover:bg-base-hover active:scale-[0.97]"
      >
        <User size={16} strokeWidth={2} />
      </Link>
    </div>
  ) : (
    <Link
      href="/login"
      className="inline-flex items-center gap-2 rounded-full border border-base-line bg-base-raised px-3.5 py-2 text-[13px] font-medium text-ink-muted transition hover:bg-base-hover hover:text-ink active:scale-[0.97]"
    >
      <LogIn size={15} strokeWidth={2} />
      <span>Войти</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-base-line/70 bg-base/80 px-4 py-4 backdrop-blur-xl md:px-8 md:py-5 lg:px-12">
      <div className="mx-auto flex w-full max-w-content items-center justify-between">
        {/* Brand: L tile + "Lumo" wordmark */}
        <Link href="/" className="flex items-center gap-2.5 active:scale-[0.98]">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-base">
            <span className="text-[15px] font-bold leading-none">L</span>
          </span>
          <p className="text-[16px] font-bold tracking-tight text-ink">Lumo</p>
        </Link>

        {/* Balance / login — show a neutral chip while the profile loads */}
        {loading ? (
          <span className="h-9 w-24 animate-pulse rounded-full bg-base-raised" />
        ) : (
          right
        )}
      </div>
    </header>
  );
}
