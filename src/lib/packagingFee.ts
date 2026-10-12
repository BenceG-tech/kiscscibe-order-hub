import { normalizeText } from "./utils";

/**
 * Elviteles csomagolási (doboz) díj számítása.
 *
 * Szabályok (2026-10, tulajdonosi döntés):
 * - Főétel: 150 Ft / adag (napi főételek, fix étlap főételei, reggelik).
 * - Elviteles menü (leves + főétel): 200 Ft / menü.
 * - Saláta, savanyúság, leves, ital, desszert, köret: 0 Ft (árukban benne van).
 */

export interface PackagingFees {
  main_huf: number;
  menu_huf: number;
}

export const DEFAULT_PACKAGING_FEES: PackagingFees = {
  main_huf: 150,
  menu_huf: 200,
};

export type PackagingKind = "main" | "none";

export interface PackagingCartItemLike {
  quantity: number;
  daily_type?: "offer" | "menu" | "complete_menu";
  packaging?: PackagingKind;
}

// Kategóriák, amelyek dobozban kerülnek kiadásra (fizetős).
const BOXED_CATEGORY_PATTERNS = ["foetel", "teszta", "fozelek"];
// Kategóriák, amelyeknél a doboz az árban van (ingyenes).
const FREE_CATEGORY_PATTERNS = ["salata", "savanyu", "leves", "ital", "desszert", "koret", "reggeli"];

/**
 * Fix étlap kategórianév alapján dönti el, kell-e dobozdíj.
 * Defenzív: ismeretlen kategória → false (nem számítunk díjat tévesen).
 */
export function categoryNeedsBox(categoryName?: string | null): boolean {
  if (!categoryName) return false;
  const n = normalizeText(categoryName);
  if (FREE_CATEGORY_PATTERNS.some((p) => n.includes(p))) return false;
  return BOXED_CATEGORY_PATTERNS.some((p) => n.includes(p));
}

/** Napi ajánlat tétel menu_role mezője alapján ('főétel' → fizetős doboz). */
export function packagingKindForMenuRole(menuRole?: string | null): PackagingKind {
  return normalizeText(menuRole || "") === "foetel" ? "main" : "none";
}

/** A teljes kosárra számított dobozdíj (Ft). */
export function computePackagingFee(
  items: PackagingCartItemLike[],
  fees: PackagingFees = DEFAULT_PACKAGING_FEES
): number {
  return items.reduce((sum, item) => {
    if (item.daily_type === "complete_menu") return sum + fees.menu_huf * item.quantity;
    if (item.packaging === "main") return sum + fees.main_huf * item.quantity;
    return sum;
  }, 0);
}
