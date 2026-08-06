"use client";

import Link from "next/link";
import { Coins, LogIn, User } from "lucide-react";
import { useBalance } from "@/components/Providers";

export function Header() {
  const { balance, loggedIn, loading } = useBalance();

  const right = loggedIn ? (
    <div className="flex items-center gap-2">
      <Link
        href="/profile"
        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-base-line bg-base-raised px-3 py-1.5 text-[12px] font-semibold text-ink transition hover:border-ink-faint/60 hover:bg-base-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60"
      >
        <Coins size={14} strokeWidth={2.2} className="text-amber-200" />
        <span>{balance ?? 0} монет</span>
      </Link>
      <Link
        href="/profile"
        aria-label="Мой кабинет"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-base-line bg-base-raised text-ink transition hover:border-ink-faint/60 hover:bg-base-hover active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60"
      >
        <User size={15} strokeWidth={2.1} />
      </Link>
    </div>
  ) : (
    <Link
      href="/login"
      className="inline-flex min-h-9 items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-base transition hover:bg-ink-muted active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-base"
    >
      <LogIn size={14} strokeWidth={2.2} />
      <span>Войти</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-base-line/70 bg-base/90 px-4 py-3 backdrop-blur-xl md:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-content items-center justify-between">
        <Link href="/" aria-label="Lumo, на главную" className="group flex items-center gap-2 active:scale-[0.98]">
          <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px] bg-ink text-base shadow-soft transition group-hover:rotate-[-6deg] group-hover:rounded-[12px]">
            <span className="absolute h-3 w-3 rounded-full bg-base" />
            <span className="absolute h-[18px] w-[5px] rounded-full bg-base" />
            <span className="relative z-10 text-[12px] font-black leading-none tracking-[-0.08em]">L</span>
          </span>
          <div className="leading-none">
            <p className="text-[15px] font-bold tracking-[-0.03em] text-ink">Lumo</p>
            <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.18em] text-ink-faint">AI portraits</p>
          </div>
        </Link>
        {loading ? <span className="h-9 w-24 animate-pulse rounded-full bg-base-raised" /> : right}
      </div>
    </header>
  );
}
