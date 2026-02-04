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
  const currentMonth = format(weekDays[2], 'MMMM yyyy', { locale: hu }); // Middle of week for month display

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
    <div className="w-full">
      {/* Month label */}
      <div className="text-center mb-4">
        <span className="text-lg font-sofia font-semibold text-foreground capitalize">
          {currentMonth}
        </span>
      </div>

      {/* Week navigation strip */}
      <div className="flex items-center justify-center gap-2 md:gap-4">
        {/* Previous week button */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setWeekOffset(w => w - 1)}
          className="h-10 w-10 rounded-full hover:bg-muted shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        {/* Days */}
        <div className="flex gap-1 md:gap-2 overflow-x-auto no-scrollbar">
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
                  "flex flex-col items-center justify-center p-2 md:p-3 rounded-2xl transition-all duration-200 min-w-[52px] md:min-w-[60px]",
                  isSelected 
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : hasContent
                      ? "bg-primary/10 hover:bg-primary/20"
                      : "hover:bg-muted",
                  disabled && "opacity-40 cursor-not-allowed line-through"
                )}
              >
                <span className={cn(
                  "text-xs font-medium uppercase",
                  isSelected ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                  {getDayLabel(day)}
                </span>
                <span className={cn(
                  "text-xl md:text-2xl font-bold",
                  isSelected ? "text-primary-foreground" : "text-foreground"
                )}>
                  {format(day, 'd')}
                </span>
                {/* Dot indicator for available content */}
                {hasContent && !isSelected && (
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1" />
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
          className="h-10 w-10 rounded-full hover:bg-muted shrink-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-primary rounded-full" />
          <span>Elérhető</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
          <span>Zárva</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyDateStrip;
