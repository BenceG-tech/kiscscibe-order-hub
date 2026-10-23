// Pure pickup-window rules for submit-order (no Deno/Supabase deps; unit-testable).
// Mon–Fri only, weekends closed.
//   Breakfast-only cart pickup window: 07:00 – 16:00
//   Lunch / mixed cart pickup window:  10:30 – 16:00
//   Same-day order cutoff:             11:00 Budapest time (all carts)
export const BREAKFAST_START_MIN = 7 * 60;
export const BREAKFAST_END_MIN = 16 * 60;
export const LUNCH_START_MIN = 10 * 60 + 30;
export const LUNCH_END_MIN = 16 * 60;
export const TODAY_ORDER_CUTOFF_MIN = 11 * 60;
export const BREAKFAST_CATEGORY_NAME = "Reggeli";

export function dayOfWeekFromDateStr(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function toMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function isWithinPickupWindow(dateStr: string, timeStr: string, isBreakfastOnly: boolean): boolean {
  const dow = dayOfWeekFromDateStr(dateStr);
  if (dow === 0 || dow === 6) return false;
  const mins = toMinutes(timeStr);
  if (isBreakfastOnly) return mins >= BREAKFAST_START_MIN && mins <= BREAKFAST_END_MIN;
  return mins >= LUNCH_START_MIN && mins <= LUNCH_END_MIN;
}

/** Trusted: only server-derived is_breakfast flags count. */
export function isBreakfastOnlyCart(validatedItems: Array<{ is_breakfast?: boolean }>): boolean {
  return validatedItems.length > 0 && validatedItems.every((it) => it.is_breakfast === true);
}

export function pickupWindowLabel(isBreakfastOnly: boolean): string {
  return isBreakfastOnly ? "07:00 – 16:00 (reggeli)" : "10:30 – 16:00 (ebéd)";
}

export type ScheduledCheck = { ok: true } | { ok: false; code: "weekend" | "window" | "cutoff"; message: string };

export const CUTOFF_MESSAGE =
  "A mai napra az online rendelés 11:00-ig volt lehetséges. Kérjük, válasszon későbbi napot, vagy rendeljen személyesen a pultnál.";

/** Validates a scheduled pickup regardless of whether a capacity slot exists. */
export function checkScheduledPickup(
  date: string,
  time: string,
  isBreakfastOnly: boolean,
  nowBudapest: { date: string; time: string },
): ScheduledCheck {
  const dow = dayOfWeekFromDateStr(date);
  if (dow === 0 || dow === 6) return { ok: false, code: "weekend", message: "Hétvégén zárva tartunk" };
  if (!isWithinPickupWindow(date, time, isBreakfastOnly)) {
    return {
      ok: false,
      code: "window",
      message: `A kiválasztott időpont nyitvatartási időn kívül esik (${pickupWindowLabel(isBreakfastOnly)})`,
    };
  }
  if (date === nowBudapest.date && toMinutes(nowBudapest.time) >= TODAY_ORDER_CUTOFF_MIN) {
    return { ok: false, code: "cutoff", message: CUTOFF_MESSAGE };
  }
  return { ok: true };
}
