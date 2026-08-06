import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { addCoins } from "@/lib/db";
import { getPackageById, coinsFor } from "@/lib/packages";

export const runtime = "nodejs";

/**
 * Mock checkout. In production this is where you'd create a YooKassa/Robokassa
 * payment, redirect to the provider, and credit coins only after the webhook
 * confirms a paid status. For MVP we credit immediately.
 *
 * Body: { packageId: string }. Validates the package id against the catalogue.
 */
export async function POST(request: Request) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Требуется авторизация." },
      { status: 401 }
    );
  }

  let body: { packageId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Неверный формат запроса." },
      { status: 400 }
    );
  }

  const pkg = getPackageById(String(body.packageId ?? ""));
  if (!pkg) {
    return NextResponse.json(
      { success: false, error: "Пакет не найден." },
      { status: 404 }
    );
  }

  const newBalance = await addCoins(coinsFor(pkg), "purchase", pkg.id);
  if (newBalance === null) {
    return NextResponse.json(
      { success: false, error: "Не удалось начислить монеты." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, balance: newBalance });
}
