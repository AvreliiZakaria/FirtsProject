/**
 * Converts a free-form label (Russian or English) into a URL-safe slug.
 *
 * e.g. "Noir Portrait" → "noir-portrait", "Студийная съёмка" → "studiynaya-syomka".
 * Falls back to "trend" / "category" for purely-symbolic input so the column's
 * NOT NULL + UNIQUE constraints are never violated by an empty slug.
 */
export function slugify(input: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
    я: "ya",
  };

  const slug = input
    .toLowerCase()
    .trim()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "trend";
}
