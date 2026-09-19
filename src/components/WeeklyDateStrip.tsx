import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, getDay, isToday, isBefore, startOfDay } from "date-fns";
import { hu } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getWeekOffset } from "@/lib/dateUtils";
import { useIsMobile } from "@/hooks/use-mobile";

interface WeeklyDateStripProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  availableDates: Date[];
  isDateDisabled?: (date: Date) => boolean;
}

const WeeklyDateStrip = ({ 
  selectedDate, 
  onSelect, 
  availableDates,
  isDateDisabled 
}: WeeklyDateStripProps) => {
  const initialOffset = getWeekOffset(selectedDate);
  const [weekOffset, setWeekOffset] = useState(initialOffset);
  const isMobile = useIsMobile();

  // Sync weekOffset when selectedDate changes externally
  useEffect(() => {
    const needed = getWeekOffset(selectedDate);
    setWeekOffset(needed);
  }, [selectedDate]);

  const getWeekDays = (offset: number): Date[] => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const offsetWeekStart = addDays(weekStart, offset * 7);
    return Array.from({ length: 5 }, (_, i) => addDays(offsetWeekStart, i));
  };

  const weekDays = getWeekDays(weekOffset);
  const weekMiddle = weekDays[2];
  const monthLabel = format(weekMiddle, 'MMMM yyyy', { locale: hu });

  const hasContentOnDate = (date: Date) => {
    return availableDates.some(availableDate => 
      format(availableDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  // Check if all days in current view are in the past
  const now = new Date();
  const allDaysPast = weekDays.every(day => isBefore(startOfDay(addDays(day, 1)), startOfDay(now)));

  const getDayLabel = (date: Date) => {
    if (isMobile) {
      const shortNames = ['H', 'K', 'SZE', 'CS', 'P'];
      const dayIndex = getDay(date) - 1;
      return shortNames[dayIndex] || '';
    }
    const dayNames = ['Hétfő', 'Kedd', 'Szerda', 'Csüt.', 'Péntek'];
    const dayIndex = getDay(date) - 1;
    return dayNames[dayIndex] || '';
  };

  const handleNextWeek = () => {
    setWeekOffset(w => w + 1);
    // Auto-select Monday of next week
    const nextWeekDays = getWeekDays(weekOffset + 1);
    onSelect(nextWeekDays[0]);
  };

  return (
    <div className="soft-panel p-3 md:p-5">
      {/* Month label */}
      <div className="text-center text-sm md:text-base font-semibold text-muted-foreground mb-3 md:mb-4 capitalize">
        {monthLabel}
      </div>
      
      <div className="flex items-center justify-center gap-1 md:gap-3">
        {/* Previous week */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setWeekOffset(w => w - 1)}
          className="h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-muted shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        {/* Days */}
        <div className="flex gap-1.5 md:gap-2.5">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const hasContent = hasContentOnDate(day);
            const disabled = isDateDisabled?.(day) ?? false;
            const isTodayDate = isToday(day);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => !disabled && onSelect(day)}
                disabled={disabled}
                className={cn(
                   "relative flex min-h-[58px] min-w-[48px] flex-col items-center justify-center rounded-xl border border-transparent p-1.5 transition-[transform,box-shadow,background-color,border-color] duration-300 ease-out md:min-h-[72px] md:min-w-[72px] md:p-3",
                  isSelected 
                     ? "-translate-y-1 border-primary bg-primary text-primary-foreground shadow-warm ring-1 ring-primary/60"
                    : hasContent
                      ? "border-primary/15 bg-primary/10 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/20 hover:shadow-soft"
                      : "bg-background/25 hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted/70",
                  disabled && "opacity-40 cursor-not-allowed",
                  isTodayDate && !isSelected && "ring-2 ring-primary/50"
                )}
              >
                {/* "MA" badge for today */}
                {isTodayDate && (
                  <span className={cn(
                     "absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-black shadow-sm md:text-[10px]",
                    isSelected 
                      ? "bg-primary-foreground text-primary" 
                      : "bg-primary text-primary-foreground"
                  )}>
                    MA
                  </span>
                )}
                <span className={cn(
                  "text-[10px] md:text-xs font-bold uppercase tracking-wide",
                  isSelected ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {getDayLabel(day)}
                </span>
                <span className={cn(
                  "text-lg md:text-2xl font-bold leading-tight",
                  isSelected ? "text-primary-foreground" : "text-foreground",
                  disabled && "line-through"
                )}>
                  {format(day, 'd')}
                </span>
                {/* Content indicator */}
                {hasContent && !isSelected && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <div className="w-1.5 h-1.5 bg-primary/50 rounded-full" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Next week */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleNextWeek}
          className={cn(
            "h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-muted shrink-0",
            allDaysPast && "animate-pulse bg-primary/20 text-primary hover:bg-primary/30"
          )}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* "Week is over" banner */}
      {allDaysPast && (
        <button
          onClick={handleNextWeek}
           className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/20 hover:shadow-soft"
        >
          <span>Ez a hét lezárult — nézd a következő hetet!</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default WeeklyDateStrip;
