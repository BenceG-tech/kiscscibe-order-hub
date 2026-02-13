import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, getDay, isToday } from "date-fns";
import { hu } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  const [weekOffset, setWeekOffset] = useState(0);

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

  const getDayLabel = (date: Date) => {
    const dayNames = ['Hétfő', 'Kedd', 'Szerda', 'Csüt.', 'Péntek'];
    const dayIndex = getDay(date) - 1;
    return dayNames[dayIndex] || '';
  };

  return (
    <div className="bg-card/90 backdrop-blur-sm shadow-xl rounded-2xl p-4 md:p-5 border border-border/40">
      {/* Month label */}
      <div className="text-center text-sm md:text-base font-semibold text-muted-foreground mb-4 capitalize">
        {monthLabel}
      </div>
      
      <div className="flex items-center justify-center gap-2 md:gap-3">
        {/* Previous week */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setWeekOffset(w => w - 1)}
          className="h-10 w-10 rounded-full hover:bg-muted shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        {/* Days */}
        <div className="flex gap-1.5 md:gap-2">
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
                  "relative flex flex-col items-center justify-center p-2 md:p-3 rounded-xl transition-all duration-300 min-w-[56px] md:min-w-[72px]",
                  isSelected 
                    ? "bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-xl shadow-primary/40 scale-110 ring-2 ring-primary/60 animate-glow-pulse"
                    : hasContent
                      ? "bg-primary/15 hover:bg-primary/25 hover:scale-105"
                      : "hover:bg-muted/80",
                  disabled && "opacity-40 cursor-not-allowed",
                  isTodayDate && !isSelected && "ring-2 ring-primary/50"
                )}
              >
                {/* "MA" badge for today */}
                {isTodayDate && (
                  <span className={cn(
                    "absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] md:text-[10px] font-black px-1.5 py-0.5 rounded-full",
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
                  "text-xl md:text-2xl font-bold leading-tight",
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
          onClick={() => setWeekOffset(w => w + 1)}
          className="h-10 w-10 rounded-full hover:bg-muted shrink-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default WeeklyDateStrip;
