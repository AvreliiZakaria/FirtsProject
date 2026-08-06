import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAdminTrends } from "@/lib/trends";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

/**
 * Admin trend catalogue — shows all trends (published or not) with edit/delete.
 * Admin only.
 */
export default async function AdminTrendsPage() {
  if (!(await requireAdmin())) redirect("/");
  const trends = await getAdminTrends();

  return (
    <AdminShell title="Тренды">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] text-ink-faint">Всего: {trends.length}</p>
        <Link
          href="/admin/trends/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-base transition hover:bg-white active:scale-[0.97]"
        >
          <Plus size={15} strokeWidth={2.4} />
          Добавить
        </Link>
      </div>

      {trends.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-line px-6 py-12 text-center">
          <p className="text-[14px] text-ink-muted">Пока нет трендов.</p>
          <Link
            href="/admin/trends/new"
            className="mt-3 inline-block text-[13px] font-medium text-ink underline-offset-4 hover:underline"
          >
            Создать первый
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {trends.map((t) => (
            <Link
              key={t.id}
              href={`/admin/trends/${t.id}/edit`}
              className="group flex items-center gap-3 rounded-2xl border border-base-line bg-base-raised p-3 transition hover:border-ink-faint/50"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-base-hover">
                <Image
                  src={t.image}
                  alt={t.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-ink">
                  {t.name}
                </p>
                <p className="truncate text-[12px] text-ink-faint">
                  {t.categoryLabel ?? "Без категории"} · {t.price} 🪙
                </p>
              </div>
              {!t.isPublished && (
                <span className="rounded-full border border-base-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                  Скрыт
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
