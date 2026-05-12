import { addDays, getDay, setHours, setMinutes, setSeconds, setMilliseconds, startOfWeek, addWeeks, differenceInCalendarWeeks } from "date-fns";

/**
 * Get the smart week start for admin views.
 * After Friday 16:00 (admin closing), returns next week's Monday.
 * On Saturday/Sunday, returns next Monday.
 * Otherwise returns current week's Monday.
 */
export const getSmartWeekStart = (): Date => {
  const now = new Date();
  const currentDay = getDay(now);
  const currentWeekMonday = startOfWeek(now, { weekStartsOn: 1 });

  // Sunday
  if (currentDay === 0) {
    return addWeeks(currentWeekMonday, 1);
  }

  // Saturday
  if (currentDay === 6) {
    return addWeeks(currentWeekMonday, 1);
  }

  // Friday after 16:00
  if (currentDay === 5) {
    const fridayCutoff = setMilliseconds(setSeconds(setMinutes(setHours(now, 16), 0), 0), 0);
    if (now >= fridayCutoff) {
      return addWeeks(currentWeekMonday, 1);
    }
  }

  return currentWeekMonday;
};

/**
 * Returns the index (0-4) of the day that should be open by default
 * in the mobile weekly grid. Picks today if the week contains today and
 * it's before 16:00; otherwise the next weekday in the visible week.
 * Falls back to 0 (Monday) if none match (past/future weeks).
 */
export const getSmartInitialDayIndex = (weekDates: Date[]): number => {
  if (!weekDates?.length) return 0;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const afterCutoff = now.getHours() >= 16;

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const todayIdx = weekDates.findIndex((d) => fmt(d) === todayStr);

  if (todayIdx !== -1) {
    if (!afterCutoff) return todayIdx;
    // After cutoff -> next weekday in this week, otherwise stay on today
    return todayIdx < weekDates.length - 1 ? todayIdx + 1 : todayIdx;
  }

  // Week is in past or future: find first day >= today
  const nextIdx = weekDates.findIndex((d) => fmt(d) >= todayStr);
  return nextIdx === -1 ? 0 : nextIdx;
};

// ... keep existing code (getSmartInitialDate, isAfterClosingHours, getNextBusinessDay, shouldShowTomorrowContent, getContentLabel)

/**
 * Get the appropriate initial date for calendar display based on current time and business hours
 */
export const getSmartInitialDate = (): Date => {
  const now = new Date();
  const currentDay = getDay(now);
  
  // Sunday (0) - always show Monday
  if (currentDay === 0) {
    return addDays(now, 1);
  }
  
  // Saturday (6) - check if after 14:00, then show Monday
  if (currentDay === 6) {
    const saturdayClosing = setMilliseconds(setSeconds(setMinutes(setHours(now, 14), 0), 0), 0);
    if (now >= saturdayClosing) {
      return addDays(now, 2); // Skip Sunday, show Monday
    }
    return now;
  }
  
  // Weekdays (Monday-Friday) - check if after 15:00
  const weekdayClosing = setMilliseconds(setSeconds(setMinutes(setHours(now, 15), 0), 0), 0);
  if (now >= weekdayClosing) {
    // If it's Friday after 15:00, show Monday
    if (currentDay === 5) {
      return addDays(now, 3);
    }
    // Otherwise show tomorrow
    return addDays(now, 1);
  }
  
  return now;
};

/**
 * Check if current time is after business closing hours
 */
export const isAfterClosingHours = (): boolean => {
  const now = new Date();
  const currentDay = getDay(now);
  
  // Sunday - always after hours
  if (currentDay === 0) {
    return true;
  }
  
  // Saturday - after 14:00
  if (currentDay === 6) {
    const saturdayClosing = setMilliseconds(setSeconds(setMinutes(setHours(now, 14), 0), 0), 0);
    return now >= saturdayClosing;
  }
  
  // Weekdays - after 15:00
  const weekdayClosing = setMilliseconds(setSeconds(setMinutes(setHours(now, 15), 0), 0), 0);
  return now >= weekdayClosing;
};

/**
 * Get the next available business day
 */
export const getNextBusinessDay = (fromDate: Date = new Date()): Date => {
  const currentDay = getDay(fromDate);
  
  // If it's Friday, Saturday, or Sunday, return next Monday
  if (currentDay === 5 || currentDay === 6 || currentDay === 0) {
    const daysToAdd = currentDay === 5 ? 3 : currentDay === 6 ? 2 : 1;
    return addDays(fromDate, daysToAdd);
  }
  
  // Otherwise return next day
  return addDays(fromDate, 1);
};

/**
 * Check if we should show "tomorrow's" content instead of "today's"
 */
export const shouldShowTomorrowContent = (): boolean => {
  return isAfterClosingHours();
};

/**
 * Get appropriate label for the current content being shown
 */
export const getContentLabel = (selectedDate: Date): { title: string; isAdvanced: boolean } => {
  const now = new Date();
  const isToday = selectedDate.toDateString() === now.toDateString();
  const isTomorrow = selectedDate.toDateString() === addDays(now, 1).toDateString();
  const isAfterHours = isAfterClosingHours();
  
  if (isToday && !isAfterHours) {
    return { title: "Mai ajánlatok", isAdvanced: false };
  }
  
  if (isTomorrow && isAfterHours) {
    return { title: "Holnapi ajánlatok", isAdvanced: true };
  }
  
  if (isToday && isAfterHours) {
    return { title: "Mai ajánlatok", isAdvanced: false };
  }
  
  return { title: "Napi ajánlatok", isAdvanced: false };
};

/**
 * Calculate the week offset between selectedDate and today (Monday-based weeks)
 */
export const getWeekOffset = (selectedDate: Date): number => {
  const today = new Date();
  const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  return differenceInCalendarWeeks(selectedWeekStart, todayWeekStart, { weekStartsOn: 1 });
};
