"use client";

import Link from "next/link";
import { LogIn, X } from "lucide-react";

/**
 * Modal shown when a logged-out user tries to generate. Prompts them to log in.
 *
 * Controlled by the parent via `open` / `onClose`. Keeps the generation flow
 * gated without kicking the user off the page.
 */
export function AuthGate({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-modal animate-fade-in rounded-t-3xl border border-base-line bg-base-raised p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-base-hover text-ink">
            <LogIn size={20} strokeWidth={1.8} />
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
          Войдите, чтобы продолжить
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
          Генерация доступна только зарегистрированным пользователям. Новым —
          5 монет в подарок.
        </p>

        <Link
          href="/login"
          className="mt-5 flex w-full items-center justify-center rounded-2xl bg-ink py-4 text-[16px] font-semibold text-base transition hover:bg-white active:scale-[0.99]"
        >
          Войти или зарегистрироваться
        </Link>
      </div>
    </div>
  );
}
