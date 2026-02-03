import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { hu } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { WeeklyGridCell } from "./WeeklyGridCell";
import { WeeklyGridMobile } from "./WeeklyGridMobile";

// Category color mapping based on Excel design
const CATEGORY_COLORS: Record<string, string> = {
  "Levesek": "bg-yellow-50 dark:bg-yellow-950/30",
  "Tészta ételek": "bg-orange-50 dark:bg-orange-950/30",
  "Főzelékek": "bg-green-50 dark:bg-green-950/30",
  "Prémium ételek": "bg-amber-100 dark:bg-amber-950/40",
  "Halételek": "bg-blue-50 dark:bg-blue-950/30",
  "Marhahúsos ételek": "bg-red-50 dark:bg-red-950/30",
};

const WEEKDAYS = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

interface MenuItem {
  id: string;
  name: string;
  category_id: string | null;
  price_huf: number;
}

interface Category {
  id: string;
  name: string;
  sort: number;
}

interface DailyOfferItem {
  id: string;
  daily_offer_id: string | null;
  item_id: string | null;
  menu_items: MenuItem | null;
}

interface DailyOffer {
  id: string;
  date: string;
  daily_offer_items: DailyOfferItem[];
}

export default function WeeklyMenuGrid() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Generate week dates (Mon-Fri)
  const weekDates = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["menu-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_categories")
        .select("id, name, sort")
        .order("sort", { ascending: true });
      
      if (error) throw error;
      return data as Category[];
    },
  });

  // Filter out non-food categories
  const foodCategories = useMemo(() => {
    return categories.filter(c => 
      !["Italok", "Egyéb"].includes(c.name)
    );
  }, [categories]);

  // Fetch menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: ["menu-items-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, category_id, price_huf")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as MenuItem[];
    },
  });

  // Group menu items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    menuItems.forEach(item => {
      if (item.category_id) {
        if (!grouped[item.category_id]) {
          grouped[item.category_id] = [];
        }
        grouped[item.category_id].push(item);
      }
    });
    return grouped;
  }, [menuItems]);

  // Fetch daily offers for the week
  const { data: dailyOffers = [], isLoading: offersLoading } = useQuery({
    queryKey: ["daily-offers-week", format(currentWeekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const startDate = format(currentWeekStart, "yyyy-MM-dd");
      const endDate = format(addDays(currentWeekStart, 4), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("daily_offers")
        .select(`
          id,
          date,
          daily_offer_items (
            id,
            daily_offer_id,
            item_id,
            menu_items (
              id,
              name,
              category_id,
              price_huf
            )
          )
        `)
        .gte("date", startDate)
        .lte("date", endDate);
      
      if (error) throw error;
      return data as DailyOffer[];
    },
  });

  // Build a lookup: date -> category_id -> item
  const gridData = useMemo(() => {
    const lookup: Record<string, Record<string, { itemId: string; itemName: string; offerId: string; offerItemId: string }>> = {};
    
    dailyOffers.forEach(offer => {
      if (!lookup[offer.date]) {
        lookup[offer.date] = {};
      }
      
      offer.daily_offer_items?.forEach(item => {
        if (item.menu_items && item.menu_items.category_id) {
          lookup[offer.date][item.menu_items.category_id] = {
            itemId: item.menu_items.id,
            itemName: item.menu_items.name,
            offerId: offer.id,
            offerItemId: item.id,
          };
        }
      });
    });
    
    return lookup;
  }, [dailyOffers]);

  // Mutation to add item
  const addItemMutation = useMutation({
    mutationFn: async ({ date, itemId }: { date: string; itemId: string }) => {
      // Check if daily_offer exists for this date
      let offerId: string;
      
      const existingOffer = dailyOffers.find(o => o.date === date);
      
      if (existingOffer) {
        offerId = existingOffer.id;
      } else {
        // Create new daily_offer
        const { data: newOffer, error: offerError } = await supabase
          .from("daily_offers")
          .insert({ date })
          .select("id")
          .single();
        
        if (offerError) throw offerError;
        offerId = newOffer.id;
      }
      
      // Add the item
      const { error } = await supabase
        .from("daily_offer_items")
        .insert({
          daily_offer_id: offerId,
          item_id: itemId,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-offers-week"] });
      toast.success("Étel hozzáadva");
    },
    onError: (error) => {
      console.error("Error adding item:", error);
      toast.error("Hiba történt az étel hozzáadásakor");
    },
  });

  // Mutation to remove item
  const removeItemMutation = useMutation({
    mutationFn: async ({ offerItemId }: { offerItemId: string }) => {
      const { error } = await supabase
        .from("daily_offer_items")
        .delete()
        .eq("id", offerItemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-offers-week"] });
      toast.success("Étel eltávolítva");
    },
    onError: (error) => {
      console.error("Error removing item:", error);
      toast.error("Hiba történt az étel eltávolításakor");
    },
  });

  // Mutation to replace item (remove old, add new)
  const replaceItemMutation = useMutation({
    mutationFn: async ({ date, itemId, oldOfferItemId }: { date: string; itemId: string; oldOfferItemId?: string }) => {
      // If there's an old item, remove it first
      if (oldOfferItemId) {
        const { error: deleteError } = await supabase
          .from("daily_offer_items")
          .delete()
          .eq("id", oldOfferItemId);
        
        if (deleteError) throw deleteError;
      }
      
      // Now add the new item
      let offerId: string;
      const existingOffer = dailyOffers.find(o => o.date === date);
      
      if (existingOffer) {
        offerId = existingOffer.id;
      } else {
        const { data: newOffer, error: offerError } = await supabase
          .from("daily_offers")
          .insert({ date })
          .select("id")
          .single();
        
        if (offerError) throw offerError;
        offerId = newOffer.id;
      }
      
      const { error } = await supabase
        .from("daily_offer_items")
        .insert({
          daily_offer_id: offerId,
          item_id: itemId,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-offers-week"] });
      toast.success("Étel módosítva");
    },
    onError: (error) => {
      console.error("Error replacing item:", error);
      toast.error("Hiba történt az étel módosításakor");
    },
  });

  const handleSelectItem = (date: string | Date, categoryId: string, itemId: string) => {
    const dateStr = typeof date === 'string' ? date : format(date, "yyyy-MM-dd");
    const existingItem = gridData[dateStr]?.[categoryId];
    
    if (existingItem) {
      replaceItemMutation.mutate({ 
        date: dateStr, 
        itemId, 
        oldOfferItemId: existingItem.offerItemId 
      });
    } else {
      addItemMutation.mutate({ date: dateStr, itemId });
    }
  };

  const handleRemoveItem = (offerItemId: string) => {
    removeItemMutation.mutate({ offerItemId });
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const isCurrentWeek = format(currentWeekStart, "yyyy-MM-dd") === 
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const isLoading = offersLoading || addItemMutation.isPending || 
    removeItemMutation.isPending || replaceItemMutation.isPending;

  if (isMobile) {
    return (
      <WeeklyGridMobile
        weekDates={weekDates}
        categories={foodCategories}
        itemsByCategory={itemsByCategory}
        gridData={gridData}
        categoryColors={CATEGORY_COLORS}
        onSelectItem={handleSelectItem}
        onRemoveItem={handleRemoveItem}
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onCurrentWeek={goToCurrentWeek}
        isCurrentWeek={isCurrentWeek}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isCurrentWeek && (
            <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
              Ma
            </Button>
          )}
        </div>
        
        <div className="text-sm font-medium text-muted-foreground">
          {format(currentWeekStart, "yyyy. MMMM d.", { locale: hu })} – {format(addDays(currentWeekStart, 4), "MMMM d.", { locale: hu })}
        </div>
        
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Grid Table */}
      <ScrollArea className="w-full rounded-lg border">
        <div className="min-w-[900px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="border-b p-3 text-left font-medium text-sm w-48">
                  Kategória
                </th>
                {weekDates.map((date, idx) => (
                  <th key={idx} className="border-b border-l p-3 text-center font-medium text-sm min-w-[140px]">
                    <div>{WEEKDAYS[idx]}</div>
                    <div className="text-xs text-muted-foreground font-normal">
                      {format(date, "MM.dd.")}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {foodCategories.map(category => {
                const rowColor = CATEGORY_COLORS[category.name] || "";
                
                return (
                  <tr key={category.id} className={rowColor}>
                    <td className="border-b p-3 font-medium text-sm">
                      {category.name}
                    </td>
                    {weekDates.map((date, idx) => {
                      const dateStr = format(date, "yyyy-MM-dd");
                      const cellData = gridData[dateStr]?.[category.id];
                      const categoryItems = itemsByCategory[category.id] || [];
                      
                      return (
                        <td key={idx} className="border-b border-l p-2">
                          <WeeklyGridCell
                            date={dateStr}
                            categoryId={category.id}
                            categoryName={category.name}
                            items={categoryItems}
                            selectedItem={cellData}
                            onSelect={(itemId) => handleSelectItem(dateStr, category.id, itemId)}
                            onRemove={() => cellData && handleRemoveItem(cellData.offerItemId)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
