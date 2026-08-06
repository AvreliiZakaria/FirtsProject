/**
 * Coin packages for the shop.
 *
 * `price` is the sticker price in ₽; `generations` is how many photo
 * generations the buyer gets. Each generation costs 5 coins, so the credited
 * coin amount is `generations * COINS_PER_GENERATION`.
 *
 * Prices match the spec: 1 / 119₽, 3 / 259₽ (Хит), 5 / 699₽.
 */
export const COINS_PER_GENERATION = 5;

export interface Package {
  id: string;
  generations: number;
  price: number; // ₽
  oldPrice?: number; // optional crossed-out price for marketing
  popular?: boolean; // "Хит" badge
}

export const PACKAGES: Package[] = [
  { id: "p1", generations: 1, price: 119 },
  { id: "p3", generations: 3, price: 259, oldPrice: 357, popular: true },
  { id: "p5", generations: 5, price: 699 },
];

/** Look up a package by id. Returns undefined if not found. */
export function getPackageById(id: string): Package | undefined {
  return PACKAGES.find((p) => p.id === id);
}

/** Coins credited for a package = generations × coins per generation. */
export function coinsFor(pkg: Package): number {
  return pkg.generations * COINS_PER_GENERATION;
}
