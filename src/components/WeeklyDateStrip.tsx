import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, getDay } from "date-fns";
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
    <div className="flex items-center justify-center gap-2 md:gap-3">
      {/* Previous week button */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setWeekOffset(w => w - 1)}
        className="h-9 w-9 rounded-full hover:bg-muted shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* Days - compact inline */}
      <div className="flex gap-1 md:gap-2">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const hasContent = hasContentOnDate(day);
          const disabled = isDateDisabled?.(day) ?? false;
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => !disabled && onSelect(day)}
              disabled={disabled}
              className={cn(
                "flex flex-col items-center justify-center p-1.5 md:p-2 rounded-xl transition-all duration-200 min-w-[44px] md:min-w-[52px]",
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-lg scale-105"
                  : hasContent
                    ? "bg-primary/10 hover:bg-primary/20"
                    : "hover:bg-muted",
                disabled && "opacity-40 cursor-not-allowed line-through"
              )}
            >
              <span className={cn(
                "text-[10px] md:text-xs font-medium uppercase",
                isSelected ? "text-primary-foreground" : "text-muted-foreground"
              )}>
                {getDayLabel(day)}
              </span>
              <span className={cn(
                "text-lg md:text-xl font-bold",
                isSelected ? "text-primary-foreground" : "text-foreground"
              )}>
                {format(day, 'd')}
              </span>
              {/* Dot indicator for available content */}
              {hasContent && !isSelected && (
                <div className="w-1 h-1 bg-primary rounded-full mt-0.5" />
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
        className="h-9 w-9 rounded-full hover:bg-muted shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default WeeklyDateStrip;
