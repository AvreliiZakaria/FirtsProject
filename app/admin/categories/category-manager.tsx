"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import type { AdminCategory } from "@/lib/trends";

/**
 * Category list + inline create/rename/delete.
 *
 * "all" is reserved (the home filter rail prepends it) and is never deletable.
 * On every mutation we router.refresh() so the server list re-reads from the DB.
 */
export function CategoryManager({
  initialCategories,
}: {
  initialCategories: AdminCategory[];
}) {
  const router = useRouter();
  const [list, setList] = useState(initialCategories);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Не удалось создать.");
        return;
      }
      setNewLabel("");
      router.refresh();
    } catch {
      setError("Сетевая ошибка.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRename(id: number) {
    if (!editLabel.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, label: editLabel.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Не удалось обновить.");
        return;
      }
      setList((l) =>
        l.map((c) => (c.id === id ? { ...c, label: editLabel.trim() } : c))
      );
      setEditingId(null);
    } catch {
      setError("Сетевая ошибка.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number, label: string) {
    if (!confirm(`Удалить категорию «${label}»? Тренды в ней останутся без категории.`))
      return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Не удалось удалить.");
        return;
      }
      setList((l) => l.filter((c) => c.id !== id));
      router.refresh();
    } catch {
      setError("Сетевая ошибка.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Existing categories */}
      <div className="flex flex-col gap-2">
        {list.map((c) => {
          const isAll = c.slug === "all";
          const editing = editingId === c.id;
          return (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-2xl border border-base-line bg-base-raised p-3"
            >
              {editing ? (
                <input
                  autoFocus
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename(c.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 rounded-lg border border-base-line bg-base px-2.5 py-1.5 text-[14px] text-ink focus:border-ink-faint focus:outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(c.id);
                    setEditLabel(c.label);
                  }}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <span className="text-[14px] font-medium text-ink">
                    {c.label}
                  </span>
                  <span className="text-[11px] text-ink-faint">
                    · {c.trendCount} тренд.
                  </span>
                </button>
              )}

              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={() => saveRename(c.id)}
                    disabled={busy}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-base"
                  >
                    <Check size={15} strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-1 text-[12px] text-ink-faint hover:text-ink"
                  >
                    Отмена
                  </button>
                </>
              ) : isAll ? (
                <span className="rounded-full border border-base-line px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink-faint">
                  служебная
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => remove(c.id, c.label)}
                  disabled={busy}
                  aria-label="Удалить"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition hover:text-red-400"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Create */}
      <form
        onSubmit={create}
        className="flex items-center gap-2 rounded-2xl border border-base-line bg-base-raised p-2"
      >
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Новая категория"
          className="flex-1 bg-transparent px-3 py-2 text-[14px] text-ink placeholder:text-ink-faint focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !newLabel.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-[13px] font-semibold text-base transition hover:bg-white disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} strokeWidth={2.4} />}
          Добавить
        </button>
      </form>

      {error && <p className="text-[13px] text-red-400">{error}</p>}
    </div>
  );
}
