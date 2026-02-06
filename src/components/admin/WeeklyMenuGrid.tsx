import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { hu } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Loader2, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { WeeklyGridCell } from "./WeeklyGridCell";
import { WeeklyGridMobile } from "./WeeklyGridMobile";
import { DailyPriceInput } from "./DailyPriceInput";
import * as XLSX from "xlsx";

// Category color mapping based on Excel design
const CATEGORY_COLORS: Record<string, string> = {
  "Levesek": "bg-yellow-50 dark:bg-yellow-950/30",
  "Tészta ételek": "bg-orange-50 dark:bg-orange-950/30",
  "Főzelékek": "bg-green-50 dark:bg-green-950/30",
  "Prémium ételek": "bg-amber-100 dark:bg-amber-950/40",
  "Halételek": "bg-blue-50 dark:bg-blue-950/30",
  "Marhahúsos ételek": "bg-red-50 dark:bg-red-950/30",
  "Rantott ételek": "bg-orange-100 dark:bg-orange-950/40",
  "Desszertek": "bg-pink-50 dark:bg-pink-950/30",
  "Csirke-zöldséges ételek": "bg-lime-50 dark:bg-lime-950/30",
  "Csirkemájas ételek": "bg-amber-50 dark:bg-amber-950/30",
  "Extra köretek": "bg-teal-50 dark:bg-teal-950/30",
  "Hagyományos köretek": "bg-cyan-50 dark:bg-cyan-950/30",
  "Egytálételek": "bg-indigo-50 dark:bg-indigo-950/30",
  "Saláták": "bg-emerald-50 dark:bg-emerald-950/30",
  "Főételek": "bg-violet-50 dark:bg-violet-950/30",
};

const WEEKDAYS = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

interface MenuItem {
  id: string;
  name: string;
  category_id: string | null;
  price_huf: number;
  image_url?: string | null;
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
  is_menu_part: boolean;
  menu_role: string | null;
  menu_items: MenuItem | null;
}

interface DailyOffer {
  id: string;
  date: string;
  price_huf: number | null;
  daily_offer_items: DailyOfferItem[];
}

interface SelectedItem {
  itemId: string;
  itemName: string;
  offerId: string;
  offerItemId: string;
  imageUrl?: string | null;
  price?: number;
  isMenuPart: boolean;
  menuRole?: string | null;
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
        .select("id, name, category_id, price_huf, image_url")
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
          price_huf,
          daily_offer_items (
            id,
            daily_offer_id,
            item_id,
            is_menu_part,
            menu_role,
            menu_items (
              id,
              name,
              category_id,
              price_huf,
              image_url
            )
          )
        `)
        .gte("date", startDate)
        .lte("date", endDate);
      
      if (error) throw error;
      return data as DailyOffer[];
    },
  });

  // Build a lookup: date -> category_id -> items array
  const gridData = useMemo(() => {
    const lookup: Record<string, Record<string, SelectedItem[]>> = {};
    
    dailyOffers.forEach(offer => {
      if (!lookup[offer.date]) {
        lookup[offer.date] = {};
      }
      
      offer.daily_offer_items?.forEach(item => {
        if (item.menu_items && item.menu_items.category_id) {
          const categoryId = item.menu_items.category_id;
          if (!lookup[offer.date][categoryId]) {
            lookup[offer.date][categoryId] = [];
          }
          lookup[offer.date][categoryId].push({
            itemId: item.menu_items.id,
            itemName: item.menu_items.name,
            offerId: offer.id,
            offerItemId: item.id,
            imageUrl: item.menu_items.image_url,
            price: item.menu_items.price_huf,
            isMenuPart: item.is_menu_part,
            menuRole: item.menu_role,
          });
        }
      });
    });
    
    return lookup;
  }, [dailyOffers]);

  // Build price lookup: date -> price
  const priceData = useMemo(() => {
    const lookup: Record<string, { offerId: string; price: number | null }> = {};
    dailyOffers.forEach(offer => {
      lookup[offer.date] = { offerId: offer.id, price: offer.price_huf };
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

  // Mutation to update price
  const updatePriceMutation = useMutation({
    mutationFn: async ({ date, price }: { date: string; price: number | null }) => {
      const existingOffer = dailyOffers.find(o => o.date === date);
      
      if (existingOffer) {
        const { error } = await supabase
          .from("daily_offers")
          .update({ price_huf: price })
          .eq("id", existingOffer.id);
        
        if (error) throw error;
      } else {
        // Create new daily_offer with price
        const { error } = await supabase
          .from("daily_offers")
          .insert({ date, price_huf: price });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-offers-week"] });
      toast.success("Ár mentve");
    },
    onError: (error) => {
      console.error("Error updating price:", error);
      toast.error("Hiba történt az ár mentésekor");
    },
  });

  // Mutation to update item price
  const updateItemPriceMutation = useMutation({
    mutationFn: async ({ itemId, price }: { itemId: string; price: number }) => {
      const { error } = await supabase
        .from("menu_items")
        .update({ price_huf: price })
        .eq("id", itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-offers-week"] });
      queryClient.invalidateQueries({ queryKey: ["menu-items-all"] });
      toast.success("Ár mentve");
    },
    onError: (error) => {
      console.error("Error updating item price:", error);
      toast.error("Hiba történt az ár mentésekor");
    },
  });

  const handleAddItem = (date: string, itemId: string) => {
    addItemMutation.mutate({ date, itemId });
  };

  const handleRemoveItem = (offerItemId: string) => {
    removeItemMutation.mutate({ offerItemId });
  };

  const handleDailyPriceChange = (date: string, price: number | null) => {
    updatePriceMutation.mutate({ date, price });
  };

  const handleItemPriceChange = (itemId: string, price: number) => {
    updateItemPriceMutation.mutate({ itemId, price });
  };

  const handleImageUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["daily-offers-week"] });
    queryClient.invalidateQueries({ queryKey: ["menu-items-all"] });
  };

  // Mutation to update menu part status
  const updateMenuPartMutation = useMutation({
    mutationFn: async ({ 
      offerItemId, 
      isMenuPart, 
      menuRole 
    }: { 
      offerItemId: string; 
      isMenuPart: boolean; 
      menuRole: string | null;
    }) => {
      const { error } = await supabase
        .from("daily_offer_items")
        .update({ 
          is_menu_part: isMenuPart, 
          menu_role: menuRole 
        })
        .eq("id", offerItemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-offers-week"] });
      toast.success("Menü beállítás mentve");
    },
    onError: (error) => {
      console.error("Error updating menu part:", error);
      toast.error("Hiba történt a menü beállításakor");
    },
  });

  const handleMenuPartToggle = (offerItemId: string, isMenuPart: boolean, menuRole: string | null) => {
    updateMenuPartMutation.mutate({ offerItemId, isMenuPart, menuRole });
  };

  // Excel export function
  const exportToExcel = () => {
    const exportData: (string | number)[][] = [];
    
    // Header row
    exportData.push([
      "Kategória",
      ...weekDates.map((d) => format(d, "EEEE MM.dd.", { locale: hu })),
    ]);
    
    // Daily menu price row
    exportData.push([
      "Napi menü ár",
      ...weekDates.map((d) => {
        const price = priceData[format(d, "yyyy-MM-dd")]?.price;
        return price ? `${price} Ft` : "-";
      }),
    ]);
    
    // Category rows
    foodCategories.forEach((category) => {
      const row: (string | number)[] = [category.name];
      weekDates.forEach((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const items = gridData[dateStr]?.[category.id] || [];
        row.push(items.map((i) => i.itemName).join(", ") || "-");
      });
      exportData.push(row);
    });
    
    // Create workbook
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Heti Ajánlat");
    
    // Set column widths
    ws["!cols"] = [
      { wch: 20 },
      ...weekDates.map(() => ({ wch: 30 })),
    ];
    
    // Download file
    const startDateStr = format(currentWeekStart, "yyyy-MM-dd");
    const endDateStr = format(addDays(currentWeekStart, 4), "yyyy-MM-dd");
    const fileName = `napi_ajanlatok_${startDateStr}_${endDateStr}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success("Excel exportálva");
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

  const isPending = addItemMutation.isPending || 
    removeItemMutation.isPending || updatePriceMutation.isPending || 
    updateMenuPartMutation.isPending ||
    updateItemPriceMutation.isPending;
  
  const isLoading = offersLoading;

  if (isMobile) {
    return (
      <WeeklyGridMobile
        weekDates={weekDates}
        categories={foodCategories}
        itemsByCategory={itemsByCategory}
        gridData={gridData}
        priceData={priceData}
        categoryColors={CATEGORY_COLORS}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onDailyPriceChange={handleDailyPriceChange}
        onItemPriceChange={handleItemPriceChange}
        onImageUpdated={handleImageUpdated}
        onMenuPartToggle={handleMenuPartToggle}
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onCurrentWeek={goToCurrentWeek}
        isCurrentWeek={isCurrentWeek}
        isLoading={isLoading}
        isPending={isPending}
        onExport={exportToExcel}
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
        
        <div className="flex items-center gap-2">
          {isPending ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Mentés...</span>
            </div>
          ) : !isLoading && (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Check className="h-3 w-3" />
              <span>Mentve</span>
            </div>
          )}
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Grid Table */}
      <ScrollArea className="w-full rounded-lg border">
        <div className="min-w-[900px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="sticky left-0 z-10 bg-muted/50 border-b p-3 text-left font-medium text-sm w-48">
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
              {/* Price Row */}
              <tr className="bg-primary/5">
                <td className="sticky left-0 z-10 bg-primary/5 border-b p-3 font-medium text-sm">
                  Napi menü ár
                </td>
                {weekDates.map((date, idx) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const priceInfo = priceData[dateStr];
                  
                  return (
                    <td key={idx} className="border-b border-l p-2">
                      <DailyPriceInput
                        value={priceInfo?.price ?? null}
                        onChange={(price) => handleDailyPriceChange(dateStr, price)}
                        isPending={updatePriceMutation.isPending}
                      />
                    </td>
                  );
                })}
              </tr>
              
              {/* Category Rows */}
              {foodCategories.map(category => {
                const rowColor = CATEGORY_COLORS[category.name] || "";
                // Extract just the light mode bg class for sticky cell
                const stickyBgColor = CATEGORY_COLORS[category.name] 
                  ? CATEGORY_COLORS[category.name].split(' ')[0]
                  : 'bg-background';
                
                return (
                  <tr key={category.id} className={rowColor}>
                    <td className={`sticky left-0 z-10 border-b p-3 font-medium text-sm ${stickyBgColor}`}>
                      {category.name}
                    </td>
                    {weekDates.map((date, idx) => {
                      const dateStr = format(date, "yyyy-MM-dd");
                      const cellItems = gridData[dateStr]?.[category.id] || [];
                      const categoryItems = itemsByCategory[category.id] || [];
                      
                      return (
                        <td key={idx} className="border-b border-l p-2 align-top">
                          <WeeklyGridCell
                            date={dateStr}
                            categoryId={category.id}
                            categoryName={category.name}
                            items={categoryItems}
                            selectedItems={cellItems}
                            onAddItem={(itemId) => handleAddItem(dateStr, itemId)}
                            onRemoveItem={handleRemoveItem}
                            onImageUpdated={handleImageUpdated}
                            onPriceChange={handleItemPriceChange}
                            onMenuPartToggle={handleMenuPartToggle}
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
