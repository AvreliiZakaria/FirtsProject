"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutDashboard, Image, Tag } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard },
  { href: "/admin/trends", label: "Тренды", icon: Image },
  { href: "/admin/categories", label: "Категории", icon: Tag },
];

/**
 * Shared chrome for the admin area: sticky top bar + horizontal nav.
 * Pages render their content inside <main>. Gating (redirect when not admin)
 * happens in each server component before this shell mounts.
 */
export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-base-line/70 bg-base/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-content items-center gap-2 px-4 py-3 md:px-8 lg:px-12">
          <Link
            href="/"
            aria-label="На сайт"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-base-raised hover:text-ink"
          >
            <ArrowLeft size={18} strokeWidth={1.8} />
          </Link>
          <p className="flex-1 text-[15px] font-semibold tracking-tight text-ink">
            {title}
          </p>
          <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-base">
            Admin
          </span>
        </div>
        <nav className="mx-auto flex w-full max-w-content gap-1 px-4 pb-2 md:px-8 lg:px-12">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                  active
                    ? "bg-ink text-base"
                    : "text-ink-muted hover:bg-base-raised hover:text-ink"
                }`}
              >
                <Icon size={14} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 animate-fade-in px-4 pb-12 pt-5 md:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-content">{children}</div>
      </main>
    </>
  );
}
