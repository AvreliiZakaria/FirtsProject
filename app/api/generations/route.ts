import { NextResponse } from "next/server";
import { deleteGeneration } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Deletes one of the current user's generations (by id). RLS enforces that
 * only the owner's rows are deletable, so no extra auth check is needed
 * beyond the session — a different user's id simply won't match any row.
 */
export async function DELETE(request: Request) {
  let body: { id?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Неверный формат запроса." },
      { status: 400 }
    );
  }
  if (!body.id) {
    return NextResponse.json(
      { success: false, error: "Не указан id." },
      { status: 400 }
    );
  }

  const ok = await deleteGeneration(Number(body.id));
  if (!ok) {
    return NextResponse.json(
      { success: false, error: "Не удалось удалить." },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
