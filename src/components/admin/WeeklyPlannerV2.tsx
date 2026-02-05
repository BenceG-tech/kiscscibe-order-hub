 import { useState, useMemo } from "react";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, isBefore, startOfDay } from "date-fns";
 import { hu } from "date-fns/locale";
 import { Button } from "@/components/ui/button";
 import { ChevronLeft, ChevronRight, Loader2, Check, CalendarDays } from "lucide-react";
 import { toast } from "sonner";
 import { useIsMobile } from "@/hooks/use-mobile";
 import DayCard from "./DayCard";
 import DayDetailSheet from "./DayDetailSheet";
 import MobileWeeklySwiper from "./MobileWeeklySwiper";
 
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
 
 export default function WeeklyPlannerV2() {
   const [currentWeekStart, setCurrentWeekStart] = useState(() =>
     startOfWeek(new Date(), { weekStartsOn: 1 })
   );
   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
   const [sheetOpen, setSheetOpen] = useState(false);
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
     return categories.filter((c) => !["Italok", "Egyéb"].includes(c.name));
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
 
   // Build lookup: date -> items array
   const dayData = useMemo(() => {
     const lookup: Record<string, {
       price: number | null;
       offerId: string | null;
       items: SelectedItem[];
     }> = {};
 
     dailyOffers.forEach((offer) => {
       const items: SelectedItem[] = [];
       offer.daily_offer_items?.forEach((item) => {
         if (item.menu_items) {
           items.push({
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
 
       lookup[offer.date] = {
         price: offer.price_huf,
         offerId: offer.id,
         items,
       };
     });
 
     return lookup;
   }, [dailyOffers]);
 
   // Mutations
   const addItemMutation = useMutation({
     mutationFn: async ({ date, itemId }: { date: string; itemId: string }) => {
       let offerId: string;
 
       const existingOffer = dailyOffers.find((o) => o.date === date);
 
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
       toast.success("Étel hozzáadva");
     },
     onError: (error) => {
       console.error("Error adding item:", error);
       toast.error("Hiba történt");
     },
   });
 
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
       toast.error("Hiba történt");
     },
   });
 
   const updatePriceMutation = useMutation({
     mutationFn: async ({ date, price }: { date: string; price: number | null }) => {
       const existingOffer = dailyOffers.find((o) => o.date === date);
 
       if (existingOffer) {
         const { error } = await supabase
           .from("daily_offers")
           .update({ price_huf: price })
           .eq("id", existingOffer.id);
 
         if (error) throw error;
       } else {
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
       toast.error("Hiba történt");
     },
   });
 
   const updateMenuPartMutation = useMutation({
     mutationFn: async ({
       offerItemId,
       isMenuPart,
       menuRole,
     }: {
       offerItemId: string;
       isMenuPart: boolean;
       menuRole: string | null;
     }) => {
       const { error } = await supabase
         .from("daily_offer_items")
         .update({
           is_menu_part: isMenuPart,
           menu_role: menuRole,
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
       toast.error("Hiba történt");
     },
   });
 
   // Navigation
   const goToPreviousWeek = () => setCurrentWeekStart((prev) => subWeeks(prev, 1));
   const goToNextWeek = () => setCurrentWeekStart((prev) => addWeeks(prev, 1));
   const goToCurrentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
 
   const isCurrentWeek =
     format(currentWeekStart, "yyyy-MM-dd") ===
     format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
 
   const isPending =
     addItemMutation.isPending ||
     removeItemMutation.isPending ||
     updatePriceMutation.isPending ||
     updateMenuPartMutation.isPending;
 
   // Handlers
   const handleEditDay = (date: Date) => {
     setSelectedDate(date);
     setSheetOpen(true);
   };
 
   const handlePriceChange = (date: string, price: number | null) => {
     updatePriceMutation.mutate({ date, price });
   };
 
   const handleAddItem = (date: string, itemId: string) => {
     addItemMutation.mutate({ date, itemId });
   };
 
   const handleRemoveItem = (offerItemId: string) => {
     removeItemMutation.mutate({ offerItemId });
   };
 
   const handleMenuPartToggle = (
     offerItemId: string,
     isMenuPart: boolean,
     menuRole: string | null
   ) => {
     updateMenuPartMutation.mutate({ offerItemId, isMenuPart, menuRole });
   };
 
   // Get selected date's items for the sheet
   const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
   const selectedDayData = selectedDateStr ? dayData[selectedDateStr] : null;
 
   // Mobile view
   if (isMobile) {
     return (
       <>
         <MobileWeeklySwiper
           weekDates={weekDates}
           dayData={dayData}
           onEditDay={handleEditDay}
           onPriceChange={handlePriceChange}
           onPreviousWeek={goToPreviousWeek}
           onNextWeek={goToNextWeek}
           onCurrentWeek={goToCurrentWeek}
           isCurrentWeek={isCurrentWeek}
           isPending={isPending}
           isLoading={offersLoading}
         />
 
         <DayDetailSheet
           open={sheetOpen}
           onOpenChange={setSheetOpen}
           date={selectedDate}
           categories={foodCategories}
           menuItems={menuItems}
           selectedItems={selectedDayData?.items || []}
           onAddItem={handleAddItem}
           onRemoveItem={handleRemoveItem}
           onMenuPartToggle={handleMenuPartToggle}
         />
       </>
     );
   }
 
   return (
     <div className="space-y-6">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
           <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
             <ChevronLeft className="h-4 w-4" />
           </Button>
           <Button variant="outline" size="icon" onClick={goToNextWeek}>
             <ChevronRight className="h-4 w-4" />
           </Button>
           {!isCurrentWeek && (
             <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
               <CalendarDays className="h-4 w-4 mr-2" />
               Ma
             </Button>
           )}
         </div>
 
         <div className="flex items-center gap-3">
           <span className="text-lg font-semibold">
             {format(currentWeekStart, "yyyy. MMMM d.", { locale: hu })} –{" "}
             {format(addDays(currentWeekStart, 4), "MMMM d.", { locale: hu })}
           </span>
         </div>
 
         <div className="flex items-center gap-2">
           {isPending ? (
             <div className="flex items-center gap-1 text-sm text-muted-foreground">
               <Loader2 className="h-4 w-4 animate-spin" />
               <span>Mentés...</span>
             </div>
           ) : !offersLoading ? (
             <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
               <Check className="h-4 w-4" />
               <span>Mentve</span>
             </div>
           ) : (
             <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
           )}
         </div>
       </div>
 
       {/* Day Cards Grid */}
       <div className="grid grid-cols-5 gap-4">
         {weekDates.map((date) => {
           const dateStr = format(date, "yyyy-MM-dd");
           const data = dayData[dateStr];
           const items = data?.items || [];
 
           const soupItem = items.find((i) => i.menuRole === "leves");
           const mainItem = items.find((i) => i.menuRole === "foetel");
           const extraCount = items.filter((i) => !i.isMenuPart).length;
 
           return (
             <DayCard
               key={dateStr}
               date={date}
               price={data?.price ?? null}
               soupItem={soupItem ? { name: soupItem.itemName, id: soupItem.itemId } : null}
               mainItem={mainItem ? { name: mainItem.itemName, id: mainItem.itemId } : null}
               extraCount={extraCount}
               isToday={isToday(date)}
               isPast={isBefore(startOfDay(date), startOfDay(new Date()))}
               onEdit={() => handleEditDay(date)}
               onPriceChange={(price) => handlePriceChange(dateStr, price)}
               isPricePending={updatePriceMutation.isPending}
             />
           );
         })}
       </div>
 
       {/* Detail Sheet */}
       <DayDetailSheet
         open={sheetOpen}
         onOpenChange={setSheetOpen}
         date={selectedDate}
         categories={foodCategories}
         menuItems={menuItems}
         selectedItems={selectedDayData?.items || []}
         onAddItem={handleAddItem}
         onRemoveItem={handleRemoveItem}
         onMenuPartToggle={handleMenuPartToggle}
       />
     </div>
   );
 }