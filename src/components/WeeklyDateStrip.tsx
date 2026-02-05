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

  // Get the Monday of the current week view
  const getWeekDays = (offset: number): Date[] => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
    const offsetWeekStart = addDays(weekStart, offset * 7);
    
    // Get Mon-Fri only (5 days)
    return Array.from({ length: 5 }, (_, i) => addDays(offsetWeekStart, i));
  };

  const weekDays = getWeekDays(weekOffset);
  
  // Get month/year from middle of the week for display
  const weekMiddle = weekDays[2];
  const monthLabel = format(weekMiddle, 'MMMM yyyy', { locale: hu });

  const hasContentOnDate = (date: Date) => {
    return availableDates.some(availableDate => 
      format(availableDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getDayLabel = (date: Date) => {
    const dayNames = ['H', 'K', 'Sze', 'Cs', 'P'];
    const dayIndex = getDay(date) - 1; // Monday = 0
    return dayNames[dayIndex] || '';
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm shadow-lg rounded-2xl p-3 md:p-4 border border-border/30">
      {/* Month label */}
      <div className="text-center text-xs md:text-sm font-medium text-muted-foreground mb-3 capitalize">
        {monthLabel}
      </div>
      
      <div className="flex items-center justify-center gap-1.5 md:gap-2">
        {/* Previous week button */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setWeekOffset(w => w - 1)}
          className="h-8 w-8 md:h-9 md:w-9 rounded-full hover:bg-muted shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* Days */}
        <div className="flex gap-1 md:gap-1.5">
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
                  "relative flex flex-col items-center justify-center p-1.5 md:p-2.5 rounded-xl transition-all duration-300 min-w-[46px] md:min-w-[56px]",
                  isSelected 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/50"
                    : hasContent
                      ? "bg-primary/10 hover:bg-primary/20 hover:scale-102"
                      : "hover:bg-muted/80",
                  disabled && "opacity-40 cursor-not-allowed",
                  isTodayDate && !isSelected && "ring-1 ring-primary/40"
                )}
              >
                <span className={cn(
                  "text-[10px] md:text-xs font-semibold uppercase tracking-wide",
                  isSelected ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {getDayLabel(day)}
                </span>
                <span className={cn(
                  "text-lg md:text-xl font-bold leading-tight",
                  isSelected ? "text-primary-foreground" : "text-foreground",
                  disabled && "line-through"
                )}>
                  {format(day, 'd')}
                </span>
                {/* Dot indicator for available content */}
                {hasContent && !isSelected && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                )}
                {/* Today indicator */}
                {isTodayDate && !isSelected && (
                  <span className="absolute -top-1 -right-1 text-[8px] font-bold text-primary">●</span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Next week button */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setWeekOffset(w => w + 1)}
          className="h-8 w-8 md:h-9 md:w-9 rounded-full hover:bg-muted shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default WeeklyDateStrip;
