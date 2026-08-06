"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Coins,
  Download,
  ImageOff,
  LogOut,
  Plus,
  Sparkles,
  Trash2,
  Wallet,
  Zap,
} from "lucide-react";
import type { Generation } from "@/lib/db";

/**
 * "Мой кабинет" — the user's account page.
 *
 * No avatar: per the spec, the heading reads "Мой кабинет". Shows the current
 * balance + top-up CTA, quick stats, the sign-out button, and the generation
 * history grid with download/delete per item.
 */
export function ProfileClient({
  email,
  balance,
  totalGenerated,
  generations,
}: {
  email: string;
  balance: number;
  totalGenerated: number;
  generations: Generation[];
}) {
  const [busy, setBusy] = useState<number | "logout" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState(generations);

  async function logout() {
    setBusy("logout");
    try {
      await fetch("/api/logout", { method: "POST" });
      // Hard reload: a client-side router.replace would leave the header
      // showing the old balance until the user reloads manually, because the
      // BalanceContext isn't aware the session was just destroyed.
      window.location.href = "/";
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: number) {
    if (!confirm("Удалить это фото из истории?")) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/generations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Не удалось удалить.");
        return;
      }
      setItems((l) => l.filter((g) => g.id !== id));
    } catch {
      setError("Сетевая ошибка.");
    } finally {
      setBusy(null);
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
        <p className="flex-1 text-[15px] font-semibold tracking-tight text-ink">
          Мой кабинет
        </p>
        </div>
      </header>

      <main className="flex-1 animate-fade-in px-4 pb-12 pt-6 md:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-content">
        {/* Balance card */}
        <div className="rounded-3xl border border-base-line bg-base-raised p-5">
          <div className="flex items-center gap-2 text-ink-faint">
            <Coins size={16} strokeWidth={2} />
            <span className="text-[12px] uppercase tracking-[0.18em]">Баланс</span>
          </div>
          <p className="mt-2 text-[36px] font-bold leading-none text-ink">
            {balance} <span className="text-[18px] font-semibold text-ink-muted">монет</span>
          </p>
          <Link
            href="/shop"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-base transition hover:bg-white active:scale-[0.99]"
          >
            <Plus size={17} strokeWidth={2} />
            Пополнить
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat icon={<Zap size={17} />} label="Сгенерировано" value={totalGenerated} />
          <Stat icon={<Sparkles size={17} />} label="В истории" value={items.length} />
        </div>

        {/* Account row */}
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-base-line bg-base-raised px-4 py-3.5">
          <Wallet size={16} className="text-ink-faint" />
          <span className="flex-1 truncate text-[13px] text-ink-muted">{email}</span>
        </div>

        {/* History */}
        <div className="mb-3 mt-7 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold tracking-tight text-ink">
            История генераций
          </h2>
          <span className="text-[12px] text-ink-faint">{items.length}</span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-line px-6 py-12 text-center">
            <ImageOff size={22} className="mx-auto text-ink-faint" strokeWidth={1.6} />
            <p className="mt-3 text-[13px] text-ink-muted">
              Здесь появятся ваши сгенерированные фото.
            </p>
            <Link
              href="/"
              className="mt-3 inline-block text-[13px] font-medium text-ink underline-offset-4 hover:underline"
            >
              Создать первую съёмку
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {items.map((g) => (
              <div
                key={g.id}
                className="group relative overflow-hidden rounded-2xl border border-base-line bg-base-raised"
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.image}
                    alt={g.trend_name ?? "Генерация"}
                    className="block w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

                  {/* Trend name */}
                  {g.trend_name && (
                    <span className="absolute inset-x-2 bottom-2 translate-y-1 text-[11px] font-medium text-ink opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                      {g.trend_name}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
                    <a
                      href={g.image}
                      download={`${(g.trend_name ?? "lumo").toLowerCase().replace(/\s+/g, "-")}.jpg`}
                      aria-label="Скачать"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-ink backdrop-blur transition hover:bg-black/85"
                    >
                      <Download size={14} strokeWidth={2} />
                    </a>
                    <button
                      type="button"
                      onClick={() => remove(g.id)}
                      disabled={busy === g.id}
                      aria-label="Удалить"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-ink backdrop-blur transition hover:bg-red-500/80 disabled:opacity-50"
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-center text-[13px] text-red-400">{error}</p>}

        {/* Sign out */}
        <button
          type="button"
          onClick={logout}
          disabled={busy === "logout"}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-base-line bg-base-raised py-3.5 text-[14px] font-medium text-ink-muted transition hover:text-red-400 active:scale-[0.99]"
        >
          <LogOut size={16} strokeWidth={1.8} />
          {busy === "logout" ? "Выходим…" : "Выйти из аккаунта"}
        </button>
        </div>
      </main>
    </>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-base-line bg-base-raised p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-base-hover text-ink">
        {icon}
      </span>
      <p className="mt-3 text-[22px] font-bold leading-none text-ink">{value}</p>
      <p className="mt-1 text-[12px] text-ink-faint">{label}</p>
    </div>
  );
}
