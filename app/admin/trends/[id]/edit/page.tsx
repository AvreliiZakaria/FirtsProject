import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminTrendById, getAdminCategories } from "@/lib/trends";
import { AdminShell } from "@/components/admin/AdminShell";
import { TrendForm } from "@/components/admin/TrendForm";

export const dynamic = "force-dynamic";

/** Edit trend form — admin only. Loads the trend + categories server-side. */
export default async function EditTrendPage({
  params,
}: {
  params: { id: string };
}) {
  if (!(await requireAdmin())) redirect("/");

  const id = Number(params.id);
  const [trend, categories] = await Promise.all([
    getAdminTrendById(id),
    getAdminCategories(),
  ]);
  if (!trend) notFound();

  return (
    <AdminShell title="Редактировать тренд">
      <TrendForm trend={trend} categories={categories} />
    </AdminShell>
  );
}
