import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { uploadTrendImage } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Uploads a trend preview image to Supabase Storage (public `trends` bucket)
 * and returns its public URL. Admin only.
 *
 * Expects multipart/form-data with a `file` field. Validation (image MIME,
 * ≤5 MB) lives in lib/storage.ts.
 */
export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json(
      { success: false, error: "Доступ запрещён." },
      { status: 403 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Ожидался multipart/form-data." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (typeof file === "string" || !file) {
    return NextResponse.json(
      { success: false, error: "Файл не передан." },
      { status: 400 }
    );
  }

  const { url, error } = await uploadTrendImage(file as File);
  if (error || !url) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  return NextResponse.json({ success: true, url });
}
