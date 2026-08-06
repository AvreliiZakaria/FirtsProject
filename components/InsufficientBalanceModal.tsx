"use client";

import Link from "next/link";
import { Coins, X } from "lucide-react";

/**
 * "Not enough coins" modal. Shown when a logged-in user's balance is below the
 * trend price. Routes them to the shop to top up.
 */
export function InsufficientBalanceModal({
  open,
  onClose,
  balance,
  price,
}: {
  open: boolean;
  onClose: () => void;
  balance: number | null;
  price: number;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-modal animate-fade-in rounded-t-3xl border border-base-line bg-base-raised p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-base-hover text-ink">
            <Coins size={20} strokeWidth={1.8} />
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-base-hover hover:text-ink"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <h2 className="text-[20px] font-bold tracking-tight text-ink">
          Недостаточно монет
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
          Для генерации нужно {price} 🪙, у вас {balance ?? 0} 🪙. Купите пакет,
          чтобы продолжить.
        </p>

        <Link
          href="/shop"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 text-[16px] font-semibold text-base transition hover:bg-white active:scale-[0.99]"
        >
          <Coins size={18} strokeWidth={1.8} />
          Купить пакет монет
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-2xl py-3 text-[14px] text-ink-muted transition hover:text-ink"
        >
          Позже
        </button>
      </div>
    </div>
  );
}
