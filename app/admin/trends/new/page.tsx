import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminCategories } from "@/lib/trends";
import { AdminShell } from "@/components/admin/AdminShell";
import { TrendForm } from "@/components/admin/TrendForm";

export const dynamic = "force-dynamic";

/** New trend form — admin only. */
export default async function NewTrendPage() {
  if (!(await requireAdmin())) redirect("/");
  const categories = await getAdminCategories();

  return (
    <AdminShell title="Новый тренд">
      <TrendForm trend={null} categories={categories} />
    </AdminShell>
  );
}
