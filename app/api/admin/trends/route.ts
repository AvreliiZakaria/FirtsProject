import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

interface TrendInput {
  id?: number;
  name: string;
  slug?: string;
  subtitle: string;
  category_id: number | null;
  image: string;
  price: number;
  prompt: string;
  negative_prompt: string;
  is_published: boolean;
}

/**
 * Trend CRUD — admin only.
 *
 * POST   creates a trend.
 * PUT    updates a trend (requires `id` in the body).
 * DELETE removes a trend (requires `id` in the body).
 *
 * All writes use the service-role client (bypasses RLS). Each request is first
 * gated by requireAdmin(), which checks the session email against ADMIN_EMAILS.
 */
async function ok(message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ success: true, message, ...extra });
}
function fail(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return fail(403, "Доступ запрещён.");

  let body: TrendInput;
  try {
    body = (await request.json()) as TrendInput;
  } catch {
    return fail(400, "Неверный формат запроса.");
  }

  const errors = validate(body);
  if (errors.length) return fail(400, errors.join(" "));

  const supabase = createServiceClient();
  const slug = (body.slug?.trim() ? slugify(body.slug) : slugify(body.name)) || body.name;

  const { data, error } = await supabase
    .from("trends")
    .insert({
      slug,
      name: body.name.trim(),
      subtitle: body.subtitle.trim(),
      category_id: body.category_id,
      image: body.image.trim(),
      price: body.price,
      prompt: body.prompt.trim(),
      negative_prompt: body.negative_prompt.trim(),
      is_published: body.is_published,
    })
    .select("id, slug")
    .single();

  if (error) {
    return fail(
      error.code === "23505" ? 409 : 500,
      error.code === "23505" ? "Тренд с таким slug уже существует." : "Не удалось сохранить тренд."
    );
  }

  return ok("Тренд создан.", { id: data.id, slug: data.slug });
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) return fail(403, "Доступ запрещён.");

  let body: TrendInput;
  try {
    body = (await request.json()) as TrendInput;
  } catch {
    return fail(400, "Неверный формат запроса.");
  }
  if (!body.id) return fail(400, "Не указан id тренда.");

  const errors = validate(body);
  if (errors.length) return fail(400, errors.join(" "));

  const supabase = createServiceClient();
  const slug = body.slug?.trim() ? slugify(body.slug) : slugify(body.name);

  const { error } = await supabase
    .from("trends")
    .update({
      slug,
      name: body.name.trim(),
      subtitle: body.subtitle.trim(),
      category_id: body.category_id,
      image: body.image.trim(),
      price: body.price,
      prompt: body.prompt.trim(),
      negative_prompt: body.negative_prompt.trim(),
      is_published: body.is_published,
    })
    .eq("id", body.id);

  if (error) {
    return fail(
      error.code === "23505" ? 409 : 500,
      error.code === "23505" ? "Тренд с таким slug уже существует." : "Не удалось обновить тренд."
    );
  }

  return ok("Тренд обновлён.");
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) return fail(403, "Доступ запрещён.");

  let body: { id?: number };
  try {
    body = await request.json();
  } catch {
    return fail(400, "Неверный формат запроса.");
  }
  if (!body.id) return fail(400, "Не указан id тренда.");

  const supabase = createServiceClient();
  const { error } = await supabase.from("trends").delete().eq("id", body.id);
  if (error) return fail(500, "Не удалось удалить тренд.");

  return ok("Тренд удалён.");
}

function validate(b: TrendInput): string[] {
  const e: string[] = [];
  if (!b.name?.trim()) e.push("Укажите название.");
  if (!b.subtitle?.trim()) e.push("Укажите подзаголовок.");
  if (!b.image?.trim()) e.push("Укажите картинку (URL или загрузите файл).");
  if (!b.prompt?.trim()) e.push("Укажите промпт.");
  if (!b.negative_prompt?.trim()) e.push("Укажите негативный промпт.");
  if (typeof b.price !== "number" || b.price < 0) e.push("Цена должна быть числом ≥ 0.");
  return e;
}
