import { normalizeText } from "./utils";

export interface CategoryLite { id: string; name: string }
export interface MenuItemLite { id: string; name: string; category_id: string | null }

// Levenshtein distance
function lev(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[] = Array(b.length + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
}

export function findCategoryId(
  excelCategory: string,
  categories: CategoryLite[]
): string | null {
  const norm = normalizeText(excelCategory);
  let cat = categories.find(c => normalizeText(c.name) === norm);
  if (cat) return cat.id;
  cat = categories.find(c => {
    const cn = normalizeText(c.name);
    return cn.includes(norm) || norm.includes(cn);
  });
  if (cat) return cat.id;
  const map: Record<string, string> = {
    tesztaetelek: "tészta ételek",
    foetelek: "főételek",
    fozelekek: "főzelékek",
    koret: "hagyományos köretek",
    koretek: "hagyományos köretek",
    desszert: "desszertek",
    leves: "levesek",
  };
  const stripped = norm.replace(/\s+/g, "");
  const mapped = map[stripped];
  if (mapped) {
    cat = categories.find(c => normalizeText(c.name) === normalizeText(mapped));
    if (cat) return cat.id;
  }
  return null;
}

export type MatchKind = "exact" | "fuzzy" | "none";
export interface ItemMatch {
  query: string;
  kind: MatchKind;
  item?: MenuItemLite;
  distance?: number;
}

export function matchMenuItem(query: string, items: MenuItemLite[]): ItemMatch {
  const q = normalizeText(query);
  if (!q) return { query, kind: "none" };
  const exact = items.find(i => normalizeText(i.name) === q);
  if (exact) return { query, kind: "exact", item: exact };
  // contains
  const contains = items.find(i => normalizeText(i.name).includes(q) || q.includes(normalizeText(i.name)));
  if (contains) return { query, kind: "fuzzy", item: contains, distance: 1 };
  // levenshtein
  let best: { item: MenuItemLite; d: number } | null = null;
  for (const i of items) {
    const d = lev(q, normalizeText(i.name));
    if (best === null || d < best.d) best = { item: i, d };
  }
  if (best && best.d <= Math.max(2, Math.floor(q.length / 4))) {
    return { query, kind: "fuzzy", item: best.item, distance: best.d };
  }
  return { query, kind: "none" };
}

export function searchMenuItems(query: string, items: MenuItemLite[], limit = 8): MenuItemLite[] {
  const q = normalizeText(query);
  if (!q) return [];
  const scored = items
    .map(i => {
      const n = normalizeText(i.name);
      if (n === q) return { i, s: 0 };
      if (n.startsWith(q)) return { i, s: 1 };
      if (n.includes(q)) return { i, s: 2 };
      const d = lev(q, n);
      if (d <= Math.max(2, Math.floor(q.length / 3))) return { i, s: 3 + d };
      return null;
    })
    .filter((x): x is { i: MenuItemLite; s: number } => x !== null)
    .sort((a, b) => a.s - b.s)
    .slice(0, limit);
  return scored.map(x => x.i);
}
