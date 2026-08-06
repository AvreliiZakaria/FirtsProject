"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Link2, Loader2, Save, Trash2 } from "lucide-react";
import type { AdminCategory, AdminTrend } from "@/lib/trends";
import { slugify } from "@/lib/slug";

/**
 * Create / edit trend form. One component for both flows (edit passes an
 * existing trend; create passes none).
 *
 * Image can come from EITHER a URL the admin pastes OR a file uploaded to
 * Storage via /api/admin/upload. The uploaded URL replaces the URL field.
 *
 * Submits to /api/admin/trends (POST for create, PUT for update) and supports
 * delete (DELETE). After save, navigate back to the trend list.
 */
export function TrendForm({
  trend,
  categories,
}: {
  trend: AdminTrend | null;
  categories: AdminCategory[];
}) {
  const router = useRouter();
  const isEdit = trend !== null;

  const [name, setName] = useState(trend?.name ?? "");
  const [slug, setSlug] = useState(trend?.slug ?? "");
  const [subtitle, setSubtitle] = useState(trend?.subtitle ?? "");
  const [categoryId, setCategoryId] = useState<string>(
    trend?.categoryId ? String(trend.categoryId) : ""
  );
  const [price, setPrice] = useState(String(trend?.price ?? 5));
  const [prompt, setPrompt] = useState(trend?.prompt ?? "");
  const [negativePrompt, setNegativePrompt] = useState(
    trend?.negativePrompt ?? ""
  );
  const [image, setImage] = useState(trend?.image ?? "");
  const [published, setPublished] = useState(trend?.isPublished ?? true);

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalSlug = slug.trim() ? slugify(slug) : slugify(name);

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Не удалось загрузить изображение.");
        return;
      }
      setImage(data.url);
    } catch {
      setError("Сетевая ошибка при загрузке.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const body = {
      ...(isEdit ? { id: trend!.id } : {}),
      name: name.trim(),
      slug: finalSlug,
      subtitle: subtitle.trim(),
      category_id: categoryId ? Number(categoryId) : null,
      price: Number(price),
      prompt: prompt.trim(),
      negative_prompt: negativePrompt.trim(),
      image: image.trim(),
      is_published: published,
    };

    try {
      const res = await fetch("/api/admin/trends", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Не удалось сохранить.");
        return;
      }
      router.push("/admin/trends");
      router.refresh();
    } catch {
      setError("Сетевая ошибка.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!isEdit) return;
    if (!confirm("Удалить этот тренд безвозвратно?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/trends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: trend!.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Не удалось удалить.");
        return;
      }
      router.push("/admin/trends");
      router.refresh();
    } catch {
      setError("Сетевая ошибка.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* Image picker: URL or upload */}
      <Field label="Картинка тренда">
        <div className="flex gap-3">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-base-line bg-base-hover">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="Превью"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-faint">
                <ImageUp size={20} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 rounded-xl border border-base-line bg-base px-3">
              <Link2 size={14} className="text-ink-faint" />
              <input
                type="url"
                placeholder="Вставьте URL картинки"
                value={image.startsWith("blob:") ? "" : image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full bg-transparent py-2.5 text-[13px] text-ink placeholder:text-ink-faint focus:outline-none"
              />
            </div>
            <label className="mt-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-base-line bg-base-raised py-2 text-[12px] font-medium text-ink-muted transition hover:text-ink">
              {uploading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <ImageUp size={13} />
              )}
              {uploading ? "Загрузка…" : "Загрузить файл"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f);
                }}
              />
            </label>
          </div>
        </div>
      </Field>

      <Field label="Название">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Noir Portrait"
          className={inputCls}
        />
      </Field>

      <Field label="Подзаголовок">
        <input
          required
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Кинематографичный чёрно-белый портрет"
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="URL (slug)">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={slugify(name) || "noir-portrait"}
            className={inputCls}
          />
        </Field>
        <Field label="Категория">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputCls}
          >
            <option value="">Без категории</option>
            {categories
              .filter((c) => c.slug !== "all")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
          </select>
        </Field>
      </div>

      <Field label={`Цена (монет) · slug: ${finalSlug || "—"}`}>
        <input
          type="number"
          min={0}
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="Промпт (английский)">
        <textarea
          required
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Cinematic portrait, studio lighting…"
          className={`${inputCls} resize-none`}
        />
      </Field>

      <Field label="Негативный промпт">
        <textarea
          required
          rows={3}
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="lowres, blurry, deformed…"
          className={`${inputCls} resize-none`}
        />
      </Field>

      <label className="flex items-center gap-3 rounded-2xl border border-base-line bg-base-raised px-4 py-3.5">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 accent-white"
        />
        <span className="text-[14px] text-ink">Опубликован (виден пользователям)</span>
      </label>

      {error && <p className="text-[13px] text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink py-4 text-[15px] font-semibold text-base transition hover:bg-white disabled:opacity-60 active:scale-[0.99]"
        >
          {busy ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Save size={17} strokeWidth={1.8} />
          )}
          {isEdit ? "Сохранить" : "Создать"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-2xl border border-base-line bg-base-raised px-5 text-[15px] font-medium text-ink-muted transition hover:text-red-400 disabled:opacity-60"
          >
            <Trash2 size={17} strokeWidth={1.8} />
          </button>
        )}
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-xl border border-base-line bg-base px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-faint focus:border-ink-faint focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-ink-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
