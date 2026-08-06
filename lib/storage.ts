import { createServiceClient } from "@/lib/supabase/admin";

const TRENDS_BUCKET = "trends";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB for admin trend images

/**
 * Uploads a trend preview image to the public `trends` Storage bucket and
 * returns its public URL. Used by the admin upload route.
 *
 * Validates MIME + size, then stores under a UUID filename to avoid collisions
 * and path guessing.
 */
export async function uploadTrendImage(
  file: File
): Promise<{ url: string; error?: string }> {
  if (!file.type.startsWith("image/")) {
    return { url: "", error: "Поддерживаются только изображения." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { url: "", error: "Файл слишком большой (до 5 МБ)." };
  }

  const supabase = createServiceClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const objectPath = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(TRENDS_BUCKET)
    .upload(objectPath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return { url: "", error: "Не удалось загрузить изображение." };
  }

  const { data } = supabase.storage
    .from(TRENDS_BUCKET)
    .getPublicUrl(objectPath);

  return { url: data.publicUrl };
}
