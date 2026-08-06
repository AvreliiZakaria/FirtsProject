import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Image as ImageIcon, Tag, Users, Zap, Wallet } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

/**
 * Admin dashboard — admin only.
 *
 * Shows high-level stats pulled with the service-role client (aggregates across
 * all users, which RLS would otherwise restrict). Falls back to 0 on any query
 * error so the page never crashes.
 */
export default async function AdminDashboard() {
  const adminEmail = await requireAdmin();
  if (!adminEmail) redirect("/");

  const stats = await loadStats();

  return (
    <AdminShell title="Обзор">
      <p className="mb-5 text-[13px] text-ink-faint">
        Вы вошли как {adminEmail}
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<Users size={18} />}
          label="Пользователи"
          value={stats.users}
        />
        <StatCard
          icon={<Zap size={18} />}
          label="Всего генераций"
          value={stats.totalGenerated}
        />
        <StatCard
          icon={<Wallet size={18} />}
          label="Монет на руках"
          value={stats.coinsInCirculation}
        />
        <StatCard
          icon={<ImageIcon size={18} />}
          label="Опубл. трендов"
          value={stats.publishedTrends}
        />
      </div>

      {/* Quick links */}
      <h2 className="mb-2 mt-7 text-[14px] font-semibold tracking-tight text-ink">
        Управление
      </h2>
      <div className="flex flex-col gap-2">
        <QuickLink
          href="/admin/trends"
          icon={<ImageIcon size={17} />}
          title="Тренды"
          subtitle="Добавляйте и редактируйте фото-тренды"
        />
        <QuickLink
          href="/admin/categories"
          icon={<Tag size={17} />}
          title="Категории"
          subtitle="Создавайте категории для фильтра"
        />
      </div>
    </AdminShell>
  );
}

function StatCard({
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
      <p className="mt-3 text-[26px] font-bold leading-none text-ink">
        {value.toLocaleString("ru-RU")}
      </p>
      <p className="mt-1 text-[12px] text-ink-faint">{label}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-base-line bg-base-raised p-4 transition hover:border-ink-faint/50"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-base-hover text-ink">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        <p className="text-[12px] text-ink-faint">{subtitle}</p>
      </div>
      <ArrowRight
        size={16}
        className="text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-ink"
      />
    </Link>
  );
}

async function loadStats() {
  const supabase = createServiceClient();

  const [users, generations, trends] = await Promise.all([
    supabase.from("users").select("coins_balance, total_generated"),
    supabase.from("transactions").select("delta").eq("reason", "purchase"),
    supabase.from("trends").select("is_published"),
  ]);

  const userList = users.data ?? [];
  const totalGenerated = userList.reduce(
    (s, u) => s + (u.total_generated ?? 0),
    0
  );
  const coinsInCirculation = userList.reduce(
    (s, u) => s + (u.coins_balance ?? 0),
    0
  );

  return {
    users: userList.length,
    totalGenerated,
    coinsInCirculation,
    publishedTrends: (trends.data ?? []).filter((t) => t.is_published).length,
  };
}
