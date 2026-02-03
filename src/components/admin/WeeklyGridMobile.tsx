import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronLeft, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { WeeklyGridCell } from "./WeeklyGridCell";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  price_huf: number;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  sort: number;
}

interface SelectedItem {
  itemId: string;
  itemName: string;
  offerId: string;
  offerItemId: string;
}

interface WeeklyGridMobileProps {
  weekDates: Date[];
  categories: Category[];
  itemsByCategory: Record<string, MenuItem[]>;
  gridData: Record<string, Record<string, SelectedItem>>;
  categoryColors: Record<string, string>;
  onSelectItem: (date: string, categoryId: string, itemId: string) => void;
  onRemoveItem: (offerItemId: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  isCurrentWeek: boolean;
  isLoading: boolean;
}

const WEEKDAYS = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

export function WeeklyGridMobile({
  weekDates,
  categories,
  itemsByCategory,
  gridData,
  categoryColors,
  onSelectItem,
  onRemoveItem,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  isCurrentWeek,
  isLoading,
}: WeeklyGridMobileProps) {
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({ 0: true });

  const toggleDay = (index: number) => {
    setOpenDays(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={onNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isCurrentWeek && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onCurrentWeek}>
              Ma
            </Button>
          )}
        </div>
        
        <div className="text-xs font-medium text-muted-foreground text-right">
          {format(weekDates[0], "MM.dd.", { locale: hu })} – {format(weekDates[4], "MM.dd.", { locale: hu })}
        </div>
        
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Day Accordions */}
      <div className="space-y-2">
        {weekDates.map((date, dayIdx) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const dayData = gridData[dateStr] || {};
          const itemCount = Object.keys(dayData).length;
          
          return (
            <Collapsible
              key={dayIdx}
              open={openDays[dayIdx]}
              onOpenChange={() => toggleDay(dayIdx)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-12 px-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{WEEKDAYS[dayIdx]}</span>
                    <span className="text-sm text-muted-foreground">
                      {format(date, "MM.dd.")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {itemCount > 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {itemCount} étel
                      </span>
                    )}
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      openDays[dayIdx] && "rotate-180"
                    )} />
                  </div>
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pt-2">
                <div className="space-y-2 pl-2 border-l-2 border-muted ml-2">
                  {categories.map(category => {
                    const cellData = dayData[category.id];
                    const categoryItems = itemsByCategory[category.id] || [];
                    const rowColor = categoryColors[category.name] || "";
                    
                    return (
                      <div
                        key={category.id}
                        className={cn("p-2 rounded-lg", rowColor || "bg-muted/30")}
                      >
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          {category.name}
                        </div>
                        <WeeklyGridCell
                          date={dateStr}
                          categoryId={category.id}
                          categoryName={category.name}
                          items={categoryItems}
                          selectedItem={cellData}
                          onSelect={(itemId) => onSelectItem(dateStr, category.id, itemId)}
                          onRemove={() => cellData && onRemoveItem(cellData.offerItemId)}
                        />
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
