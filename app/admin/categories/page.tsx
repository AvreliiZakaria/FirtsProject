import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminCategories } from "@/lib/trends";
import { AdminShell } from "@/components/admin/AdminShell";
import { CategoryManager } from "./category-manager";

export const dynamic = "force-dynamic";

/** Category management — admin only. */
export default async function AdminCategoriesPage() {
  if (!(await requireAdmin())) redirect("/");
  const categories = await getAdminCategories();

  return (
    <AdminShell title="Категории">
      <p className="mb-4 text-[13px] text-ink-faint">
        Категории появляются в фильтре на главной. Категорию «Все» удалить нельзя.
      </p>
      <CategoryManager initialCategories={categories} />
    </AdminShell>
  );
}
