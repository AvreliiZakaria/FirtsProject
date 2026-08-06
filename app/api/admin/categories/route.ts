import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

interface CategoryInput {
  id?: number;
  label: string;
  slug?: string;
  sort_order?: number;
}

/**
 * Category CRUD — admin only.
 *   POST   create
 *   PUT    rename / reorder (requires id)
 *   DELETE remove (requires id)
 */
async function ok(message: string) {
  return NextResponse.json({ success: true, message });
}
function fail(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return fail(403, "Доступ запрещён.");

  const body = (await request.json().catch(() => null)) as CategoryInput | null;
  if (!body?.label?.trim()) return fail(400, "Укажите название категории.");

  const supabase = createServiceClient();
  const slug = body.slug?.trim() ? slugify(body.slug) : slugify(body.label);

  const { error } = await supabase.from("categories").insert({
    slug,
    label: body.label.trim(),
    sort_order: body.sort_order ?? 0,
  });

  if (error) {
    return fail(
      error.code === "23505" ? 409 : 500,
      error.code === "23505" ? "Категория с таким slug уже существует." : "Не удалось создать категорию."
    );
  }
  return ok("Категория создана.");
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) return fail(403, "Доступ запрещён.");

  const body = (await request.json().catch(() => null)) as CategoryInput | null;
  if (!body?.id) return fail(400, "Не указан id категории.");
  if (!body.label?.trim()) return fail(400, "Укажите название категории.");

  const supabase = createServiceClient();
  const slug = body.slug?.trim() ? slugify(body.slug) : slugify(body.label);

  const { error } = await supabase
    .from("categories")
    .update({ label: body.label.trim(), slug, sort_order: body.sort_order ?? 0 })
    .eq("id", body.id);

  if (error) {
    return fail(
      error.code === "23505" ? 409 : 500,
      error.code === "23505" ? "Категория с таким slug уже существует." : "Не удалось обновить категорию."
    );
  }
  return ok("Категория обновлена.");
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) return fail(403, "Доступ запрещён.");

  const body = (await request.json().catch(() => null)) as { id?: number } | null;
  if (!body?.id) return fail(400, "Не указан id категории.");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", body.id);
  if (error) return fail(500, "Не удалось удалить категорию.");

  return ok("Категория удалена.");
}
