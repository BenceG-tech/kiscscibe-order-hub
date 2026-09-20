/**
 * Pure helpers for pickup-day rules. The restaurant is closed on weekends,
 * so neither Saturday (6) nor Sunday (0) may ever be offered as a pickup day.
 */

/** Timezone-safe YYYY-MM-DD parsing (avoids UTC offset bugs). */
export const makeDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const toDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** True for Saturday and Sunday — the restaurant is closed. */
export const isClosedDay = (dateStr: string): boolean => {
  const dow = makeDate(dateStr).getDay();
  return dow === 0 || dow === 6;
};

/** The next `count` open weekdays, starting the day after `from`. */
export const nextBusinessDates = (from: Date, count = 5, maxLookahead = 14): string[] => {
  const dates: string[] = [];
  const cursor = new Date(from);
  cursor.setDate(cursor.getDate() + 1);
  let guard = maxLookahead;
  while (dates.length < count && guard > 0) {
    const dateStr = toDateStr(cursor);
    if (!isClosedDay(dateStr)) dates.push(dateStr);
    cursor.setDate(cursor.getDate() + 1);
    guard--;
  }
  return dates;
};
