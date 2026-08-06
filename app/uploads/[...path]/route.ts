import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const EXT_TO_TYPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * Serves files from the local uploads/ directory.
 *
 * Next.js does not serve arbitrary project folders as static assets, so we
 * expose them through a route handler. Path traversal is blocked by resolving
 * the requested path against UPLOADS_DIR and verifying it stays inside.
 */
export async function GET(
  _request: Request,
  { params }: { params: { path: string[] } }
) {
  const rel = params.path.map((s) => decodeURIComponent(s)).join(path.sep);
  const abs = path.resolve(UPLOADS_DIR, rel);

  // Guard against `..` sequences escaping the uploads root.
  if (path.relative(UPLOADS_DIR, abs).startsWith("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  let data: Buffer;
  try {
    data = await fs.readFile(abs);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  // Use the extension to pick a sane content type; default to JPEG.
  const ext = path.extname(abs).toLowerCase();
  const contentType = EXT_TO_TYPE[ext] ?? "application/octet-stream";

  // ETag lets the browser cache without re-downloading.
  const etag = `"${crypto.createHash("sha1").update(data).digest("hex").slice(0, 16)}"`;

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      ETag: etag,
    },
  });
}
