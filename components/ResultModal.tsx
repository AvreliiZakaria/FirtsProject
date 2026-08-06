"use client";

import { Download, Loader2, X } from "lucide-react";

/**
 * Generation result modal. Shows the produced photo with a download button.
 *
 * `imageUrl` points at a local /uploads/<uuid>.jpg. Download triggers a fetch +
 * blob so the filename is meaningful (instead of the raw UUID).
 */
export function ResultModal({
  open,
  imageUrl,
  balance,
  loading,
  error,
  onClose,
}: {
  open: boolean;
  imageUrl: string | null;
  balance: number | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-modal animate-fade-in rounded-t-3xl border border-base-line bg-base-raised p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[15px] font-semibold text-ink">Готово</p>
            {balance !== null && (
              <p className="text-[12px] text-ink-faint">Остаток: {balance} 🪙</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-base-hover hover:text-ink"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {loading && (
          <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-base-line bg-base text-ink-muted">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-[13px]">Генерируем фото…</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-base-line bg-base p-6 text-center">
            <p className="text-[14px] text-red-400">{error}</p>
            <p className="mt-1 text-[12px] text-ink-faint">
              Монеты возвращены на счёт.
            </p>
          </div>
        )}

        {imageUrl && !loading && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Результат генерации"
              className="block max-h-[70vh] w-full rounded-2xl border border-base-line bg-black object-contain"
            />
            <a
              href={imageUrl}
              download="lumo-photo.jpg"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-[15px] font-semibold text-base transition hover:bg-white active:scale-[0.99]"
            >
              <Download size={17} strokeWidth={1.8} />
              Скачать
            </a>
          </>
        )}
      </div>
    </div>
  );
}
