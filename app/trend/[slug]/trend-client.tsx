"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  ClipboardCopy,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import type { Trend } from "@/lib/trends";
import { useBalance } from "@/components/Providers";
import { AuthGate } from "@/components/AuthGate";
import { InsufficientBalanceModal } from "@/components/InsufficientBalanceModal";
import { ResultModal } from "@/components/ResultModal";

const MAX_BYTES = 30 * 1024 * 1024; // 30 MB per file
const MAX_PHOTOS = 10; // up to 10 reference photos

interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
}

export function TrendClient({ trend }: { trend: Trend }) {
  // --- Upload state (multiple photos, ALL sent to the model) --------------
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: FileList | File[] | null | undefined) => {
    if (!incoming) return;
    const list = Array.from(incoming);
    setError(null);
    setPhotos((prev) => {
      const room = MAX_PHOTOS - prev.length;
      if (room <= 0) {
        setError(`Максимум ${MAX_PHOTOS} фото. Удалите лишние, чтобы добавить новые.`);
        return prev;
      }
      const added: PhotoItem[] = [];
      for (const file of list) {
        if (added.length >= room) break;
        if (!file.type.startsWith("image/")) {
          setError("Поддерживаются только изображения.");
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError("Файл слишком большой (до 30 МБ).");
          continue;
        }
        added.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
      const next = [...prev, ...added];
      return next;
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  // --- Prompt state -------------------------------------------------------
  const [promptOpen, setPromptOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(trend.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard may be blocked — ignore silently in this demo.
    }
  };

  // --- Generation state ---------------------------------------------------
  const { balance, loggedIn, loading: balanceLoading, setBalance } = useBalance();
  const [generating, setGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [needCoins, setNeedCoins] = useState(false);

  /**
   * Generate flow gates (client-side pre-check + server-side enforcement):
   *   1. Not logged in → show login prompt.
   *   2. Balance below price → show top-up modal.
   *   3. Otherwise POST the file to /api/generate. The server re-checks auth
   *      and atomically deducts coins; on 402/401 it bails out before calling
   *      AITUNEL, so no coins are lost.
   */
  const handleGenerate = async () => {
    if (photos.length === 0) return;

    // Gate 1: auth.
    if (!loggedIn) {
      setAuthOpen(true);
      return;
    }
    // Gate 2: balance (server is the real source of truth; this is UX only).
    if (balance !== null && balance < trend.price) {
      setNeedCoins(true);
      return;
    }

    setGenerating(true);
    setResultOpen(true);
    setResultError(null);
    setResultImage(null);

    try {
      const fd = new FormData();
      // Send ALL uploaded photos as reference images — multiple angles help
      // the model lock onto the face. No manual selection needed.
      for (const p of photos) {
        fd.append("files", p.file, p.file.name);
      }
      fd.append("presetId", trend.slug);

      const res = await fetch("/api/generate", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok || !data.success) {
        // Map server codes to the right client modal where possible.
        if (res.status === 401) {
          setResultOpen(false);
          setAuthOpen(true);
          return;
        }
        if (res.status === 402) {
          setResultOpen(false);
          setNeedCoins(true);
          return;
        }
        setResultError(data.error ?? "Генерация не удалась.");
        return;
      }

      setResultImage(data.image);
      if (typeof data.balance === "number") setBalance(data.balance);
    } catch {
      setResultError("Сетевая ошибка. Попробуйте ещё раз.");
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = photos.length > 0;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-base-line/70 bg-base/80 px-3 py-3 backdrop-blur-xl md:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-content items-center gap-2">
        <Link
          href="/"
          aria-label="Назад"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-base-raised active:scale-95"
        >
          <ArrowLeft size={20} strokeWidth={1.8} />
        </Link>
        <p className="text-[15px] font-semibold tracking-tight text-ink">
          {trend.name}
        </p>
        </div>
      </header>

      <main className="flex-1 animate-fade-in px-4 pb-36 pt-5 md:px-8 md:pb-10 lg:px-12">
        <div className="mx-auto w-full max-w-[720px]">
        {/* --- Hero block: result preview (full image, no crop) --- */}
        <section className="relative overflow-hidden rounded-3xl border border-base-line bg-base-raised shadow-glow">
          <div className="relative w-full overflow-hidden bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={trend.image}
              alt={trend.name}
              className="block max-h-[65vh] w-full object-contain"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
              Выбранный тренд
            </p>
            <p className="mt-1 text-[22px] font-bold leading-tight tracking-tight text-ink">
              {trend.name}
            </p>
            <p className="mt-1 text-[13px] text-ink-muted">{trend.subtitle}</p>
          </div>
        </section>

        {/* --- Upload block (multiple photos, one active) --- */}
        <section className="mt-5">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              Ваше фото
            </h2>
            {photos.length > 0 && (
              <span className="text-[12px] text-ink-faint">
                {photos.length}/{MAX_PHOTOS}
              </span>
            )}
          </div>

          {photos.length === 0 ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-9 text-center transition ${
                dragOver
                  ? "border-ink bg-base-hover"
                  : "border-base-line bg-base-raised hover:border-ink-faint"
              }`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-base-hover text-ink">
                <Camera size={26} strokeWidth={1.6} />
              </span>
              <p className="mt-4 text-[15px] font-semibold text-ink">
                Добавить фото
              </p>
              <p className="mt-1 text-[12px] text-ink-faint">
                Можно до {MAX_PHOTOS} фото · до 30 МБ каждое
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </label>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Grid of all uploaded photos — every one is sent to the model */}
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-5">
                {photos.map((p) => (
                  <div
                    key={p.id}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-base-line bg-base-raised"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.previewUrl}
                      alt={p.file.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(p.id)}
                      aria-label="Удалить фото"
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-ink backdrop-blur transition hover:bg-black/85 active:scale-95"
                    >
                      <X size={13} strokeWidth={2.2} />
                    </button>
                  </div>
                ))}

                {/* Add-more tile */}
                {photos.length < MAX_PHOTOS && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-base-line bg-base-raised text-ink-faint transition hover:border-ink-faint hover:text-ink">
                    <Camera size={20} strokeWidth={1.8} />
                    <span className="text-[11px] font-medium">Ещё</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="text-[12px] text-ink-faint">
                Все {photos.length} {pluralPhotos(photos.length)} будут отправлены ИИ
                как референсы лица.
              </p>
            </div>
          )}

          {error && <p className="mt-2.5 text-[12px] text-red-400">{error}</p>}
        </section>

        {/* --- Prompt block (collapsed by default) --- */}
        <section className="mt-5">
          <h2 className="mb-2.5 text-[15px] font-semibold tracking-tight text-ink">
            Промпт
          </h2>

          <div className="overflow-hidden rounded-2xl border border-base-line bg-base-raised">
            <button
              type="button"
              onClick={() => setPromptOpen((v) => !v)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-base-hover"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-base-hover text-ink">
                <Sparkles size={16} strokeWidth={1.8} />
              </span>
              <span className="flex-1">
                <span className="block text-[14px] font-medium text-ink">
                  {promptOpen ? "Скрыть промпт" : "Показать промпт"}
                </span>
                <span className="block text-[12px] text-ink-faint">
                  Готовый промпт на английском
                </span>
              </span>
              <ChevronDown
                size={18}
                strokeWidth={2}
                className={`text-ink-faint transition-transform ${
                  promptOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {promptOpen && (
              <div className="animate-fade-in border-t border-base-line px-4 py-4">
                <p className="text-[13px] leading-relaxed text-ink-muted">
                  {trend.prompt}
                </p>
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-base-line bg-base px-3.5 py-2 text-[12px] font-medium text-ink transition hover:bg-base-hover active:scale-[0.97]"
                >
                  {copied ? (
                    <>
                      <Check size={14} strokeWidth={2.2} />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <ClipboardCopy size={14} strokeWidth={1.8} />
                      Копировать
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>
        </div>
      </main>

      {/* --- Inline generate button (desktop) --- */}
      <div className="hidden md:block">
        <div className="mx-auto mt-6 w-full max-w-[720px] px-8 lg:px-12">
          <GenerateButton
            canGenerate={canGenerate}
            generating={generating}
            balanceLoading={balanceLoading}
            price={trend.price}
            onClick={handleGenerate}
          />
        </div>
      </div>

      {/* --- Fixed bottom bar (mobile only) --- */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full border-t border-base-line bg-base/85 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
        <GenerateButton
          canGenerate={canGenerate}
          generating={generating}
          balanceLoading={balanceLoading}
          price={trend.price}
          onClick={handleGenerate}
        />
      </div>

      {/* --- Modals --- */}
      <AuthGate open={authOpen} onClose={() => setAuthOpen(false)} />
      <InsufficientBalanceModal
        open={needCoins}
        onClose={() => setNeedCoins(false)}
        balance={balance}
        price={trend.price}
      />
      <ResultModal
        open={resultOpen}
        imageUrl={resultImage}
        balance={balance}
        loading={generating}
        error={resultError}
        onClose={() => setResultOpen(false)}
      />
    </div>
  );
}

/** Russian plural for "фото" — always "фото" (indeclinable), so just returns it. */
function pluralPhotos(_n: number): string {
  return "фото";
}

/** The generate CTA, shared by the desktop inline button and mobile bottom bar. */
function GenerateButton({
  canGenerate,
  generating,
  balanceLoading,
  price,
  onClick,
}: {
  canGenerate: boolean;
  generating: boolean;
  balanceLoading: boolean;
  price: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!canGenerate || generating || balanceLoading}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-semibold tracking-tight transition active:scale-[0.99] ${
        canGenerate && !generating && !balanceLoading
          ? "bg-ink text-base hover:bg-white"
          : "cursor-not-allowed bg-base-raised text-ink-faint"
      }`}
    >
      {generating ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          Генерация…
        </>
      ) : canGenerate ? (
        <>
          <Sparkles size={18} strokeWidth={1.8} />
          Сгенерировать
          <span className="ml-1 inline-flex items-center gap-1 opacity-80">
            {price} 🪙
          </span>
        </>
      ) : (
        "Добавьте фото для генерации"
      )}
    </button>
  );
}
