import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getTrendBySlug } from "@/lib/trends";
import { getServerUser, createServerSupabaseClient } from "@/lib/supabase/server";
import { spendCoins, addCoins } from "@/lib/db";

export const runtime = "nodejs";
// Generation can take a while; let the request live up to ~5 minutes.
export const maxDuration = 300;

/**
 * AITUNEL configuration.
 *
 * Base URL + model name are pinned from env so they can be swapped without a
 * redeploy. Defaults match what we validated against the live API:
 *   - endpoint: POST {AITUNEL_BASE_URL}/images/generations
 *   - model:    "flux.2-flex"  (img2img; preserves the subject's face)
 *
 * NOTE: the model name in the original spec ("flux-2-flex") is a typo — the
 * API rejects it. The real id is "flux.2-flex" (dot, not hyphen).
 */
const AITUNEL_BASE_URL =
  process.env.AITUNEL_BASE_URL?.replace(/\/+$/, "") || "https://api.aitunnel.ru/v1";
const AITUNEL_MODEL = process.env.AITUNEL_MODEL || "flux.2-pro";

/** How long to wait for AITUNEL before giving up. */
const UPSTREAM_TIMEOUT_MS = 60_000;

/** Where uploaded selfies and generated results are written. */
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
/** Public prefix under which uploads are served (see app/uploads/[...path]). */
const UPLOADS_PREFIX = "/uploads";

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024; // 30 MB per file, matches the UI limit

interface AitunelImageItem {
  b64_json?: string;
  url?: string;
}

interface AitunelResponse {
  data?: AitunelImageItem[];
  error?: { message?: string; code?: number };
}

export async function POST(request: Request) {
  // --- 0. API key ----------------------------------------------------------
  const apiKey = process.env.AITUNEL_API_KEY;
  if (!apiKey) {
    return jsonError(500, "Сервер не настроен: отсутствует AITUNEL_API_KEY.");
  }

  // --- 0b. Authenticate ----------------------------------------------------
  // Every generation is tied to a user and costs coins. No session → 401.
  const user = await getServerUser();
  if (!user) {
    return jsonError(401, "Требуется авторизация.");
  }

  // --- 1. Parse multipart form --------------------------------------------
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "Ожидался multipart/form-data запрос.");
  }

  // Accept either multiple files (field "files") or a single legacy "file".
  const rawFiles = form.getAll("files").concat(form.getAll("file"));
  const files = rawFiles.filter(
    (f): f is File => typeof f !== "string" && f !== null
  );
  const presetId = String(form.get("presetId") ?? "").trim();

  if (files.length === 0) {
    return jsonError(400, "Не загружено ни одного фото.");
  }
  if (!presetId) {
    return jsonError(400, "Не указан presetId.");
  }

  // Validate preset → gives us prompt + negative_prompt + price.
  const preset = await getTrendBySlug(presetId);
  if (!preset) {
    return jsonError(404, `Пресет «${presetId}» не найден.`);
  }

  // --- 2. Validate + persist every uploaded selfie ------------------------
  // All uploaded photos are forwarded to the model together (as repeated
  // `image[]` parts) — multiple angles help the model lock onto the face.
  const MAX_PHOTOS = 10;
  const photos: { name: string; type: string; buffer: Buffer }[] = [];

  for (const [i, f] of files.entries()) {
    if (i >= MAX_PHOTOS) break;
    if (!f.type.startsWith("image/")) {
      return jsonError(400, "Поддерживаются только изображения.");
    }
    const buf = Buffer.from(await f.arrayBuffer());
    if (buf.byteLength === 0) {
      return jsonError(400, "Файл пустой.");
    }
    if (buf.byteLength > MAX_UPLOAD_BYTES) {
      return jsonError(413, "Файл слишком большой (до 30 МБ).");
    }
    photos.push({ name: f.name || `selfie-${i}.jpg`, type: f.type, buffer: buf });
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  // Persist the first photo as the "source" reference (for the history link).
  const ext = (path.extname(photos[0].name) || ".jpg").toLowerCase();
  const sourceName = `${crypto.randomUUID()}${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, sourceName), photos[0].buffer);

  // --- 2b. Deduct coins BEFORE the expensive upstream call -----------------
  // spendCoins() runs an atomic `UPDATE ... WHERE coins_balance >= price`, so
  // two concurrent requests can't both succeed. Returns null if the user can't
  // afford it → we bail out before touching AITUNEL (no wasted generation).
  // If the upstream call later fails, we refund below.
  const newBalance = await spendCoins(preset.price, preset.slug);
  if (newBalance === null) {
    return jsonError(402, "Недостаточно монет для генерации.");
  }

  // --- 3. Call AITUNEL (image EDIT — preserves the subject's identity) ----
  // We use the /images/edits endpoint (multipart/form-data), NOT
  // /images/generations. Empirical testing proved /images/generations with
  // `image`+`strength` does NOT preserve the person's face. The edits endpoint
  // transforms the input while keeping identity. Multiple reference photos are
  // sent as repeated `image[]` parts so the model locks onto the face better.
  const textFields: MultipartField[] = [
    { name: "model", value: AITUNEL_MODEL },
    { name: "prompt", value: preset.prompt },
    { name: "n", value: "1" },
    // Portrait output: matches the aspect of a typical selfie and avoids the
    // square-crop look. /images/edits accepts arbitrary sizes (tested 832x1248).
    { name: "size", value: "832x1248" },
    { name: "response_format", value: "b64_json" },
  ];
  const imageFields: MultipartField[] = photos.map((p, i) => ({
    name: "image[]",
    filename: i === 0 ? p.name : `ref-${i}-${p.name}`,
    contentType: p.type,
    data: p.buffer,
  }));

  const { body: multipartBody, boundary } = buildMultipartBody([
    ...textFields,
    ...imageFields,
  ]);

  let upstream: Response;
  try {
    upstream = await fetch(`${AITUNEL_BASE_URL}/images/edits`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${apiKey}`,
      },
      // `duplex: "half"` is REQUIRED by Node's fetch when the body is a
      // ReadableStream; without it fetch throws "duplex option is required".
      body: multipartBody,
      // @ts-expect-error — duplex exists at runtime in Node/undici but isn't
      // part of the standard RequestInit type.
      duplex: "half",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    // Upstream never produced a result → refund the coins we deducted.
    await addCoins(preset.price, "refund", preset.slug);
    const aborted = err instanceof Error && err.name === "TimeoutError";
    return jsonError(
      aborted ? 504 : 502,
      aborted
        ? "Генерация занимает слишком долго (timeout 60с). Монеты возвращены."
        : `Не удалось связаться с сервисом генерации. Монеты возвращены.${describeErr(err)}`
    );
  }

  // --- 4. Handle upstream errors (429, 5xx, etc.) -------------------------
  if (!upstream.ok) {
    // No image produced → refund the deducted coins.
    await addCoins(preset.price, "refund", preset.slug);
    let detail = "";
    try {
      const errBody = (await upstream.json()) as AitunelResponse;
      detail = errBody.error?.message ? ` ${errBody.error.message}` : "";
    } catch {
      /* ignore non-JSON error bodies */
    }
    const status = upstream.status;
    if (status === 429) {
      return jsonError(429, "Слишком много запросов к сервису генерации. Монеты возвращены.");
    }
    if (status >= 500) {
      return jsonError(502, `Сервис генерации временно недоступен (${status}). Монеты возвращены.${detail}`);
    }
    return jsonError(status, `Ошибка генерации (${status}). Монеты возвращены.${detail}`);
  }

  // --- 5. Extract the result image (base64 → file → public URL) -----------
  const result = (await upstream.json()) as AitunelResponse;
  const item = result.data?.[0];
  if (!item) {
    await addCoins(preset.price, "refund", preset.slug);
    return jsonError(502, "Сервис вернул пустой результат. Монеты возвращены.");
  }

  let buf: Buffer | null = null;
  if (item.b64_json) {
    buf = Buffer.from(item.b64_json, "base64");
  } else if (item.url) {
    // Some providers return a URL instead; fetch and persist it locally.
    try {
      const imgRes = await fetch(item.url);
      if (imgRes.ok) buf = Buffer.from(await imgRes.arrayBuffer());
    } catch {
      /* fall through to url fallback */
    }
    if (!buf) {
      const supabase = createServerSupabaseClient();
      await supabase.from("generations").insert({
        user_id: user.id,
        image: item.url!,
        trend_slug: preset.slug,
        trend_name: preset.name,
      });
      return NextResponse.json({
        success: true,
        image: item.url,
        source: `${UPLOADS_PREFIX}/${sourceName}`,
        balance: newBalance,
      });
    }
  }

  if (!buf) {
    await addCoins(preset.price, "refund", preset.slug);
    return jsonError(502, "Не удалось получить изображение. Монеты возвращены.");
  }

  const outName = `${crypto.randomUUID()}.jpg`;
  await fs.writeFile(path.join(UPLOADS_DIR, outName), buf);
  const imageUrl = `${UPLOADS_PREFIX}/${outName}`;

  // Record the generation under the user's session so the profile history
  // can show it. Failure here is non-fatal (the image still exists); we just
  // don't get a history row.
  const supabase = createServerSupabaseClient();
  await supabase.from("generations").insert({
    user_id: user.id,
    image: imageUrl,
    trend_slug: preset.slug,
    trend_name: preset.name,
  });

  return NextResponse.json({
    success: true,
    image: imageUrl,
    source: `${UPLOADS_PREFIX}/${sourceName}`,
    balance: newBalance,
  });
}

// --- helpers --------------------------------------------------------------

function jsonError(status: number, message: string) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function describeErr(err: unknown): string {
  if (err instanceof Error && err.message) return ` ${err.message}`;
  return "";
}

/**
 * Builds a multipart/form-data body without external deps.
 *
 * Used for the /images/edits endpoint, which requires a real file part
 * (base64-in-a-form-field is rejected). Returns the assembled Buffer and the
 * boundary string to set on the Content-Type header.
 */
interface MultipartField {
  name: string;
  value?: string;
  filename?: string;
  contentType?: string;
  data?: Buffer;
}

function buildMultipartBody(fields: MultipartField[]): {
  body: ReadableStream<Uint8Array>;
  boundary: string;
} {
  const boundary = "----aitunnel" + crypto.randomBytes(16).toString("hex");
  const parts: Buffer[] = [];

  for (const f of fields) {
    parts.push(Buffer.from(`--${boundary}\r\n`));
    if (f.data && f.filename) {
      // File part
      parts.push(
        Buffer.from(
          `Content-Disposition: form-data; name="${f.name}"; filename="${f.filename}"\r\n`
        )
      );
      parts.push(
        Buffer.from(`Content-Type: ${f.contentType ?? "application/octet-stream"}\r\n\r\n`)
      );
      parts.push(f.data);
      parts.push(Buffer.from("\r\n"));
    } else {
      // Text field
      parts.push(
        Buffer.from(`Content-Disposition: form-data; name="${f.name}"\r\n\r\n`)
      );
      parts.push(Buffer.from(`${f.value ?? ""}\r\n`));
    }
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  // Wrap the Buffer in a Response to obtain a ReadableStream, which fetch
  // accepts as BodyInit across Node/undici type definitions.
  return { body: new Response(Buffer.concat(parts)).body!, boundary };
}
