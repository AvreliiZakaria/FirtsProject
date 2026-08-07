import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getTrendBySlug } from "@/lib/trends";
import { getServerUser, createServerSupabaseClient } from "@/lib/supabase/server";
import { spendCoins, addCoins } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 300;

const AITUNEL_BASE_URL = process.env.AITUNEL_BASE_URL?.replace(/\/+$/, "") || "https://api.aitunnel.ru/v1";
const AITUNEL_MODEL = process.env.AITUNEL_MODEL || "flux.2-flex";
const UPSTREAM_TIMEOUT_MS = 60_000;
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const UPLOADS_PREFIX = "/uploads";
const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
const SIZES = { portrait: "832x1040", story: "832x1472", classic: "832x1109", square: "1024x1024" } as const;
type AspectRatio = keyof typeof SIZES;

interface AitunelImageItem { b64_json?: string; url?: string; }
interface AitunelResponse { data?: AitunelImageItem[]; error?: { message?: string; code?: number }; }

export async function POST(request: Request) {
  const apiKey = process.env.AITUNEL_API_KEY;
  if (!apiKey) return jsonError(500, "Сервер не настроен: отсутствует AITUNEL_API_KEY.");
  const user = await getServerUser();
  if (!user) return jsonError(401, "Требуется авторизация.");

  let form: FormData;
  try { form = await request.formData(); } catch { return jsonError(400, "Ожидался multipart/form-data запрос."); }
  const rawFiles = form.getAll("files").concat(form.getAll("file"));
  const files = rawFiles.filter((f): f is File => typeof f !== "string" && f !== null);
  const presetId = String(form.get("presetId") ?? "").trim();
  const requestedRatio = String(form.get("aspectRatio") ?? "portrait");
  const aspectRatio: AspectRatio = requestedRatio in SIZES ? requestedRatio as AspectRatio : "portrait";
  if (files.length === 0) return jsonError(400, "Не загружено ни одного фото.");
  if (!presetId) return jsonError(400, "Не указан presetId.");

  const preset = await getTrendBySlug(presetId);
  if (!preset) return jsonError(404, `Пресет «${presetId}» не найден.`);

  const photos: { name: string; type: string; buffer: Buffer }[] = [];
  for (const [i, f] of files.entries()) {
    if (i >= 10) break;
    if (!f.type.startsWith("image/")) return jsonError(400, "Поддерживаются только изображения.");
    const buf = Buffer.from(await f.arrayBuffer());
    if (buf.byteLength === 0) return jsonError(400, "Файл пустой.");
    if (buf.byteLength > MAX_UPLOAD_BYTES) return jsonError(413, "Файл слишком большой (до 30 МБ).");
    photos.push({ name: f.name || `selfie-${i}.jpg`, type: f.type, buffer: buf });
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const sourceName = `${crypto.randomUUID()}${(path.extname(photos[0].name) || ".jpg").toLowerCase()}`;
  await fs.writeFile(path.join(UPLOADS_DIR, sourceName), photos[0].buffer);
  const newBalance = await spendCoins(preset.price, preset.slug);
  if (newBalance === null) return jsonError(402, "Недостаточно монет для генерации.");

  const textFields: MultipartField[] = [
    { name: "model", value: AITUNEL_MODEL },
    { name: "prompt", value: preset.prompt },
    { name: "negative_prompt", value: preset.negativePrompt },
    { name: "n", value: "1" },
    { name: "size", value: SIZES[aspectRatio] },
    { name: "response_format", value: "b64_json" },
  ];
  const imageFields: MultipartField[] = photos.map((p, i) => ({ name: "image[]", filename: i === 0 ? p.name : `ref-${i}-${p.name}`, contentType: p.type, data: p.buffer }));
  const { body: multipartBody, boundary } = buildMultipartBody([...textFields, ...imageFields]);

  let upstream: Response;
  try {
    upstream = await fetch(`${AITUNEL_BASE_URL}/images/edits`, { method: "POST", headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, Authorization: `Bearer ${apiKey}` }, body: multipartBody, duplex: "half" as "half", signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  } catch (err) {
    await addCoins(preset.price, "refund", preset.slug);
    const aborted = err instanceof Error && err.name === "TimeoutError";
    return jsonError(aborted ? 504 : 502, aborted ? "Генерация занимает слишком долго (timeout 60с). Монеты возвращены." : `Не удалось связаться с сервисом генерации. Монеты возвращены.${describeErr(err)}`);
  }

  if (!upstream.ok) {
    await addCoins(preset.price, "refund", preset.slug);
    let detail = "";
    try { const errBody = (await upstream.json()) as AitunelResponse; detail = errBody.error?.message ? ` ${errBody.error.message}` : ""; } catch {}
    if (upstream.status === 429) return jsonError(429, "Слишком много запросов к сервису генерации. Монеты возвращены.");
    if (upstream.status >= 500) return jsonError(502, `Сервис генерации временно недоступен (${upstream.status}). Монеты возвращены.${detail}`);
    return jsonError(upstream.status, `Ошибка генерации (${upstream.status}). Монеты возвращены.${detail}`);
  }

  const result = (await upstream.json()) as AitunelResponse;
  const item = result.data?.[0];
  if (!item) { await addCoins(preset.price, "refund", preset.slug); return jsonError(502, "Сервис вернул пустой результат. Монеты возвращены."); }
  let buf: Buffer | null = null;
  if (item.b64_json) buf = Buffer.from(item.b64_json, "base64");
  else if (item.url) {
    try { const imgRes = await fetch(item.url); if (imgRes.ok) buf = Buffer.from(await imgRes.arrayBuffer()); } catch {}
    if (!buf) {
      const supabase = createServerSupabaseClient();
      await supabase.from("generations").insert({ user_id: user.id, image: item.url, trend_slug: preset.slug, trend_name: preset.name });
      return NextResponse.json({ success: true, image: item.url, source: `${UPLOADS_PREFIX}/${sourceName}`, balance: newBalance, aspectRatio });
    }
  }
  if (!buf) { await addCoins(preset.price, "refund", preset.slug); return jsonError(502, "Не удалось получить изображение. Монеты возвращены."); }
  const outName = `${crypto.randomUUID()}.jpg`;
  await fs.writeFile(path.join(UPLOADS_DIR, outName), buf);
  const imageUrl = `${UPLOADS_PREFIX}/${outName}`;
  const supabase = createServerSupabaseClient();
  await supabase.from("generations").insert({ user_id: user.id, image: imageUrl, trend_slug: preset.slug, trend_name: preset.name });
  return NextResponse.json({ success: true, image: imageUrl, source: `${UPLOADS_PREFIX}/${sourceName}`, balance: newBalance, aspectRatio });
}

function jsonError(status: number, message: string) { return NextResponse.json({ success: false, error: message }, { status }); }
function describeErr(err: unknown): string { return err instanceof Error && err.message ? ` ${err.message}` : ""; }
interface MultipartField { name: string; value?: string; filename?: string; contentType?: string; data?: Buffer; }
function buildMultipartBody(fields: MultipartField[]): { body: ReadableStream<Uint8Array>; boundary: string } {
  const boundary = "----aitunnel" + crypto.randomBytes(16).toString("hex");
  const parts: Buffer[] = [];
  for (const f of fields) {
    parts.push(Buffer.from(`--${boundary}\r\n`));
    if (f.data && f.filename) { parts.push(Buffer.from(`Content-Disposition: form-data; name="${f.name}"; filename="${f.filename}"\r\n`), Buffer.from(`Content-Type: ${f.contentType ?? "application/octet-stream"}\r\n\r\n`), f.data, Buffer.from("\r\n")); }
    else parts.push(Buffer.from(`Content-Disposition: form-data; name="${f.name}"\r\n\r\n`), Buffer.from(`${f.value ?? ""}\r\n`));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return { body: new Response(Buffer.concat(parts)).body!, boundary };
}
