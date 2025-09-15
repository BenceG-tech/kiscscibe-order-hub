import { addDays, getDay, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";

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
